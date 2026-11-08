import type { ZodError } from "zod";

import type { ActionResult } from "@/lib/types";

export function actionError<T = undefined>(
  error: string,
): ActionResult<T> {
  return { ok: false, error };
}

export function zodError<T = undefined>(
  error: ZodError,
): ActionResult<T> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "general";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return {
    ok: false,
    error: error.issues[0]?.message ?? "Datos inválidos",
    fieldErrors,
  };
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export function isSerializationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

export function unknownErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Ocurrió un error inesperado. Intenta nuevamente.";
}
