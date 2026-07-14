import {create} from "zustand";
import {Product} from "@/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type TabOptions = "punto-de-venta" | "inventario" | "ventas" | "configuracion";

type AppState = {
  // Para Navegación de pestañas
  activeTab: TabOptions;
  setActiveTab: (value: TabOptions) => void;

  //Filtro de búsqueda y categoría
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;

  //carrito de compras
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Control de Moneda y Tasa de Cambio
  exchangeRate: number; // Tasa de cambio de USD a BS
  setExchangeRate: (value: number) => void;
  currency: "USD" | "BS";
  setCurrency: (value: "USD" | "BS") => void;

  // Estado de la Red
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
    activeTab: "punto-de-venta",
    setActiveTab: (value: TabOptions) => set({ activeTab: value }),

    search: "",
    category: "Todos",
    setSearch: (value : string) => set({ search: value }),
    setCategory: (value : string) => set({ category: value }),

    cart: [],
    addToCart: (product: Product, quantity: number) => set((state) => ({
        cart: [...state.cart, { product, quantity }]
    })),
    removeFromCart: (productId: string) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId)
    })),
    clearCart: () => set({ cart: [] }),

    exchangeRate: 40.00,
    setExchangeRate: (value: number) => set({ exchangeRate: value }),

    currency: "USD",
    setCurrency: (value: "USD" | "BS") => set({ currency: value }),

    isOnline: true,
    setIsOnline: (value: boolean) => set({ isOnline: value }),
}));
