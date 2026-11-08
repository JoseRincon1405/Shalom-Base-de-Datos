import { UNIDAD_MEDIDA_SHORT } from "@/lib/constants";
import type { UnidadMedida as UnidadMedidaTipo } from "@/lib/types";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function round2(value: number): number {
  return round(value, 2);
}

export function round3(value: number): number {
  return round(value, 3);
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value !== null && value !== undefined) {
    const candidate = Number(value);
    return Number.isFinite(candidate) ? candidate : 0;
  }
  return 0;
}

export function calcularPrecioDetal(
  costoCompraUSD: number,
  porcentajeGanancia: number,
): number {
  return round2(costoCompraUSD * (1 + porcentajeGanancia / 100));
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(round2(value));
}

export function formatVES(value: number): string {
  return `Bs ${new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(round2(value))}`;
}

export function formatCompactUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatQuantity(
  value: number,
  unidad: UnidadMedidaTipo,
): string {
  const decimals =
    unidad === "UNIDAD" || unidad === "PAQUETE"
      ? 0
      : value % 1 === 0
        ? 0
        : 3;
  return `${new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)} ${UNIDAD_MEDIDA_SHORT[unidad]}`;
}

export function isFractionalUnit(unidad: UnidadMedidaTipo): boolean {
  return unidad !== "UNIDAD" && unidad !== "PAQUETE";
}

export function quantityStep(unidad: UnidadMedidaTipo): number {
  switch (unidad) {
    case "KG":
    case "LITRO":
      return 0.25;
    case "GRAMO":
    case "ML":
      return 1;
    default:
      return 1;
  }
}

export function minimumQuantity(unidad: UnidadMedidaTipo): number {
  return isFractionalUnit(unidad) ? 0.001 : 1;
}

export function normalizeQuantity(
  value: number,
  unidad: UnidadMedidaTipo,
): number {
  if (!Number.isFinite(value)) return minimumQuantity(unidad);
  if (isFractionalUnit(unidad)) {
    return Math.max(minimumQuantity(unidad), round3(value));
  }
  return Math.max(1, Math.round(value));
}

export function clampQuantity(
  value: number,
  stock: number,
  unidad: UnidadMedidaTipo,
): number {
  const normalized = normalizeQuantity(value, unidad);
  const max = isFractionalUnit(unidad) ? round3(stock) : Math.floor(stock);
  return Math.min(normalized, Math.max(max, 0));
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return DATETIME_FORMATTER.format(new Date(value));
}

export function formatTime(value: Date | string): string {
  return TIME_FORMATTER.format(new Date(value));
}

export function caracasTodayISO(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDateInput(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return caracasTodayISO();
  }
  return value;
}

export function caracasDayRange(isoDay: string): { desde: Date; hasta: Date } {
  const desde = new Date(`${isoDay}T00:00:00-04:00`);
  const hasta = new Date(`${isoDay}T23:59:59.999-04:00`);
  return { desde, hasta };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function safeCallbackUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
