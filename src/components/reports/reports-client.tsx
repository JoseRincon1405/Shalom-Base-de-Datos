"use client";

import {
  CalendarDays,
  ChevronDown,
  Download,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { METODO_PAGO_LABELS } from "@/lib/constants";
import type { MetodoPago, ReporteDTO } from "@/lib/types";
import {
  caracasTodayISO,
  cn,
  formatDateTime,
  formatQuantity,
  formatUSD,
  formatVES,
} from "@/lib/utils";

const PAYMENT_STYLES: Record<MetodoPago, string> = {
  EFECTIVO_USD: "bg-emerald-400",
  PAGO_MOVIL: "bg-sky-400",
  ZELLE: "bg-violet-400",
  EFECTIVO_VES: "bg-amber-400",
  MIXTO: "bg-gold",
};

function shiftDay(isoDay: string, days: number): string {
  const date = new Date(`${isoDay}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ReportsClient({ reporte }: { reporte: ReporteDTO }) {
  const router = useRouter();
  const [desde, setDesde] = useState(reporte.desde);
  const [hasta, setHasta] = useState(reporte.hasta);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ticketPromedio =
    reporte.cantidadVentas > 0
      ? reporte.totalUSD / reporte.cantidadVentas
      : 0;

  const maxPago = useMemo(
    () => Math.max(...reporte.pagos.map((pago) => pago.totalUSD), 1),
    [reporte.pagos],
  );

  function apply(desdeValor: string, hastaValor: string) {
    startTransition(() => {
      router.push(
        `/admin/reportes?desde=${desdeValor}&hasta=${hastaValor}`,
      );
    });
  }

  function quickRange(days: number) {
    const hoy = caracasTodayISO();
    const inicio = shiftDay(hoy, -(days - 1));
    setDesde(inicio);
    setHasta(hoy);
    apply(inicio, hoy);
  }

  function exportCsv() {
    const header = [
      "Factura",
      "Fecha",
      "Cajero",
      "Metodo",
      "Total USD",
      "Total VES",
      "Tasa",
      "Items",
    ];
    const rows = reporte.ventas.map((venta) => [
      venta.numeroFactura,
      new Date(venta.fecha).toISOString(),
      venta.cajero,
      METODO_PAGO_LABELS[venta.metodoPago],
      venta.totalUSD.toFixed(2),
      venta.totalVES.toFixed(2),
      venta.tasaCambioAplicada.toFixed(4),
      venta.detalles.length,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inflow-reporte-${reporte.desde}-a-${reporte.hasta}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Rango de fechas"
          description="Las fechas se interpretan en hora de Venezuela (America/Caracas)."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCsv}
              disabled={reporte.ventas.length === 0}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              Exportar CSV
            </Button>
          }
        />

        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
          <Field label="Desde" htmlFor="rep-desde" className="lg:w-44">
            <Input
              id="rep-desde"
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
            />
          </Field>
          <Field label="Hasta" htmlFor="rep-hasta" className="lg:w-44">
            <Input
              id="rep-hasta"
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
            />
          </Field>
          <Button
            onClick={() => apply(desde, hasta)}
            loading={pending}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            Aplicar rango
          </Button>

          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <Button variant="ghost" size="sm" onClick={() => quickRange(1)}>
              Hoy
            </Button>
            <Button variant="ghost" size="sm" onClick={() => quickRange(7)}>
              7 días
            </Button>
            <Button variant="ghost" size="sm" onClick={() => quickRange(30)}>
              30 días
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Ventas"
          value={reporte.cantidadVentas}
          hint={`${reporte.desde} → ${reporte.hasta}`}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Total USD"
          value={formatUSD(reporte.totalUSD)}
          hint={formatVES(reporte.totalVES)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent
        />
        <StatCard
          label="Ticket promedio"
          value={formatUSD(ticketPromedio)}
          hint="Por factura"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Métodos usados"
          value={reporte.pagos.length}
          hint="Formas de pago distintas"
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title="Ventas del período"
            description="Toca una fila para ver el detalle de la factura."
          />
          {reporte.ventas.length === 0 ? (
            <EmptyState
              title="Sin ventas en este rango"
              description="Prueba con otro rango de fechas."
              icon={<Receipt className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line-soft text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Factura</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Cajero</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {reporte.ventas.map((venta) => {
                    const isOpen = expanded === venta.id;

                    return (
                      <Fragment key={venta.id}>
                        <tr
                          onClick={() =>
                            setExpanded(isOpen ? null : venta.id)
                          }
                          className={cn(
                            "cursor-pointer border-b border-line-soft/70 transition-colors hover:bg-white/[0.02]",
                            isOpen && "bg-white/[0.03]",
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                            #{String(venta.numeroFactura).padStart(5, "0")}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-zinc-500">
                            {formatDateTime(venta.fecha)}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-400">
                            {venta.cajero}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="muted">
                              {METODO_PAGO_LABELS[venta.metodoPago]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-medium text-zinc-100">
                              {formatUSD(venta.totalUSD)}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {formatVES(venta.totalVES)}
                            </p>
                          </td>
                          <td className="px-2 py-3">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-zinc-500 transition-transform",
                                isOpen && "rotate-180 text-gold",
                              )}
                            />
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr className="border-b border-line-soft/70 bg-ink-950/50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="space-y-2">
                                {venta.detalles.map((detalle) => (
                                  <div
                                    key={detalle.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                                  >
                                    <span className="w-24 shrink-0 text-zinc-500">
                                      {formatQuantity(
                                        detalle.cantidad,
                                        detalle.unidadMedida,
                                      )}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-zinc-300">
                                      {detalle.nombreProducto}
                                    </span>
                                    <span className="text-zinc-500">
                                      {formatUSD(detalle.precioUnitarioUSD)} c/u
                                    </span>
                                    <span className="w-20 text-right font-medium text-zinc-200">
                                      {formatUSD(detalle.subtotalUSD)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between border-t border-line-soft pt-2 text-[11px] text-zinc-500">
                                  <span>
                                    Tasa aplicada:{" "}
                                    {venta.tasaCambioAplicada.toFixed(2)} Bs/USD
                                  </span>
                                  <span className="font-medium text-gold-soft">
                                    Total: {formatUSD(venta.totalUSD)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader
            title="Desglose por método"
            description="Distribución de los ingresos del período."
          />
          {reporte.pagos.length === 0 ? (
            <EmptyState title="Sin pagos registrados" />
          ) : (
            <div className="space-y-4 p-4">
              {reporte.pagos.map((pago) => {
                const porcentaje =
                  reporte.totalUSD > 0
                    ? (pago.totalUSD / reporte.totalUSD) * 100
                    : 0;

                return (
                  <div key={pago.metodoPago} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">
                        {METODO_PAGO_LABELS[pago.metodoPago]}
                      </span>
                      <span className="text-zinc-500">
                        {pago.cantidadVentas} venta
                        {pago.cantidadVentas === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          PAYMENT_STYLES[pago.metodoPago],
                        )}
                        style={{
                          width: `${Math.max(
                            (pago.totalUSD / maxPago) * 100,
                            4,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">
                        {porcentaje.toFixed(1)}% del total
                      </span>
                      <span className="font-medium text-zinc-200">
                        {formatUSD(pago.totalUSD)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-1 border-t border-line-soft pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Total USD</span>
                  <span className="font-semibold text-gold-soft">
                    {formatUSD(reporte.totalUSD)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Total referencial Bs</span>
                  <span className="text-zinc-300">
                    {formatVES(reporte.totalVES)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
