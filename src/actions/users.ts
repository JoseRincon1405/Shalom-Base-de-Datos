"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  isUniqueConstraintError,
  unknownErrorMessage,
  zodError,
} from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";
import { createUserSchema, updateUserSchema } from "@/lib/validations";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return actionError("Tu sesión expiró. Inicia sesión nuevamente.");
  if (user.rol !== "ADMIN") {
    return actionError("Solo un administrador puede gestionar usuarios.");
  }
  return null;
}

export async function createUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const password = await hashPassword(parsed.data.password);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        password,
        rol: parsed.data.rol,
        activo: true,
      },
      select: { id: true },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { ok: true, data: { id: usuario.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Ya existe un usuario con ese correo.");
    }
    return actionError(unknownErrorMessage(error));
  }
}

export async function updateUserAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const admin = await getCurrentUser();
  if (!admin) return actionError("Tu sesión expiró.");

  const target = await prisma.usuario.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, rol: true, activo: true, nombre: true },
  });

  if (!target) return actionError("El usuario no existe.");

  const nextRol = parsed.data.rol ?? target.rol;
  const nextActivo = parsed.data.activo ?? target.activo;
  const losesAdmin =
    target.rol === "ADMIN" && (nextRol !== "ADMIN" || !nextActivo);

  if (target.id === admin.id && (nextRol !== "ADMIN" || !nextActivo)) {
    return actionError(
      "No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.",
    );
  }

  if (losesAdmin) {
    const otrosAdmins = await prisma.usuario.count({
      where: {
        rol: "ADMIN",
        activo: true,
        id: { not: target.id },
      },
    });

    if (otrosAdmins === 0) {
      return actionError(
        "Debe existir al menos un administrador activo en el sistema.",
      );
    }
  }

  try {
    await prisma.usuario.update({
      where: { id: target.id },
      data: {
        rol: nextRol,
        activo: nextActivo,
      },
    });

    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (error) {
    return actionError(unknownErrorMessage(error));
  }
}

export async function toggleUserActiveAction(
  userId: string,
  activo: boolean,
): Promise<ActionResult> {
  return updateUserAction({ id: userId, activo });
}
