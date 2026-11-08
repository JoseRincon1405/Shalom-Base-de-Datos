import { connection } from "next/server";

import { DEFAULT_TASA_CAMBIO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type {
  CategoriaDTO,
  MetodoPago,
  MovimientoDTO,
  PagoResumenDTO,
  ProductoDTO,
  ReporteDTO,
  UsuarioDTO,
  VentaDTO,
} from "@/lib/types";
import {
  caracasDayRange,
  caracasTodayISO,
  parseDateInput,
  toNumber,
} from "@/lib/utils";

type ProductoConCategoria = {
  id: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  categoriaId: string;
  unidadMedida: ProductoDTO["unidadMedida"];
  costoCompraUSD: unknown;
  porcentajeGanancia: unknown;
  precioDetalUSD: unknown;
  precioMayorUSD: unknown;
  stock: unknown;
  stockMinimo: unknown;
  activo: boolean;
  categoria: { nombre: string };
};

function mapProducto(producto: ProductoConCategoria): ProductoDTO {
  const stock = toNumber(producto.stock);
  const stockMinimo = toNumber(producto.stockMinimo);

  return {
    id: producto.id,
    codigoBarras: producto.codigoBarras,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    categoriaId: producto.categoriaId,
    categoria: producto.categoria.nombre,
    unidadMedida: producto.unidadMedida,
    costoCompraUSD: toNumber(producto.costoCompraUSD),
    porcentajeGanancia: toNumber(producto.porcentajeGanancia),
    precioDetalUSD: toNumber(producto.precioDetalUSD),
    precioMayorUSD:
      producto.precioMayorUSD === null
        ? null
        : toNumber(producto.precioMayorUSD),
    stock,
    stockMinimo,
    activo: producto.activo,
    bajoStock: stock <= stockMinimo,
  };
}

export async function getTasaActual(): Promise<number> {
  await connection();

  const config = await prisma.configuracionSistema.findUnique({
    where: { id: "global" },
    select: { tasaDolarVes: true },
  });

  return config ? toNumber(config.tasaDolarVes) : DEFAULT_TASA_CAMBIO;
}

export async function getCategorias(): Promise<CategoriaDTO[]> {
  await connection();

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  return categorias.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
    totalProductos: categoria._count.productos,
  }));
}

export async function getProductosPOS(): Promise<ProductoDTO[]> {
  await connection();

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    include: { categoria: { select: { nombre: true } } },
  });

  return productos.map(mapProducto);
}

export async function getPosData(): Promise<{
  productos: ProductoDTO[];
  categorias: CategoriaDTO[];
  tasa: number;
}> {
  const [productos, categorias, tasa] = await Promise.all([
    getProductosPOS(),
    getCategorias(),
    getTasaActual(),
  ]);

  return { productos, categorias, tasa };
}

export async function getInventarioData(): Promise<{
  productos: ProductoDTO[];
  categorias: CategoriaDTO[];
  movimientos: MovimientoDTO[];
}> {
  await connection();

  const [productos, categorias, movimientos] = await Promise.all([
    prisma.producto.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
      include: { categoria: { select: { nombre: true } } },
    }),
    getCategorias(),
    prisma.movimientoInventario.findMany({
      orderBy: { fecha: "desc" },
      take: 40,
      include: {
        producto: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
      },
    }),
  ]);

  return {
    productos: productos.map(mapProducto),
    categorias,
    movimientos: movimientos.map((movimiento) => ({
      id: movimiento.id,
      fecha: movimiento.fecha.toISOString(),
      tipo: movimiento.tipo,
      producto: movimiento.producto.nombre,
      usuario: movimiento.usuario.nombre,
      cantidad: toNumber(movimiento.cantidad),
      stockAnterior: toNumber(movimiento.stockAnterior),
      stockNuevo: toNumber(movimiento.stockNuevo),
      motivo: movimiento.motivo,
    })),
  };
}

export async function getUsuarios(): Promise<UsuarioDTO[]> {
  await connection();

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { creadoEn: "desc" }],
    include: { _count: { select: { ventas: true } } },
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    creadoEn: usuario.creadoEn.toISOString(),
    ventas: usuario._count.ventas,
  }));
}

function mapVenta(
  venta: {
    id: string;
    numeroFactura: number;
    fecha: Date;
    metodoPago: MetodoPago;
    totalUSD: unknown;
    totalVES: unknown;
    tasaCambioAplicada: unknown;
    usuario: { nombre: string };
    detalles: Array<{
      id: string;
      nombreProducto: string;
      unidadMedida: ProductoDTO["unidadMedida"];
      cantidad: unknown;
      precioUnitarioUSD: unknown;
      subtotalUSD: unknown;
    }>;
  },
): VentaDTO {
  return {
    id: venta.id,
    numeroFactura: venta.numeroFactura,
    fecha: venta.fecha.toISOString(),
    cajero: venta.usuario.nombre,
    metodoPago: venta.metodoPago,
    totalUSD: toNumber(venta.totalUSD),
    totalVES: toNumber(venta.totalVES),
    tasaCambioAplicada: toNumber(venta.tasaCambioAplicada),
    detalles: venta.detalles.map((detalle) => ({
      id: detalle.id,
      nombreProducto: detalle.nombreProducto,
      unidadMedida: detalle.unidadMedida,
      cantidad: toNumber(detalle.cantidad),
      precioUnitarioUSD: toNumber(detalle.precioUnitarioUSD),
      subtotalUSD: toNumber(detalle.subtotalUSD),
    })),
  };
}

export async function getReporte(
  desdeInput?: string,
  hastaInput?: string,
): Promise<ReporteDTO> {
  await connection();

  const desdeISO = parseDateInput(desdeInput);
  const hastaISO = parseDateInput(hastaInput);

  const [desdeFinal, hastaFinal] =
    desdeISO <= hastaISO ? [desdeISO, hastaISO] : [hastaISO, desdeISO];

  const desde = caracasDayRange(desdeFinal).desde;
  const hasta = caracasDayRange(hastaFinal).hasta;

  const where = { fecha: { gte: desde, lte: hasta } };

  const [ventas, totales, pagos] = await Promise.all([
    prisma.venta.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 150,
      include: {
        usuario: { select: { nombre: true } },
        detalles: true,
      },
    }),
    prisma.venta.aggregate({
      where,
      _sum: { totalUSD: true, totalVES: true },
      _count: { _all: true },
    }),
    prisma.venta.groupBy({
      by: ["metodoPago"],
      where,
      _sum: { totalUSD: true, totalVES: true },
      _count: { _all: true },
    }),
  ]);

  const pagosDTO: PagoResumenDTO[] = pagos
    .map((pago) => ({
      metodoPago: pago.metodoPago,
      cantidadVentas: pago._count._all,
      totalUSD: toNumber(pago._sum.totalUSD),
      totalVES: toNumber(pago._sum.totalVES),
    }))
    .sort((a, b) => b.totalUSD - a.totalUSD);

  return {
    desde: desdeFinal,
    hasta: hastaFinal,
    cantidadVentas: totales._count._all,
    totalUSD: toNumber(totales._sum.totalUSD),
    totalVES: toNumber(totales._sum.totalVES),
    pagos: pagosDTO,
    ventas: ventas.map(mapVenta),
  };
}

export async function getCierre(): Promise<ReporteDTO> {
  const hoy = caracasTodayISO();
  return getReporte(hoy, hoy);
}

export async function getDashboardData(): Promise<{
  tasa: number;
  ventasHoy: { cantidad: number; totalUSD: number; totalVES: number };
  ticketPromedioUSD: number;
  productosActivos: number;
  productosBajoStock: ProductoDTO[];
  usuariosActivos: number;
  ultimasVentas: VentaDTO[];
}> {
  await connection();

  const hoy = caracasTodayISO();
  const { desde, hasta } = caracasDayRange(hoy);

  const [tasa, ventasHoy, productos, usuariosActivos, ultimasVentas] =
    await Promise.all([
      getTasaActual(),
      prisma.venta.aggregate({
        where: { fecha: { gte: desde, lte: hasta } },
        _sum: { totalUSD: true, totalVES: true },
        _count: { _all: true },
      }),
      prisma.producto.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        include: { categoria: { select: { nombre: true } } },
      }),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.venta.findMany({
        where: { fecha: { gte: desde, lte: hasta } },
        orderBy: { fecha: "desc" },
        take: 5,
        include: {
          usuario: { select: { nombre: true } },
          detalles: true,
        },
      }),
    ]);

  const productosDTO = productos.map(mapProducto);
  const cantidadVentas = ventasHoy._count._all;
  const totalUSD = toNumber(ventasHoy._sum.totalUSD);

  return {
    tasa,
    ventasHoy: {
      cantidad: cantidadVentas,
      totalUSD,
      totalVES: toNumber(ventasHoy._sum.totalVES),
    },
    ticketPromedioUSD: cantidadVentas > 0 ? totalUSD / cantidadVentas : 0,
    productosActivos: productosDTO.length,
    productosBajoStock: productosDTO
      .filter((producto) => producto.bajoStock)
      .slice(0, 6),
    usuariosActivos,
    ultimasVentas: ultimasVentas.map(mapVenta),
  };
}
