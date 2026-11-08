import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE } from "@/lib/constants";
import { verifySessionToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
    },
  });

  if (!usuario || !usuario.activo) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.rol !== "ADMIN") redirect("/pos");
  return user;
}
