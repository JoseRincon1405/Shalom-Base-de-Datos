"use client";

import {
  BadgeCheck,
  Barcode,
  CheckCircle2,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { processSaleAction, type SaleResult } from "@/actions/sales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { METODO_PAGO_LABELS, METODO_PAGO_OPTIONS } from "@/lib/constants";
import type {
  CategoriaDTO,
  MetodoPago,
  ProductoDTO,
} from "@/lib/types";
import {
  clampQuantity,
  cn,
  formatQuantity,
  formatUSD,
  formatVES,
  isFractionalUnit,
  minimumQuantity,
  quantityStep,
  round2,
} from "@/lib/utils";
import {
  cartTotals,
  useCartStore,
} from "@/store/useCartStore";
import { useTasa } from "@/store/useRateStore";

type Notice = { kind: "success" | "error"; text: string };

export function PosClient({
  productos,
  categorias,
  tasa: initialTasa,
}: {
  productos: ProductoDTO[];
  categorias: CategoriaDTO[];
  tasa: number;
}) {
  const router = useRouter();
  const tasa = useTasa(initialTasa);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const setCantidad = useCartStore((state) => state.setCantidad);
  const incrementar = useCartStore((state) => state.incrementar);
  const decrementar = useCartStore((state) => state.decrementar);
  const clear = useCartStore((state) => state.clear);

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [metodoPago, setMetodoPago] =
    useState<MetodoPago>("EFECTIVO_USD");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SaleResult | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(() => cartTotals(items, tasa), [items, tasa]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return productos.filter((producto) => {
      const matchCategoria =
        categoria === "todas" || producto.categoriaId === categoria;
      if (!matchCategoria) return false;
      if (!query) return true;

      return (
        producto.nombre.toLowerCase().includes(query) ||
        producto.categoria.toLowerCase().includes(query) ||
        (producto.codigoBarras ?? "").toLowerCase().includes(query)
      );
    });
  }, [productos, search, categoria]);

  function add(producto: ProductoDTO) {
    const result = addItem({
      id: producto.id,
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      precioDetalUSD: producto.precioDetalUSD,
      stock: producto.stock,
    });

    if (!result.ok) {
      setNotice({ kind: "error", text: result.error });
      return;
    }

    setNotice({
      kind: "success",
      text: `${producto.nombre} agregado al carrito`,
    });
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const query = search.trim().toLowerCase();
    if (!query) return;

    const exact = productos.find(
      (producto) =>
        (producto.codigoBarras ?? "").toLowerCase() === query,
    );
    const target = exact ?? (filtered.length === 1 ? filtered[0] : null);

    if (target) {
      event.preventDefault();
      add(target);
      setSearch("");
    }
  }

  function checkout() {
    setError(null);

    if (items.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    startTransition(async () => {
      const result = await processSaleAction({
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
        })),
        metodoPago,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.data ?? null);
      clear();
      router.refresh();
    });
  }

  return (
    <div className="pb-24 xl:pb-0">
      {notice ? (
        <div
          className={cn(
            "fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm shadow-xl backdrop-blur xl:bottom-6",
            notice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-red-500/30 bg-red-500/15 text-red-200",
          )}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Buscar por nombre, categoría o código de barras…"
                  className="pl-9 pr-12"
                  autoFocus
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                  ↵
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Barcode className="h-4 w-4 text-gold" />
                Escanea y presiona Enter
              </div>
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <CategoryChip
                active={categoria === "todas"}
                onClick={() => setCategoria("todas")}
                label="Todas"
                count={productos.length}
              />
              {categorias.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  active={categoria === cat.id}
                  onClick={() => setCategoria(cat.id)}
                  label={cat.nombre}
                  count={
                    productos.filter(
                      (producto) => producto.categoriaId === cat.id,
                    ).length
                  }
                />
              ))}
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title="No encontramos productos"
                description="Prueba con otro término o cambia la categoría seleccionada."
                icon={<Search className="h-5 w-5" />}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3">
              {filtered.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  tasa={tasa}
                  onAdd={() => add(producto)}
                />
              ))}
            </div>
          )}
        </section>

        <aside id="cart" className="xl:sticky xl:top-20">
          <Card className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Carrito</p>
                  <p className="text-[11px] text-zinc-500">
                    {totals.cantidadLineas}{" "}
                    {totals.cantidadLineas === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-white/5 hover:text-red-300"
                >
                  Vaciar
                </button>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-ink-850 text-zinc-600">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-zinc-300">
                    Carrito vacío
                  </p>
                  <p className="max-w-48 text-xs text-zinc-500">
                    Toca un producto del catálogo para comenzar la venta.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li
                      key={item.productoId}
                      className="rounded-xl border border-line-soft bg-ink-950/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {item.nombre}
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            {formatUSD(item.precioUnitarioUSD)} ·{" "}
                            {formatVES(round2(item.precioUnitarioUSD * tasa))} /{" "}
                            {formatQuantity(1, item.unidadMedida).split(" ")[1]}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productoId)}
                          className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          aria-label={`Quitar ${item.nombre}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => decrementar(item.productoId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-ink-800 text-zinc-400 transition-colors hover:text-zinc-100"
                            aria-label="Disminuir"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <Input
                            type="number"
                            value={item.cantidad}
                            min={minimumQuantity(item.unidadMedida)}
                            max={item.stock}
                            step={quantityStep(item.unidadMedida)}
                            onChange={(event) =>
                              setCantidad(
                                item.productoId,
                                clampQuantity(
                                  Number(event.target.value),
                                  item.stock,
                                  item.unidadMedida,
                                ),
                              )
                            }
                            className="h-7 w-16 px-1.5 py-0 text-center text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => incrementar(item.productoId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-ink-800 text-zinc-400 transition-colors hover:text-zinc-100"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          {isFractionalUnit(item.unidadMedida) ? (
                            <span className="ml-1 text-[10px] text-zinc-600">
                              decimal
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-gold-soft">
                          {formatUSD(
                            round2(
                              item.precioUnitarioUSD * item.cantidad,
                            ),
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3 border-t border-line-soft bg-ink-950/40 px-4 py-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Subtotal USD</span>
                <span className="font-medium text-zinc-200">
                  {formatUSD(totals.subtotalUSD)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Tasa del día</span>
                <span>{formatVES(tasa)} / USD</span>
              </div>
              <div className="flex items-end justify-between rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gold/70">
                    Total a cobrar
                  </p>
                  <p className="text-xl font-semibold leading-tight text-gold-soft">
                    {formatVES(totals.totalVES)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {formatUSD(totals.subtotalUSD)}
                </p>
              </div>

              <Select
                value={metodoPago}
                onChange={(event) =>
                  setMetodoPago(event.target.value as MetodoPago)
                }
                aria-label="Método de pago"
              >
                {METODO_PAGO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              ) : null}

              <Button
                onClick={checkout}
                loading={pending}
                disabled={items.length === 0}
                size="lg"
                className="w-full"
                icon={<BadgeCheck className="h-4 w-4" />}
              >
                Cobrar {items.length > 0 ? formatUSD(totals.subtotalUSD) : ""}
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {items.length > 0 ? (
        <a
          href="#cart"
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl border border-gold/30 bg-ink-900/95 px-4 py-3 shadow-2xl backdrop-blur xl:hidden"
        >
          <span className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-ink-950">
              {totals.cantidadLineas}
            </span>
            Ver carrito
          </span>
          <span className="text-sm font-semibold text-gold-soft">
            {formatVES(totals.totalVES)}
          </span>
        </a>
      ) : null}

      <Modal
        open={success !== null}
        onClose={() => setSuccess(null)}
        title="Venta registrada"
        description="El inventario y la tasa quedaron actualizados."
        size="sm"
        footer={
          <Button onClick={() => setSuccess(null)} icon={<Receipt className="h-4 w-4" />}>
            Nueva venta
          </Button>
        }
      >
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Factura
              </p>
              <p className="text-3xl font-semibold tracking-tight text-zinc-50">
                #{String(success.numeroFactura).padStart(6, "0")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="rounded-xl border border-line bg-ink-950/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Total USD
                </p>
                <p className="text-lg font-semibold text-zinc-100">
                  {formatUSD(success.totalUSD)}
                </p>
              </div>
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gold/70">
                  Total Bs
                </p>
                <p className="text-lg font-semibold text-gold-soft">
                  {formatVES(success.totalVES)}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Tasa aplicada: {formatVES(success.tasaCambio)} ·{" "}
              {METODO_PAGO_LABELS[metodoPago]}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-gold/40 bg-gold/15 text-gold-soft"
          : "border-line bg-ink-850 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px]",
          active ? "bg-gold/20 text-gold-soft" : "bg-white/5 text-zinc-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ProductCard({
  producto,
  tasa,
  onAdd,
}: {
  producto: ProductoDTO;
  tasa: number;
  onAdd: () => void;
}) {
  const agotado = producto.stock <= 0;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={agotado}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-line bg-ink-900/70 p-3.5 text-left transition-all",
        agotado
          ? "cursor-not-allowed opacity-55"
          : "hover:-translate-y-0.5 hover:border-gold/40 hover:bg-ink-850 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.4)]",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <Badge variant="muted" className="max-w-[70%] truncate">
          {producto.categoria}
        </Badge>
        {agotado ? (
          <Badge variant="danger">Agotado</Badge>
        ) : producto.bajoStock ? (
          <Badge variant="warning">Stock bajo</Badge>
        ) : (
          <Badge variant="success">
            {formatQuantity(producto.stock, producto.unidadMedida)}
          </Badge>
        )}
      </div>

      <p className="mt-2.5 line-clamp-2 min-h-10 text-sm font-medium leading-snug text-zinc-100">
        {producto.nombre}
      </p>

      <div className="mt-auto pt-3">
        <p className="text-base font-semibold text-gold-soft">
          {formatUSD(producto.precioDetalUSD)}
        </p>
        <p className="text-[11px] text-zinc-500">
          {formatVES(round2(producto.precioDetalUSD * tasa))} /{" "}
          {formatQuantity(1, producto.unidadMedida).split(" ")[1]}
        </p>
      </div>

      <span
        className={cn(
          "absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all",
          agotado
            ? "border-line text-zinc-600"
            : "border-gold/30 bg-gold/10 text-gold opacity-0 group-hover:opacity-100",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
