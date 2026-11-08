export type Rol = "ADMIN" | "CAJERO";

export type UnidadMedida =
  | "KG"
  | "GRAMO"
  | "ML"
  | "LITRO"
  | "UNIDAD"
  | "PAQUETE";

export type MetodoPago =
  | "EFECTIVO_USD"
  | "PAGO_MOVIL"
  | "ZELLE"
  | "EFECTIVO_VES"
  | "MIXTO";

export type TipoMovimiento =
  | "ENTRADA"
  | "VENTA"
  | "AJUSTE_MERMA"
  | "CORRECCION";

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

export type CategoriaDTO = {
  id: string;
  nombre: string;
  descripcion: string | null;
  totalProductos?: number;
};

export type ProductoDTO = {
  id: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  categoriaId: string;
  categoria: string;
  unidadMedida: UnidadMedida;
  costoCompraUSD: number;
  porcentajeGanancia: number;
  precioDetalUSD: number;
  precioMayorUSD: number | null;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  bajoStock: boolean;
};

export type UsuarioDTO = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
  ventas?: number;
};

export type CartItem = {
  productoId: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  precioUnitarioUSD: number;
  stock: number;
  cantidad: number;
};

export type VentaDetalleDTO = {
  id: string;
  nombreProducto: string;
  unidadMedida: UnidadMedida;
  cantidad: number;
  precioUnitarioUSD: number;
  subtotalUSD: number;
};

export type VentaDTO = {
  id: string;
  numeroFactura: number;
  fecha: string;
  cajero: string;
  metodoPago: MetodoPago;
  totalUSD: number;
  totalVES: number;
  tasaCambioAplicada: number;
  detalles: VentaDetalleDTO[];
};

export type PagoResumenDTO = {
  metodoPago: MetodoPago;
  cantidadVentas: number;
  totalUSD: number;
  totalVES: number;
};

export type ReporteDTO = {
  desde: string;
  hasta: string;
  cantidadVentas: number;
  totalUSD: number;
  totalVES: number;
  pagos: PagoResumenDTO[];
  ventas: VentaDTO[];
};

export type MovimientoDTO = {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  producto: string;
  usuario: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
