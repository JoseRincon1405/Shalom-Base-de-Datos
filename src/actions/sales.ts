"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import {
  actionError,
  isSerializationError,
  unknownErrorMessage,
  zodError,
} from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_TASA_CAMBIO } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ActionResult, UnidadMedida } from "@/lib/types";
import { formatQuantity, round3 } from "@/lib/utils";
import { saleSchema } from "@/lib/validations";

export type SaleResult = {
  ventaId: string;
  numeroFactura: number;
  totalUSD: number;
  totalVES: number;
  tasaCambio: number;
  fecha: string;
};

class BusinessError extends Error {}

const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Procesa una venta completa dentro de una transacción ACID.
 *
 * - Nunca confía en los precios enviados por el cliente: los relee de la BD.
 * - Valida stock suficiente antes de descontar.
 * - Inserta Venta + DetalleVenta, descuenta stock y registra MovimientoInventario.
 * - Congela la tasa de cambio del día en la venta.
 * - Reintenta ante conflictos de serialización (P2034).
 */
export async function processSaleAction(
  input: unknown,
): Promise<ActionResult<SaleResult>> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Tu sesión expiró. Inicia sesión nuevamente.");
  }

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    merged.set(
      item.productoId,
      round3((merged.get(item.productoId) ?? 0) + item.cantidad),
    );
  }

  const items = Array.from(merged.entries()).map(([productoId, cantidad]) => ({
    productoId,
    cantidad,
  }));

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const productos = await tx.producto.findMany({
            where: { id: { in: items.map((item) => item.productoId) } },
          });

          if (productos.length !== items.length) {
            throw new BusinessError(
              "Uno o más productos del carrito ya no existen. Actualiza el catálogo.",
            );
          }

          const productosPorId = new Map(
            productos.map((producto) => [producto.id, producto]),
          );

          const config = await tx.configuracionSistema.findUnique({
            where: { id: "global" },
            select: { tasaDolarVes: true },
          });

          const tasa = config?.tasaDolarVes
            ? new Prisma.Decimal(config.tasaDolarVes)
            : new Prisma.Decimal(DEFAULT_TASA_CAMBIO);

          const detallesData: Array<{
            productoId: string;
            cantidad: Prisma.Decimal;
            precioUnitarioUSD: Prisma.Decimal;
            subtotalUSD: Prisma.Decimal;
            nombreProducto: string;
            unidadMedida: UnidadMedida;
          }> = [];

          let totalUSD = new Prisma.Decimal(0);

          for (const item of items) {
            const producto = productosPorId.get(item.productoId);
            if (!producto) {
              throw new BusinessError(
                "Uno o más productos del carrito ya no existen.",
              );
            }

            if (!producto.activo) {
              throw new BusinessError(
                `"${producto.nombre}" ya no está disponible para la venta.`,
              );
            }

            const cantidad = new Prisma.Decimal(item.cantidad);

            if (producto.stock.lt(cantidad)) {
              throw new BusinessError(
                `Stock insuficiente de "${producto.nombre}". Disponible: ${formatQuantity(
                  Number(producto.stock.toString()),
                  producto.unidadMedida,
                )}; solicitado: ${formatQuantity(
                  item.cantidad,
                  producto.unidadMedida,
                )}.`,
              );
            }

            if (producto.precioDetalUSD.lte(0)) {
              throw new BusinessError(
                `"${producto.nombre}" no tiene un precio de venta válido.`,
              );
            }

            const subtotalUSD = producto.precioDetalUSD
              .mul(cantidad)
              .toDecimalPlaces(2);

            totalUSD = totalUSD.add(subtotalUSD);

            detallesData.push({
              productoId: producto.id,
              cantidad,
              precioUnitarioUSD: producto.precioDetalUSD,
              subtotalUSD,
              nombreProducto: producto.nombre,
              unidadMedida: producto.unidadMedida,
            });
          }

          const totalFinalUSD = totalUSD.toDecimalPlaces(2);
          const totalVES = totalFinalUSD.mul(tasa).toDecimalPlaces(2);

          const venta = await tx.venta.create({
            data: {
              usuarioId: user.id,
              totalUSD: totalFinalUSD,
              totalVES,
              tasaCambioAplicada: tasa,
              metodoPago: parsed.data.metodoPago,
              detalles: {
                create: detallesData,
              },
            },
            select: { id: true, numeroFactura: true, fecha: true },
          });

          for (const item of items) {
            const producto = productosPorId.get(item.productoId);
            if (!producto) continue;

            const cantidad = new Prisma.Decimal(item.cantidad);
            const stockAnterior = new Prisma.Decimal(producto.stock);
            const stockNuevo = stockAnterior.sub(cantidad);

            if (stockNuevo.lt(0)) {
              throw new BusinessError(
                `Stock insuficiente de "${producto.nombre}".`,
              );
            }

            await tx.producto.update({
              where: { id: producto.id },
              data: { stock: stockNuevo },
            });

            await tx.movimientoInventario.create({
              data: {
                productoId: producto.id,
                usuarioId: user.id,
                tipo: "VENTA",
                cantidad,
                stockAnterior,
                stockNuevo,
                motivo: `Venta #${venta.numeroFactura}`,
              },
            });
          }

          return {
            ventaId: venta.id,
            numeroFactura: venta.numeroFactura,
            totalUSD: totalFinalUSD.toNumber(),
            totalVES: totalVES.toNumber(),
            tasaCambio: tasa.toNumber(),
            fecha: venta.fecha.toISOString(),
          } satisfies SaleResult;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15_000,
        },
      );

      revalidatePath("/pos");
      revalidatePath("/cierre");
      revalidatePath("/admin");
      revalidatePath("/admin/inventario");
      revalidatePath("/admin/reportes");

      return { ok: true, data: result };
    } catch (error) {
      if (error instanceof BusinessError) {
        return actionError(error.message);
      }

      lastError = error;

      if (isSerializationError(error) && attempt < MAX_RETRIES) {
        await sleep(60 * attempt);
        continue;
      }

      return actionError(unknownErrorMessage(error));
    }
  }

  console.error("processSaleAction failed after retries", lastError);
  return actionError(
    "La venta no pudo completarse por un conflicto de concurrencia. Intenta nuevamente.",
  );
}
