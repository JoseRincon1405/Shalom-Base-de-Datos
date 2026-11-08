"use client";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  DollarSign,
  History,
  PackageCheck,
  Pencil,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  adjustStockAction,
  createCategoryAction,
  createProductAction,
  toggleProductActiveAction,
  updateProductAction,
} from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  TIPO_MOVIMIENTO_LABELS,
  UNIDAD_MEDIDA_OPTIONS,
  UNIDAD_MEDIDA_SHORT,
} from "@/lib/constants";
import type {
  CategoriaDTO,
  MovimientoDTO,
  ProductoDTO,
  TipoMovimiento,
} from "@/lib/types";
import {
  calcularPrecioDetal,
  cn,
  formatDate,
  formatQuantity,
  formatUSD,
  round2,
  round3,
} from "@/lib/utils";

type Notice = { kind: "success" | "error"; text: string };

export function InventoryClient({
  productos,
  categorias,
  movimientos,
}: {
  productos: ProductoDTO[];
  categorias: CategoriaDTO[];
  movimientos: MovimientoDTO[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado] = useState<"todos" | "bajo" | "inactivos">("todos");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoDTO | null>(null);
  const [adjusting, setAdjusting] = useState<ProductoDTO | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return productos.filter((producto) => {
      if (categoria !== "todas" && producto.categoriaId !== categoria) {
        return false;
      }
      if (estado === "bajo" && !(producto.activo && producto.bajoStock)) {
        return false;
      }
      if (estado === "inactivos" && producto.activo) {
        return false;
      }
      if (!query) return true;

      return (
        producto.nombre.toLowerCase().includes(query) ||
        producto.categoria.toLowerCase().includes(query) ||
        (producto.codigoBarras ?? "").toLowerCase().includes(query)
      );
    });
  }, [productos, search, categoria, estado]);

  const stats = useMemo(() => {
    const activos = productos.filter((producto) => producto.activo);
    const bajoStock = activos.filter((producto) => producto.bajoStock);
    const valor = activos.reduce(
      (total, producto) => total + producto.stock * producto.costoCompraUSD,
      0,
    );

    return {
      total: productos.length,
      activos: activos.length,
      bajoStock: bajoStock.length,
      valor: round2(valor),
    };
  }, [productos]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(producto: ProductoDTO) {
    setEditing(producto);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm shadow-xl backdrop-blur",
            notice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-red-500/30 bg-red-500/15 text-red-200",
          )}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Productos"
          value={stats.total}
          hint={`${stats.activos} activos`}
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label="Stock bajo"
          value={stats.bajoStock}
          hint="Requieren reposición"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={stats.bajoStock > 0}
        />
        <StatCard
          label="Valor a costo"
          value={formatUSD(stats.valor)}
          hint="Inventario activo"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Categorías"
          value={categorias.length}
          hint="Familias de productos"
          icon={<Tag className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Catálogo de inventario"
          description="Precios calculados automáticamente desde costo + margen."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCategoryOpen(true)}
                icon={<Tag className="h-3.5 w-3.5" />}
              >
                Categoría
              </Button>
              <Button
                size="sm"
                onClick={openCreate}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Nuevo producto
              </Button>
            </div>
          }
        />

        <div className="flex flex-col gap-3 border-b border-line-soft p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto, categoría o código…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="w-auto min-w-40"
              aria-label="Filtrar por categoría"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>

            {(
              [
                ["todos", "Todos"],
                ["bajo", "Stock bajo"],
                ["inactivos", "Inactivos"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setEstado(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  estado === value
                    ? "border-gold/40 bg-gold/15 text-gold-soft"
                    : "border-line bg-ink-850 text-zinc-400 hover:text-zinc-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Sin productos que coincidan"
            description="Ajusta los filtros o registra un nuevo producto."
            icon={<PackageCheck className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line-soft text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Costo</th>
                  <th className="px-4 py-3 font-medium">Margen</th>
                  <th className="px-4 py-3 font-medium">Precio detal</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((producto) => (
                  <tr
                    key={producto.id}
                    className={cn(
                      "border-b border-line-soft/70 transition-colors hover:bg-white/[0.02]",
                      !producto.activo && "opacity-55",
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">
                        {producto.nombre}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {producto.codigoBarras ?? "Sin código"} ·{" "}
                        {UNIDAD_MEDIDA_SHORT[producto.unidadMedida]}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{producto.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatUSD(producto.costoCompraUSD)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {producto.porcentajeGanancia}%
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gold-soft">
                        {formatUSD(producto.precioDetalUSD)}
                      </p>
                      {producto.precioMayorUSD !== null ? (
                        <p className="text-[11px] text-zinc-500">
                          Mayor: {formatUSD(producto.precioMayorUSD)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-200">
                          {formatQuantity(
                            producto.stock,
                            producto.unidadMedida,
                          )}
                        </span>
                        {producto.bajoStock ? (
                          <Badge variant="warning" className="w-fit">
                            Bajo · mín{" "}
                            {formatQuantity(
                              producto.stockMinimo,
                              producto.unidadMedida,
                            )}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-zinc-600">
                            mín{" "}
                            {formatQuantity(
                              producto.stockMinimo,
                              producto.unidadMedida,
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setAdjusting(producto)}
                          title="Ajustar stock"
                          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-gold-soft"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(producto)}
                          title="Editar producto"
                          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              const result = await toggleProductActiveAction(
                                producto.id,
                                !producto.activo,
                              );
                              if (!result.ok) {
                                setNotice({
                                  kind: "error",
                                  text: result.error,
                                });
                                return;
                              }
                              setNotice({
                                kind: "success",
                                text: producto.activo
                                  ? "Producto desactivado"
                                  : "Producto activado",
                              });
                              router.refresh();
                            })
                          }
                          title={
                            producto.activo ? "Desactivar" : "Activar"
                          }
                          className={cn(
                            "rounded-lg p-2 transition-colors hover:bg-white/5",
                            producto.activo
                              ? "text-zinc-500 hover:text-red-300"
                              : "text-emerald-400/80 hover:text-emerald-300",
                          )}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-gold" />
              Auditoría de inventario
            </span>
          }
          description="Últimos movimientos generados por ventas, entradas y ajustes."
        />
        {movimientos.length === 0 ? (
          <EmptyState
            title="Todavía no hay movimientos"
            description="Los cambios de stock aparecerán aquí automáticamente."
          />
        ) : (
          <div className="divide-y divide-line-soft/70">
            {movimientos.slice(0, 20).map((movimiento) => (
              <div
                key={movimiento.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs"
              >
                <Badge variant={movementVariant(movimiento.tipo)}>
                  {TIPO_MOVIMIENTO_LABELS[movimiento.tipo]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">
                    {movimiento.producto}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {movimiento.motivo ?? "Sin motivo"} · {movimiento.usuario}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                  <span>{round3(movimiento.stockAnterior)}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-600" />
                  <span className="text-zinc-200">
                    {round3(movimiento.stockNuevo)}
                  </span>
                </div>
                <span className="w-28 text-right text-[11px] text-zinc-600">
                  {formatDate(movimiento.fecha)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {formOpen ? (
        <ProductForm
          key={editing?.id ?? "new"}
          producto={editing}
          categorias={categorias}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => {
            setFormOpen(false);
            setNotice({ kind: "success", text: message });
            router.refresh();
          }}
          onError={(message) => setNotice({ kind: "error", text: message })}
        />
      ) : null}

      {categoryOpen ? (
        <CategoryForm
          onClose={() => setCategoryOpen(false)}
          onSaved={() => {
            setCategoryOpen(false);
            setNotice({ kind: "success", text: "Categoría creada" });
            router.refresh();
          }}
        />
      ) : null}

      {adjusting ? (
        <StockAdjustmentForm
          producto={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            setAdjusting(null);
            setNotice({ kind: "success", text: "Stock ajustado" });
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function movementVariant(
  tipo: TipoMovimiento,
): "success" | "gold" | "danger" | "info" {
  switch (tipo) {
    case "ENTRADA":
      return "success";
    case "VENTA":
      return "gold";
    case "AJUSTE_MERMA":
      return "danger";
    default:
      return "info";
  }
}

type ProductFormState = {
  nombre: string;
  codigoBarras: string;
  descripcion: string;
  categoriaId: string;
  unidadMedida: ProductoDTO["unidadMedida"];
  costoCompraUSD: string;
  porcentajeGanancia: string;
  precioMayorUSD: string;
  stock: string;
  stockMinimo: string;
  activo: boolean;
};

function toFormState(producto: ProductoDTO | null, categorias: CategoriaDTO[]): ProductFormState {
  return {
    nombre: producto?.nombre ?? "",
    codigoBarras: producto?.codigoBarras ?? "",
    descripcion: producto?.descripcion ?? "",
    categoriaId: producto?.categoriaId ?? categorias[0]?.id ?? "",
    unidadMedida: producto?.unidadMedida ?? "UNIDAD",
    costoCompraUSD: producto ? String(producto.costoCompraUSD) : "",
    porcentajeGanancia: producto
      ? String(producto.porcentajeGanancia)
      : "40",
    precioMayorUSD:
      producto?.precioMayorUSD !== null && producto?.precioMayorUSD !== undefined
        ? String(producto.precioMayorUSD)
        : "",
    stock: producto ? String(producto.stock) : "0",
    stockMinimo: producto ? String(producto.stockMinimo) : "0",
    activo: producto?.activo ?? true,
  };
}

function ProductForm({
  producto,
  categorias,
  onClose,
  onSaved,
  onError,
}: {
  producto: ProductoDTO | null;
  categorias: CategoriaDTO[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<ProductFormState>(() =>
    toFormState(producto, categorias),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const costo = Number(form.costoCompraUSD.replace(",", ".")) || 0;
  const margen = Number(form.porcentajeGanancia.replace(",", ".")) || 0;
  const precioDetal = calcularPrecioDetal(costo, margen);

  function update<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setError(null);

    const input = {
      ...(producto ? { id: producto.id } : {}),
      nombre: form.nombre,
      codigoBarras: form.codigoBarras.trim() || null,
      descripcion: form.descripcion.trim() || null,
      categoriaId: form.categoriaId,
      unidadMedida: form.unidadMedida,
      costoCompraUSD: Number(form.costoCompraUSD.replace(",", ".")) || 0,
      porcentajeGanancia:
        Number(form.porcentajeGanancia.replace(",", ".")) || 0,
      precioMayorUSD:
        form.precioMayorUSD.trim() === ""
          ? null
          : Number(form.precioMayorUSD.replace(",", ".")) || 0,
      stock: Number(form.stock.replace(",", ".")) || 0,
      stockMinimo: Number(form.stockMinimo.replace(",", ".")) || 0,
      activo: form.activo,
    };

    startTransition(async () => {
      const result = producto
        ? await updateProductAction(input)
        : await createProductAction(input);

      if (!result.ok) {
        setError(result.error);
        onError(result.error);
        return;
      }

      onSaved(producto ? "Producto actualizado" : "Producto creado");
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={producto ? "Editar producto" : "Nuevo producto"}
      description="El precio de detalle se calcula automáticamente con el costo y el margen."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending}>
            {producto ? "Guardar cambios" : "Crear producto"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="prod-nombre" className="sm:col-span-2">
            <Input
              id="prod-nombre"
              value={form.nombre}
              onChange={(event) => update("nombre", event.target.value)}
              placeholder="Ej: Chocolate semiamargo"
            />
          </Field>

          <Field
            label="Código de barras"
            htmlFor="prod-codigo"
            hint="Opcional, debe ser único."
          >
            <Input
              id="prod-codigo"
              value={form.codigoBarras}
              onChange={(event) => update("codigoBarras", event.target.value)}
              placeholder="7591002000010"
            />
          </Field>

          <Field label="Categoría" htmlFor="prod-categoria">
            <Select
              id="prod-categoria"
              value={form.categoriaId}
              onChange={(event) => update("categoriaId", event.target.value)}
            >
              {categorias.length === 0 ? (
                <option value="">Crea una categoría primero</option>
              ) : null}
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Descripción"
            htmlFor="prod-desc"
            className="sm:col-span-2"
          >
            <Textarea
              id="prod-desc"
              value={form.descripcion}
              onChange={(event) => update("descripcion", event.target.value)}
              placeholder="Detalles del producto, presentación, marca…"
            />
          </Field>

          <Field label="Unidad de medida" htmlFor="prod-unidad">
            <Select
              id="prod-unidad"
              value={form.unidadMedida}
              onChange={(event) =>
                update(
                  "unidadMedida",
                  event.target.value as ProductoDTO["unidadMedida"],
                )
              }
            >
              {UNIDAD_MEDIDA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Costo compra (USD)"
            htmlFor="prod-costo"
            hint="Costo por unidad de medida."
          >
            <Input
              id="prod-costo"
              type="number"
              min="0"
              step="0.01"
              value={form.costoCompraUSD}
              onChange={(event) => update("costoCompraUSD", event.target.value)}
              placeholder="0.00"
            />
          </Field>

          <Field
            label="% Ganancia"
            htmlFor="prod-margen"
            hint="Se aplica sobre el costo."
          >
            <Input
              id="prod-margen"
              type="number"
              min="0"
              step="1"
              value={form.porcentajeGanancia}
              onChange={(event) =>
                update("porcentajeGanancia", event.target.value)
              }
              placeholder="40"
            />
          </Field>

          <Field label="Precio mayorista (USD)" htmlFor="prod-mayor" hint="Opcional.">
            <Input
              id="prod-mayor"
              type="number"
              min="0"
              step="0.01"
              value={form.precioMayorUSD}
              onChange={(event) =>
                update("precioMayorUSD", event.target.value)
              }
              placeholder="Opcional"
            />
          </Field>

          <Field
            label="Stock actual"
            htmlFor="prod-stock"
            hint="Admite decimales para kg, L, ml."
          >
            <Input
              id="prod-stock"
              type="number"
              min="0"
              step="0.001"
              value={form.stock}
              onChange={(event) => update("stock", event.target.value)}
            />
          </Field>

          <Field label="Stock mínimo" htmlFor="prod-minimo">
            <Input
              id="prod-minimo"
              type="number"
              min="0"
              step="0.001"
              value={form.stockMinimo}
              onChange={(event) => update("stockMinimo", event.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold/70">
              Precio detal calculado
            </p>
            <p className="text-lg font-semibold text-gold-soft">
              {formatUSD(precioDetal)}
            </p>
          </div>
          <p className="text-right text-[11px] text-zinc-500">
            {form.porcentajeGanancia || 0}% sobre {formatUSD(costo)}
            <br />
            Se convierte a Bs con la tasa del día
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-ink-950/40 px-4 py-3">
          <span>
            <span className="block text-sm text-zinc-200">Producto activo</span>
            <span className="text-[11px] text-zinc-500">
              Visible en el punto de venta.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => update("activo", event.target.checked)}
            className="h-4 w-4 accent-[#d4af37]"
          />
        </label>
      </div>
    </Modal>
  );
}

function CategoryForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createCategoryAction({ nombre, descripcion });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva categoría"
      description="Organiza tus productos por familia."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending}>
            Crear categoría
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        <Field label="Nombre" htmlFor="cat-nombre">
          <Input
            id="cat-nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej: Chocolates"
            autoFocus
          />
        </Field>
        <Field label="Descripción" htmlFor="cat-desc" hint="Opcional.">
          <Textarea
            id="cat-desc"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            placeholder="Coberturas, barras, chips…"
          />
        </Field>
      </div>
    </Modal>
  );
}

function StockAdjustmentForm({
  producto,
  onClose,
  onSaved,
}: {
  producto: ProductoDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nuevoStock, setNuevoStock] = useState(String(producto.stock));
  const [tipo, setTipo] = useState<TipoMovimiento>("CORRECCION");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await adjustStockAction({
        productoId: producto.id,
        nuevoStock: Number(nuevoStock.replace(",", ".")) || 0,
        tipo,
        motivo,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Ajustar stock · ${producto.nombre}`}
      description={`Stock actual: ${formatQuantity(producto.stock, producto.unidadMedida)}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending}>
            Guardar ajuste
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <Field label="Tipo de movimiento" htmlFor="adj-tipo">
          <Select
            id="adj-tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoMovimiento)}
          >
            <option value="CORRECCION">Corrección</option>
            <option value="ENTRADA">Entrada</option>
            <option value="AJUSTE_MERMA">Ajuste / merma</option>
          </Select>
        </Field>

        <Field
          label="Nuevo stock"
          htmlFor="adj-stock"
          hint={`Unidad: ${UNIDAD_MEDIDA_SHORT[producto.unidadMedida]}`}
        >
          <Input
            id="adj-stock"
            type="number"
            min="0"
            step="0.001"
            value={nuevoStock}
            onChange={(event) => setNuevoStock(event.target.value)}
          />
        </Field>

        <Field
          label="Motivo"
          htmlFor="adj-motivo"
          hint="Quedará registrado en la auditoría."
        >
          <Textarea
            id="adj-motivo"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Ej: Producto vencido, conteo físico, reposición…"
          />
        </Field>
      </div>
    </Modal>
  );
}
