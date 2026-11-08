"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { actionError, zodError } from "@/lib/action-result";
import {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/constants";
import { signSessionToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types";
import { safeCallbackUrl } from "@/lib/utils";
import { loginSchema } from "@/lib/validations";

export async function loginAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return zodError(parsed.error);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
  });

  if (!usuario || !usuario.activo) {
    return actionError("Credenciales inválidas. Verifica tu correo y contraseña.");
  }

  const passwordValida = await verifyPassword(
    parsed.data.password,
    usuario.password,
  );

  if (!passwordValida) {
    return actionError("Credenciales inválidas. Verifica tu correo y contraseña.");
  }

  const token = await signSessionToken({
    userId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  const fallback = usuario.rol === "ADMIN" ? "/admin" : "/pos";
  const requested = safeCallbackUrl(
    formData.get("callbackUrl")?.toString(),
    fallback,
  );

  if (requested.startsWith("/admin") && usuario.rol !== "ADMIN") {
    redirect("/pos");
  }

  redirect(requested);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
