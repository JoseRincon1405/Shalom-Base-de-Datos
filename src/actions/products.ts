"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import {
  actionError,
  isUniqueConstraintError,
  unknownErrorMessage,
  zodError,
} from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";
import { calcularPrecioDetal, round3 } from "@/lib/utils";
import {
  categorySchema,
  productSchema,
  productUpdateSchema,
  stockAdjustmentSchema,
} from "@/lib/validations";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return actionError("Tu sesión expiró. Inicia sesión nuevamente.");
  if (user.rol !== "ADMIN") {
    return actionError("Solo un administrador puede modificar el inventario.");
  }
  return null;
}

function cleanOptional(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function refreshInventoryViews() {
  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  revalidatePath("/pos");
}

export async function createProductAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const admin = await getCurrentUser();
  if (!admin) return actionError("Tu sesión expiró.");

  const data = parsed.data;
  const precioDetal = calcularPrecioDetal(
    data.costoCompraUSD,
    data.porcentajeGanancia,
  );
  const stock = new Prisma.Decimal(round3(data.stock));
  const stockMinimo = new Prisma.Decimal(round3(data.stockMinimo));

  try {
    const producto = await prisma.$transaction(async (tx) => {
      const created = await tx.producto.create({
        data: {
          nombre: data.nombre,
          codigoBarras: cleanOptional(data.codigoBarras),
          descripcion: cleanOptional(data.descripcion),
          categoriaId: data.categoriaId,
          unidadMedida: data.unidadMedida,
          costoCompraUSD: new Prisma.Decimal(data.costoCompraUSD),
          porcentajeGanancia: new Prisma.Decimal(data.porcentajeGanancia),
          precioDetalUSD: new Prisma.Decimal(precioDetal),
          precioMayorUSD:
            data.precioMayorUSD === null || data.precioMayorUSD === undefined
              ? null
              : new Prisma.Decimal(data.precioMayorUSD),
          stock,
          stockMinimo,
          activo: data.activo ?? true,
        },
      });

      await tx.movimientoInventario.create({
        data: {
          productoId: created.id,
          usuarioId: admin.id,
          tipo: "ENTRADA",
          cantidad: stock,
          stockAnterior: new Prisma.Decimal(0),
          stockNuevo: stock,
          motivo: "Registro inicial del producto",
        },
      });

      return created;
    });

    refreshInventoryViews();
    return { ok: true, data: { id: producto.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Ya existe un producto con ese código de barras.");
    }
    return actionError(unknownErrorMessage(error));
  }
}

export async function updateProductAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const admin = await getCurrentUser();
  if (!admin) return actionError("Tu sesión expiró.");

  const data = parsed.data;
  const precioDetal = calcularPrecioDetal(
    data.costoCompraUSD,
    data.porcentajeGanancia,
  );
  const nextStock = new Prisma.Decimal(round3(data.stock));

  try {
    await prisma.$transaction(async (tx) => {
      const actual = await tx.producto.findUnique({
        where: { id: data.id },
        select: { id: true, stock: true },
      });

      if (!actual) {
        throw new Error("El producto no existe o fue eliminado.");
      }

      await tx.producto.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          codigoBarras: cleanOptional(data.codigoBarras),
          descripcion: cleanOptional(data.descripcion),
          categoriaId: data.categoriaId,
          unidadMedida: data.unidadMedida,
          costoCompraUSD: new Prisma.Decimal(data.costoCompraUSD),
          porcentajeGanancia: new Prisma.Decimal(data.porcentajeGanancia),
          precioDetalUSD: new Prisma.Decimal(precioDetal),
          precioMayorUSD:
            data.precioMayorUSD === null || data.precioMayorUSD === undefined
              ? null
              : new Prisma.Decimal(data.precioMayorUSD),
          stock: nextStock,
          stockMinimo: new Prisma.Decimal(round3(data.stockMinimo)),
          activo: data.activo ?? true,
        },
      });

      if (!actual.stock.equals(nextStock)) {
        await tx.movimientoInventario.create({
          data: {
            productoId: data.id,
            usuarioId: admin.id,
            tipo: nextStock.gt(actual.stock) ? "ENTRADA" : "CORRECCION",
            cantidad: nextStock.sub(actual.stock).abs(),
            stockAnterior: actual.stock,
            stockNuevo: nextStock,
            motivo: "Actualización manual de la ficha del producto",
          },
        });
      }
    });

    refreshInventoryViews();
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Ya existe otro producto con ese código de barras.");
    }
    return actionError(unknownErrorMessage(error));
  }
}

export async function adjustStockAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const admin = await getCurrentUser();
  if (!admin) return actionError("Tu sesión expiró.");

  const data = parsed.data;
  const nextStock = new Prisma.Decimal(round3(data.nuevoStock));

  try {
    await prisma.$transaction(async (tx) => {
      const actual = await tx.producto.findUnique({
        where: { id: data.productoId },
        select: { id: true, stock: true, nombre: true },
      });

      if (!actual) {
        throw new Error("El producto no existe o fue eliminado.");
      }

      if (actual.stock.equals(nextStock)) {
        throw new Error("El nuevo stock es igual al stock actual.");
      }

      const delta = nextStock.sub(actual.stock);

      if (data.tipo === "ENTRADA" && delta.lt(0)) {
        throw new Error(
          "Una entrada debe aumentar el stock. Usa un ajuste o corrección para reducirlo.",
        );
      }

      if (data.tipo === "AJUSTE_MERMA" && delta.gt(0)) {
        throw new Error(
          "Una merma debe reducir el stock. Usa una entrada para aumentarlo.",
        );
      }

      await tx.producto.update({
        where: { id: actual.id },
        data: { stock: nextStock },
      });

      await tx.movimientoInventario.create({
        data: {
          productoId: actual.id,
          usuarioId: admin.id,
          tipo: data.tipo,
          cantidad: delta.abs(),
          stockAnterior: actual.stock,
          stockNuevo: nextStock,
          motivo: data.motivo,
        },
      });
    });

    refreshInventoryViews();
    return { ok: true };
  } catch (error) {
    return actionError(unknownErrorMessage(error));
  }
}

export async function toggleProductActiveAction(
  productoId: string,
  activo: boolean,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  try {
    await prisma.producto.update({
      where: { id: productoId },
      data: { activo },
    });
    refreshInventoryViews();
    return { ok: true };
  } catch (error) {
    return actionError(unknownErrorMessage(error));
  }
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const categoria = await prisma.categoria.create({
      data: {
        nombre: parsed.data.nombre,
        descripcion: cleanOptional(parsed.data.descripcion),
      },
      select: { id: true },
    });

    refreshInventoryViews();
    return { ok: true, data: { id: categoria.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Ya existe una categoría con ese nombre.");
    }
    return actionError(unknownErrorMessage(error));
  }
}
