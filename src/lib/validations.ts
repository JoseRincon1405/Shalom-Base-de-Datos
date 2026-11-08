import { z } from "zod";

export const ROLES = ["ADMIN", "CAJERO"] as const;
export const UNIDADES_MEDIDA = [
  "KG",
  "GRAMO",
  "ML",
  "LITRO",
  "UNIDAD",
  "PAQUETE",
] as const;
export const METODOS_PAGO = [
  "EFECTIVO_USD",
  "PAGO_MOVIL",
  "ZELLE",
  "EFECTIVO_VES",
  "MIXTO",
] as const;
export const TIPOS_AJUSTE = ["ENTRADA", "AJUSTE_MERMA", "CORRECCION"] as const;

const nonNegative = (message: string) =>
  z.number({ message }).finite().min(0, message);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido")
    .max(160, "El correo es demasiado largo")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .max(72, "La contraseña es demasiado larga"),
});

export const categorySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .nullable(),
});

export const productSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(160, "Máximo 160 caracteres"),
  codigoBarras: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .nullable(),
  descripcion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .nullable(),
  categoriaId: z.string().min(1, "Selecciona una categoría"),
  unidadMedida: z.enum(UNIDADES_MEDIDA, {
    message: "Selecciona una unidad de medida válida",
  }),
  costoCompraUSD: nonNegative("El costo debe ser mayor o igual a 0"),
  porcentajeGanancia: z
    .number({ message: "Ingresa un porcentaje válido" })
    .finite()
    .min(0, "El porcentaje no puede ser negativo")
    .max(100000, "El porcentaje es demasiado alto"),
  precioMayorUSD: z
    .number()
    .finite()
    .min(0, "El precio mayorista no puede ser negativo")
    .nullable()
    .optional(),
  stock: nonNegative("El stock debe ser mayor o igual a 0"),
  stockMinimo: nonNegative("El stock mínimo debe ser mayor o igual a 0"),
  activo: z.boolean().optional(),
});

export const productUpdateSchema = productSchema.extend({
  id: z.string().min(1, "Producto inválido"),
});

export const stockAdjustmentSchema = z.object({
  productoId: z.string().min(1, "Producto inválido"),
  nuevoStock: nonNegative("El nuevo stock debe ser mayor o igual a 0"),
  tipo: z.enum(TIPOS_AJUSTE, { message: "Tipo de ajuste inválido" }),
  motivo: z
    .string()
    .trim()
    .min(3, "Describe el motivo del ajuste")
    .max(255, "Máximo 255 caracteres"),
});

export const saleItemSchema = z.object({
  productoId: z.string().min(1, "Producto inválido"),
  cantidad: z
    .number({ message: "Cantidad inválida" })
    .finite()
    .positive("La cantidad debe ser mayor a 0")
    .max(1_000_000, "Cantidad fuera de rango"),
});

export const saleSchema = z.object({
  items: z
    .array(saleItemSchema)
    .min(1, "Agrega al menos un producto al carrito")
    .max(100, "Demasiados productos en una sola venta"),
  metodoPago: z.enum(METODOS_PAGO, {
    message: "Selecciona un método de pago válido",
  }),
});

export const createUserSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido")
    .max(160, "El correo es demasiado largo")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga")
    .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
    .regex(/[0-9]/, "Debe incluir al menos un número"),
  rol: z.enum(ROLES, { message: "Selecciona un rol válido" }),
});

export const updateUserSchema = z.object({
  id: z.string().min(1, "Usuario inválido"),
  rol: z.enum(ROLES, { message: "Selecciona un rol válido" }).optional(),
  activo: z.boolean().optional(),
});

export const rateSchema = z.object({
  tasaDolarVes: z
    .number({ message: "Ingresa una tasa válida" })
    .finite()
    .positive("La tasa debe ser mayor a 0")
    .max(1_000_000, "La tasa es demasiado alta"),
});

export const reportRangeSchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type RateInput = z.infer<typeof rateSchema>;
export type ReportRangeInput = z.infer<typeof reportRangeSchema>;
