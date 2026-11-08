import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { requireAdmin } from "@/lib/auth";
import { METODO_PAGO_LABELS } from "@/lib/constants";
import { getDashboardData } from "@/lib/data";
import {
  formatDate,
  formatQuantity,
  formatTime,
  formatUSD,
  formatVES,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panel",
};

const QUICK_ACTIONS = [
  {
    href: "/pos",
    label: "Punto de venta",
    description: "Registrar una nueva venta",
    icon: ShoppingCart,
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    description: "Productos, stock y precios",
    icon: Boxes,
  },
  {
    href: "/admin/reportes",
    label: "Reportes",
    description: "Ventas por rango de fechas",
    icon: ClipboardList,
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    description: "Roles y accesos del equipo",
    icon: Users,
  },
];

async function DashboardLoader() {
  const admin = await requireAdmin();
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-gold/70">
          {formatDate(new Date())}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Hola, {admin.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500">
          Este es el pulso de inFlow para el día de hoy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={data.ventasHoy.cantidad}
          hint="Facturas emitidas"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Ingresos USD"
          value={formatUSD(data.ventasHoy.totalUSD)}
          hint={formatVES(data.ventasHoy.totalVES)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent
        />
        <StatCard
          label="Ticket promedio"
          value={formatUSD(data.ticketPromedioUSD)}
          hint="Por factura del día"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Tasa del día"
          value={`${data.tasa.toFixed(2)} Bs`}
          hint="Por 1 USD"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader
            title="Últimas ventas de hoy"
            description="Las 5 facturas más recientes."
            action={
              <Link
                href="/admin/reportes"
                className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-soft"
              >
                Ver reportes
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {data.ultimasVentas.length === 0 ? (
            <EmptyState
              title="Aún no hay ventas hoy"
              description="Abre el punto de venta para registrar la primera factura."
              icon={<Receipt className="h-5 w-5" />}
              action={
                <Link
                  href="/pos"
                  className="text-xs font-medium text-gold hover:text-gold-soft"
                >
                  Ir al punto de venta →
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-line-soft/70">
              {data.ultimasVentas.map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-800 text-[10px] font-semibold text-zinc-400">
                    #{String(venta.numeroFactura).padStart(3, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {venta.detalles.length} producto
                      {venta.detalles.length === 1 ? "" : "s"} ·{" "}
                      {venta.cajero}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatTime(venta.fecha)} ·{" "}
                      {METODO_PAGO_LABELS[venta.metodoPago]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-100">
                      {formatUSD(venta.totalUSD)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatVES(venta.totalVES)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Stock bajo
                </span>
              }
              description="Productos en o por debajo del mínimo."
            />
            {data.productosBajoStock.length === 0 ? (
              <EmptyState
                title="Inventario saludable"
                description="Ningún producto está por debajo del mínimo."
              />
            ) : (
              <div className="divide-y divide-line-soft/70">
                {data.productosBajoStock.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-200">
                        {producto.nombre}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {producto.categoria}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {formatQuantity(producto.stock, producto.unidadMedida)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-line-soft px-4 py-3">
              <Link
                href="/admin/inventario"
                className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-soft"
              >
                Gestionar inventario
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Accesos rápidos"
              description={`${data.productosActivos} productos activos · ${data.usuariosActivos} usuarios activos`}
            />
            <div className="grid grid-cols-2 gap-2 p-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-xl border border-line bg-ink-850/60 p-3 transition-colors hover:border-gold/30 hover:bg-gold/5"
                  >
                    <Icon className="h-4 w-4 text-gold/80" />
                    <p className="mt-2 text-xs font-medium text-zinc-200">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500">
                      {action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<PageLoader label="Cargando panel…" />}>
      <DashboardLoader />
    </Suspense>
  );
}
