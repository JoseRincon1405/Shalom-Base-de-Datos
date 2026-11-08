-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CAJERO');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('KG', 'GRAMO', 'ML', 'LITRO', 'UNIDAD', 'PAQUETE');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO_USD', 'PAGO_MOVIL', 'ZELLE', 'EFECTIVO_VES', 'MIXTO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'VENTA', 'AJUSTE_MERMA', 'CORRECCION');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "tasaDolarVes" DECIMAL(14,4) NOT NULL,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoPorUsuarioId" TEXT,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(255),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "codigoBarras" VARCHAR(80),
    "nombre" VARCHAR(160) NOT NULL,
    "descripcion" VARCHAR(500),
    "categoriaId" TEXT NOT NULL,
    "unidadMedida" "UnidadMedida" NOT NULL DEFAULT 'UNIDAD',
    "costoCompraUSD" DECIMAL(14,4) NOT NULL,
    "porcentajeGanancia" DECIMAL(8,2) NOT NULL,
    "precioDetalUSD" DECIMAL(14,2) NOT NULL,
    "precioMayorUSD" DECIMAL(14,2),
    "stock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "numeroFactura" SERIAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "totalUSD" DECIMAL(14,2) NOT NULL,
    "totalVES" DECIMAL(14,2) NOT NULL,
    "tasaCambioAplicada" DECIMAL(14,4) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ventas" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "precioUnitarioUSD" DECIMAL(14,2) NOT NULL,
    "subtotalUSD" DECIMAL(14,2) NOT NULL,
    "nombreProducto" VARCHAR(160) NOT NULL,
    "unidadMedida" "UnidadMedida" NOT NULL,

    CONSTRAINT "detalle_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "stockAnterior" DECIMAL(14,3) NOT NULL,
    "stockNuevo" DECIMAL(14,3) NOT NULL,
    "motivo" VARCHAR(255),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_activo_idx" ON "usuarios"("rol", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigoBarras_key" ON "productos"("codigoBarras");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_categoriaId_activo_idx" ON "productos"("categoriaId", "activo");

-- CreateIndex
CREATE INDEX "productos_activo_stock_idx" ON "productos"("activo", "stock");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numeroFactura_key" ON "ventas"("numeroFactura");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_metodoPago_fecha_idx" ON "ventas"("metodoPago", "fecha");

-- CreateIndex
CREATE INDEX "ventas_usuarioId_fecha_idx" ON "ventas"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "detalle_ventas_ventaId_idx" ON "detalle_ventas"("ventaId");

-- CreateIndex
CREATE INDEX "detalle_ventas_productoId_idx" ON "detalle_ventas"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_productoId_fecha_idx" ON "movimientos_inventario"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "movimientos_inventario_usuarioId_fecha_idx" ON "movimientos_inventario"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_fecha_idx" ON "movimientos_inventario"("tipo", "fecha");

-- AddForeignKey
ALTER TABLE "configuracion_sistema" ADD CONSTRAINT "configuracion_sistema_actualizadoPorUsuarioId_fkey" FOREIGN KEY ("actualizadoPorUsuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
