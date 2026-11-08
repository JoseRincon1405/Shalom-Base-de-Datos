"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  unknownErrorMessage,
  zodError,
} from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";
import { rateSchema } from "@/lib/validations";

export async function updateRateAction(
  input: unknown,
): Promise<ActionResult<{ tasa: number; actualizadoEn: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Tu sesión expiró. Inicia sesión nuevamente.");
  }
  if (user.rol !== "ADMIN") {
    return actionError("Solo un administrador puede actualizar la tasa.");
  }

  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const config = await prisma.configuracionSistema.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        tasaDolarVes: parsed.data.tasaDolarVes,
        actualizadoPorUsuarioId: user.id,
      },
      update: {
        tasaDolarVes: parsed.data.tasaDolarVes,
        actualizadoPorUsuarioId: user.id,
      },
      select: { tasaDolarVes: true, ultimaActualizacion: true },
    });

    revalidatePath("/pos");
    revalidatePath("/cierre");
    revalidatePath("/admin");
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/reportes");

    return {
      ok: true,
      data: {
        tasa: Number(config.tasaDolarVes.toString()),
        actualizadoEn: config.ultimaActualizacion.toISOString(),
      },
    };
  } catch (error) {
    return actionError(unknownErrorMessage(error));
  }
}
