import type { MetodoPago, Rol, TipoMovimiento, UnidadMedida } from "@/lib/types";

export const APP_NAME = "inFlow";
export const APP_DESCRIPTION =
  "Inventario y punto de venta para insumos de repostería";

export const SESSION_COOKIE = "inflow_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;
export const DEFAULT_TASA_CAMBIO = 36.5;

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: "Administrador",
  CAJERO: "Cajero",
};

export const UNIDAD_MEDIDA_LABELS: Record<UnidadMedida, string> = {
  KG: "Kilogramo",
  GRAMO: "Gramo",
  ML: "Mililitro",
  LITRO: "Litro",
  UNIDAD: "Unidad",
  PAQUETE: "Paquete",
};

export const UNIDAD_MEDIDA_SHORT: Record<UnidadMedida, string> = {
  KG: "kg",
  GRAMO: "g",
  ML: "ml",
  LITRO: "L",
  UNIDAD: "und",
  PAQUETE: "paq",
};

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO_USD: "Efectivo USD",
  PAGO_MOVIL: "Pago Móvil",
  ZELLE: "Zelle",
  EFECTIVO_VES: "Efectivo Bs",
  MIXTO: "Mixto",
};

export const METODO_PAGO_OPTIONS = (
  Object.keys(METODO_PAGO_LABELS) as MetodoPago[]
).map((value) => ({ value, label: METODO_PAGO_LABELS[value] }));

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ENTRADA: "Entrada",
  VENTA: "Venta",
  AJUSTE_MERMA: "Ajuste / merma",
  CORRECCION: "Corrección",
};

export const UNIDAD_MEDIDA_OPTIONS = (
  Object.keys(UNIDAD_MEDIDA_LABELS) as UnidadMedida[]
).map((value) => ({ value, label: UNIDAD_MEDIDA_LABELS[value] }));

export const ROL_OPTIONS = (Object.keys(ROL_LABELS) as Rol[]).map((value) => ({
  value,
  label: ROL_LABELS[value],
}));
