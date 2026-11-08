import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en el archivo .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function precio(costo: number, margen: number): number {
  return Math.round(costo * (1 + margen / 100) * 100) / 100;
}

const CATEGORIAS = [
  {
    nombre: "Harinas",
    descripcion: "Harinas, almidones y féculas para repostería",
  },
  {
    nombre: "Moldes",
    descripcion: "Moldes metálicos, de silicona y desechables",
  },
  {
    nombre: "Esencias",
    descripcion: "Esencias y extractos para aromatizar",
  },
  {
    nombre: "Chocolates",
    descripcion: "Chocolate de cobertura, semiamargo y blanco",
  },
  {
    nombre: "Empaques",
    descripcion: "Cajas, bolsas, papel manteca y bases",
  },
  {
    nombre: "Decoración",
    descripcion: "Colorantes, sprinkles, fondant y herramientas",
  },
] as const;

const PRODUCTOS = [
  {
    nombre: "Harina de trigo todo uso",
    codigoBarras: "7591001000011",
    categoria: "Harinas",
    unidadMedida: "KG" as const,
    costoCompraUSD: 1.2,
    porcentajeGanancia: 45,
    stock: 25,
    stockMinimo: 5,
  },
  {
    nombre: "Azúcar granulada",
    codigoBarras: "7591001000028",
    categoria: "Harinas",
    unidadMedida: "KG" as const,
    costoCompraUSD: 0.9,
    porcentajeGanancia: 40,
    stock: 30,
    stockMinimo: 5,
  },
  {
    nombre: "Fécula de maíz",
    codigoBarras: "7591001000035",
    categoria: "Harinas",
    unidadMedida: "KG" as const,
    costoCompraUSD: 1.4,
    porcentajeGanancia: 40,
    stock: 18,
    stockMinimo: 4,
  },
  {
    nombre: "Chocolate semiamargo",
    codigoBarras: "7591002000010",
    categoria: "Chocolates",
    unidadMedida: "KG" as const,
    costoCompraUSD: 4.5,
    porcentajeGanancia: 55,
    stock: 12.5,
    stockMinimo: 3,
  },
  {
    nombre: "Cacao en polvo",
    codigoBarras: "7591002000027",
    categoria: "Chocolates",
    unidadMedida: "KG" as const,
    costoCompraUSD: 5.2,
    porcentajeGanancia: 50,
    stock: 3,
    stockMinimo: 4,
  },
  {
    nombre: "Esencia de vainilla",
    codigoBarras: "7591003000019",
    categoria: "Esencias",
    unidadMedida: "ML" as const,
    costoCompraUSD: 0.012,
    porcentajeGanancia: 120,
    stock: 500,
    stockMinimo: 100,
  },
  {
    nombre: "Colorante rojo en gel",
    codigoBarras: "7591006000016",
    categoria: "Decoración",
    unidadMedida: "ML" as const,
    costoCompraUSD: 0.03,
    porcentajeGanancia: 100,
    stock: 250,
    stockMinimo: 50,
  },
  {
    nombre: "Molde redondo 20 cm",
    codigoBarras: "7591004000018",
    categoria: "Moldes",
    unidadMedida: "UNIDAD" as const,
    costoCompraUSD: 3.5,
    porcentajeGanancia: 60,
    stock: 8,
    stockMinimo: 2,
  },
  {
    nombre: "Caja para torta 25 cm",
    codigoBarras: "7591005000017",
    categoria: "Empaques",
    unidadMedida: "PAQUETE" as const,
    costoCompraUSD: 1.1,
    porcentajeGanancia: 70,
    stock: 20,
    stockMinimo: 5,
  },
  {
    nombre: "Papel manteca",
    codigoBarras: "7591005000024",
    categoria: "Empaques",
    unidadMedida: "PAQUETE" as const,
    costoCompraUSD: 2,
    porcentajeGanancia: 45,
    stock: 4,
    stockMinimo: 5,
  },
];

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const cajeroPassword = await bcrypt.hash("Cajero123!", 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@inflow.local" },
    update: {},
    create: {
      nombre: "Administrador inFlow",
      email: "admin@inflow.local",
      password: adminPassword,
      rol: "ADMIN",
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cajero@inflow.local" },
    update: {},
    create: {
      nombre: "Cajero de mostrador",
      email: "cajero@inflow.local",
      password: cajeroPassword,
      rol: "CAJERO",
      activo: true,
    },
  });

  await prisma.configuracionSistema.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      tasaDolarVes: new Prisma.Decimal("36.5000"),
      actualizadoPorUsuarioId: admin.id,
    },
  });

  const categoriasPorNombre = new Map<string, string>();

  for (const categoria of CATEGORIAS) {
    const creada = await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: { descripcion: categoria.descripcion },
      create: categoria,
    });
    categoriasPorNombre.set(creada.nombre, creada.id);
  }

  let productosCreados = 0;

  for (const producto of PRODUCTOS) {
    const existe = await prisma.producto.findFirst({
      where: { nombre: producto.nombre },
      select: { id: true },
    });

    if (existe) continue;

    const categoriaId = categoriasPorNombre.get(producto.categoria);
    if (!categoriaId) continue;

    const precioDetal = precio(
      producto.costoCompraUSD,
      producto.porcentajeGanancia,
    );

    await prisma.$transaction(async (tx) => {
      const creado = await tx.producto.create({
        data: {
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          descripcion: `${producto.nombre} — insumo de repostería`,
          categoriaId,
          unidadMedida: producto.unidadMedida,
          costoCompraUSD: new Prisma.Decimal(producto.costoCompraUSD),
          porcentajeGanancia: new Prisma.Decimal(producto.porcentajeGanancia),
          precioDetalUSD: new Prisma.Decimal(precioDetal),
          precioMayorUSD: new Prisma.Decimal(
            Math.round(precioDetal * 0.9 * 100) / 100,
          ),
          stock: new Prisma.Decimal(producto.stock),
          stockMinimo: new Prisma.Decimal(producto.stockMinimo),
          activo: true,
        },
      });

      await tx.movimientoInventario.create({
        data: {
          productoId: creado.id,
          usuarioId: admin.id,
          tipo: "ENTRADA",
          cantidad: new Prisma.Decimal(producto.stock),
          stockAnterior: new Prisma.Decimal(0),
          stockNuevo: new Prisma.Decimal(producto.stock),
          motivo: "Carga inicial del seed",
        },
      });
    });

    productosCreados += 1;
  }

  console.log("");
  console.log("  inFlow — seed completado");
  console.log("  ─────────────────────────────────────────");
  console.log(`  Admin:  admin@inflow.local  / Admin123!`);
  console.log(`  Cajero: cajero@inflow.local / Cajero123!`);
  console.log(`  Categorías: ${CATEGORIAS.length}`);
  console.log(`  Productos nuevos: ${productosCreados}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
