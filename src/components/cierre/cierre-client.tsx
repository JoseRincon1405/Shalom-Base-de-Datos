"use client";

import {
  CalendarDays,
  ChevronDown,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  Trophy,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { METODO_PAGO_LABELS, UNIDAD_MEDIDA_SHORT } from "@/lib/constants";
import type { ReporteDTO } from "@/lib/types";
import {
  cn,
  formatDate,
  formatDateTime,
  formatQuantity,
  formatUSD,
  formatVES,
  round2,
} from "@/lib/utils";

export function CierreClient({
  reporte,
  tasa,
}: {
  reporte: ReporteDTO;
  tasa: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ticketPromedio =
    reporte.cantidadVentas > 0
      ? reporte.totalUSD / reporte.cantidadVentas
      : 0;

  const topProductos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        unidad: ReporteDTO["ventas"][number]["detalles"][number]["unidadMedida"];
        cantidad: number;
        totalUSD: number;
      }
    >();

    for (const venta of reporte.ventas) {
      for (const detalle of venta.detalles) {
        const key = detalle.nombreProducto;
        const actual = mapa.get(key);

        if (actual) {
          actual.cantidad += detalle.cantidad;
          actual.totalUSD += detalle.subtotalUSD;
        } else {
          mapa.set(key, {
            nombre: detalle.nombreProducto,
            unidad: detalle.unidadMedida,
            cantidad: detalle.cantidad,
            totalUSD: detalle.subtotalUSD,
          });
        }
      }
    }

    return [...mapa.values()]
      .sort((a, b) => b.totalUSD - a.totalUSD)
      .slice(0, 6);
  }, [reporte.ventas]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  const maxPago = Math.max(
    ...reporte.pagos.map((pago) => pago.totalUSD),
    1,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold/70">
            Cierre de caja
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {formatDate(`${reporte.desde}T12:00:00-04:00`)}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Resumen del día en hora de Venezuela · Tasa {tasa.toFixed(2)} Bs/USD
          </p>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={pending}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="h-3.5 w-3.5" />}
          >
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Facturas"
          value={reporte.cantidadVentas}
          hint="Ventas registradas"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Total USD"
          value={formatUSD(reporte.totalUSD)}
          hint={formatVES(reporte.totalVES)}
          icon={<Wallet className="h-5 w-5" />}
          accent
        />
        <StatCard
          label="Ticket promedio"
          value={formatUSD(ticketPromedio)}
          hint="Por factura"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Productos vendidos"
          value={topProductos.length}
          hint="Referencias distintas"
          icon={<Package className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title="Facturas del día"
            description="Toca una fila para ver el detalle de la venta."
          />
          {reporte.ventas.length === 0 ? (
            <EmptyState
              title="Aún no hay ventas registradas hoy"
              description="Cuando se emita la primera factura aparecerá aquí."
              icon={<Receipt className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line-soft text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Factura</th>
                    <th className="px-4 py-3 font-medium">Hora</th>
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
                            <td colSpan={6} className="px-4 py-3">
                              <div className="space-y-1.5">
                                {venta.detalles.map((detalle) => (
                                  <div
                                    key={detalle.id}
                                    className="flex items-center gap-3 text-xs"
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
                                    <span className="w-20 text-right text-zinc-200">
                                      {formatUSD(detalle.subtotalUSD)}
                                    </span>
                                  </div>
                                ))}
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

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Desglose por método"
              description="Ingresos del día por forma de pago."
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
                          {pago.cantidadVentas} ×
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-gold"
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
                          {porcentaje.toFixed(1)}%
                        </span>
                        <span className="font-medium text-zinc-200">
                          {formatUSD(pago.totalUSD)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  Más vendidos
                </span>
              }
              description="Top de productos por monto."
            />
            {topProductos.length === 0 ? (
              <EmptyState title="Aún sin productos vendidos" />
            ) : (
              <div className="divide-y divide-line-soft/70">
                {topProductos.map((producto, index) => (
                  <div
                    key={producto.nombre}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="w-4 text-xs font-semibold text-zinc-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-zinc-200">
                        {producto.nombre}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {round2(producto.cantidad)}{" "}
                        {UNIDAD_MEDIDA_SHORT[producto.unidad]}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gold-soft">
                      {formatUSD(producto.totalUSD)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="border-gold/25 bg-gradient-to-r from-gold/[0.08] via-ink-900/80 to-ink-900/80">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gold/70">
              Total del cierre
            </p>
            <p className="text-xs text-zinc-500">
              {reporte.cantidadVentas} factura
              {reporte.cantidadVentas === 1 ? "" : "s"} ·{" "}
              {reporte.pagos.length} método
              {reporte.pagos.length === 1 ? "" : "s"} de pago
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-gold-soft">
              {formatUSD(reporte.totalUSD)}
            </p>
            <p className="text-xs text-zinc-400">
              {formatVES(reporte.totalVES)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
