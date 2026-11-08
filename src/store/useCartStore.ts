import { create } from "zustand";

import type { CartItem, UnidadMedida } from "@/lib/types";
import { clampQuantity, round2 } from "@/lib/utils";

export type AddToCartResult =
  | { ok: true }
  | { ok: false; error: string };

type CartProduct = {
  id: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  precioDetalUSD: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: CartProduct) => AddToCartResult;
  removeItem: (productoId: string) => void;
  setCantidad: (productoId: string, cantidad: number) => void;
  incrementar: (productoId: string) => void;
  decrementar: (productoId: string) => void;
  clear: () => void;
};

function isSameProduct(item: CartItem, productoId: string): boolean {
  return item.productoId === productoId;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  addItem: (product) => {
    if (product.stock <= 0) {
      return { ok: false, error: "Este producto no tiene stock disponible." };
    }

    const current = get().items;
    const existing = current.find((item) => isSameProduct(item, product.id));

    if (existing) {
      const nextQuantity = clampQuantity(
        existing.cantidad + 1,
        existing.stock,
        existing.unidadMedida,
      );

      if (nextQuantity <= existing.cantidad) {
        return {
          ok: false,
          error: "No hay más stock disponible para este producto.",
        };
      }

      set({
        items: current.map((item) =>
          isSameProduct(item, product.id)
            ? { ...item, cantidad: nextQuantity }
            : item,
        ),
      });
      return { ok: true };
    }

    const cantidad = clampQuantity(1, product.stock, product.unidadMedida);
    if (cantidad <= 0) {
      return { ok: false, error: "Este producto no tiene stock disponible." };
    }

    set({
      items: [
        ...current,
        {
          productoId: product.id,
          nombre: product.nombre,
          unidadMedida: product.unidadMedida,
          precioUnitarioUSD: round2(product.precioDetalUSD),
          stock: product.stock,
          cantidad,
        },
      ],
    });

    return { ok: true };
  },

  removeItem: (productoId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productoId !== productoId),
    })),

  setCantidad: (productoId, cantidad) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          isSameProduct(item, productoId)
            ? {
                ...item,
                cantidad: clampQuantity(
                  cantidad,
                  item.stock,
                  item.unidadMedida,
                ),
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    })),

  incrementar: (productoId) =>
    set((state) => ({
      items: state.items.map((item) =>
        isSameProduct(item, productoId)
          ? {
              ...item,
              cantidad: clampQuantity(
                item.cantidad + 1,
                item.stock,
                item.unidadMedida,
              ),
            }
          : item,
      ),
    })),

  decrementar: (productoId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          isSameProduct(item, productoId)
            ? {
                ...item,
                cantidad: clampQuantity(
                  item.cantidad - 1,
                  item.stock,
                  item.unidadMedida,
                ),
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    })),

  clear: () => set({ items: [] }),
}));

export function cartSubtotalUSD(items: CartItem[]): number {
  return round2(
    items.reduce(
      (total, item) => total + item.precioUnitarioUSD * item.cantidad,
      0,
    ),
  );
}

export function cartTotals(items: CartItem[], tasaDolarVes: number) {
  const subtotalUSD = cartSubtotalUSD(items);
  const totalVES = round2(subtotalUSD * tasaDolarVes);

  return {
    cantidadLineas: items.length,
    cantidadUnidades: round2(
      items.reduce((total, item) => total + item.cantidad, 0),
    ),
    subtotalUSD,
    totalVES,
  };
}

export const selectCartCount = (state: CartState): number =>
  state.items.length;
