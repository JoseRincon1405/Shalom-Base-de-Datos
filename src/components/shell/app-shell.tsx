"use client";

import {
  BarChart3,
  Boxes,
  ChefHat,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanBarcode,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { logoutAction } from "@/actions/auth";
import { RateModal } from "@/components/shell/rate-modal";
import { ROL_LABELS } from "@/lib/constants";
import { cn, formatVES, initials } from "@/lib/utils";
import { useTasa } from "@/store/useRateStore";
import type { SessionUser } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const OPERACION: NavItem[] = [
  {
    href: "/pos",
    label: "Punto de venta",
    icon: <ScanBarcode className="h-4 w-4" />,
  },
  {
    href: "/cierre",
    label: "Cierre de caja",
    icon: <Wallet className="h-4 w-4" />,
  },
];

const ADMINISTRACION: NavItem[] = [
  {
    href: "/admin",
    label: "Panel general",
    icon: <LayoutDashboard className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    icon: <Boxes className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/reportes",
    label: "Reportes",
    icon: <BarChart3 className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: <Users className="h-4 w-4" />,
    adminOnly: true,
  },
];

const PAGE_TITLES: Array<[string, string]> = [
  ["/admin/inventario", "Inventario"],
  ["/admin/reportes", "Reportes"],
  ["/admin/usuarios", "Usuarios"],
  ["/admin", "Panel general"],
  ["/pos", "Punto de venta"],
  ["/cierre", "Cierre de caja"],
];

function titleFor(pathname: string): string {
  return (
    PAGE_TITLES.find(
      ([prefix]) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ?? "inFlow"
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
        <ChefHat className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-zinc-50">
          in<span className="text-gold">Flow</span>
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Repostería
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active =
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
    (item.href === "/admin" && pathname === "/admin");

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border border-gold/25 bg-gold/10 text-gold-soft"
          : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
      )}
    >
      <span className={cn(active ? "text-gold" : "text-zinc-500")}>
        {item.icon}
      </span>
      {item.label}
      {active ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
      ) : null}
    </Link>
  );
}

function NavContent({
  user,
  pathname,
  onNavigate,
}: {
  user: SessionUser;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isAdmin = user.rol === "ADMIN";

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 no-scrollbar">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Operación
          </p>
          {OPERACION.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {isAdmin ? (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Administración
            </p>
            {ADMINISTRACION.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </nav>

      <div className="border-t border-line-soft p-3">
        <div className="flex items-center gap-3 rounded-xl bg-ink-850 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-semibold text-gold-soft">
            {initials(user.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">
              {user.nombre}
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {ROL_LABELS[user.rol]}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  initialTasa,
  children,
}: {
  user: SessionUser;
  initialTasa: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const tasa = useTasa(initialTasa);
  const isAdmin = user.rol === "ADMIN";

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-ink-900/70 backdrop-blur lg:block">
        <NavContent user={user} pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-72 border-r border-line bg-ink-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
            <NavContent
              user={user}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-ink-950/80 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-line p-2 text-zinc-400 hover:text-zinc-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                inFlow
              </p>
              <h1 className="truncate text-sm font-semibold text-zinc-100">
                {titleFor(pathname)}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => isAdmin && setRateOpen(true)}
              className={cn(
                "hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors sm:flex",
                isAdmin
                  ? "border-gold/30 bg-gold/10 text-gold-soft hover:bg-gold/15"
                  : "cursor-default border-line bg-ink-850 text-zinc-300",
              )}
              title={
                isAdmin
                  ? "Actualizar tasa de cambio"
                  : "La tasa la actualiza un administrador"
              }
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-zinc-500">Dólar hoy</span>
              <span className="font-semibold">{formatVES(tasa)}</span>
            </button>

            <div className="hidden items-center gap-2 rounded-xl border border-line bg-ink-850 px-3 py-1.5 md:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[10px] font-semibold text-gold-soft">
                {initials(user.nombre)}
              </span>
              <div className="leading-tight">
                <p className="max-w-32 truncate text-xs font-medium text-zinc-100">
                  {user.nombre}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {ROL_LABELS[user.rol]}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      {isAdmin ? (
        <RateModal
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          tasa={tasa}
        />
      ) : null}
    </div>
  );
}
