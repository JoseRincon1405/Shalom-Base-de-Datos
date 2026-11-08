import { SignJWT, jwtVerify } from "jose";

import { SESSION_DURATION_SECONDS } from "@/lib/constants";
import type { Rol } from "@/lib/types";

export type SessionPayload = {
  userId: string;
  nombre: string;
  email: string;
  rol: Rol;
};

const FALLBACK_SECRET =
  "inflow-development-secret-change-me-before-deploying-to-production";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? FALLBACK_SECRET;
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    nombre: payload.nombre,
    email: payload.email,
    rol: payload.rol,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.nombre !== "string" ||
      typeof payload.email !== "string" ||
      (payload.rol !== "ADMIN" && payload.rol !== "CAJERO")
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
    };
  } catch {
    return null;
  }
}
