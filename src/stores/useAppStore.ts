import {create} from "zustand";
import {Product} from "@/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type TabOptions = "punto-de-venta" | "inventario" | "ventas" | "configuracion";

type AppState = {

  // Productos de la DB
  products : Product[]
  setProducts : (products: Product[]) => void
  addProduct : (product : Product) => void

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
  decreaseQuantity: (product: CartItem) => void;
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
    products: [],
    setProducts: (value : Product[]) => set({ products: value }),
    addProduct: ( newProduct : Product) => set((state) => ({
      products: [newProduct, ...state.products]
    })),
    activeTab: "punto-de-venta",
    setActiveTab: (value: TabOptions) => set({ activeTab: value }),

    search: "",
    category: "Todos",
    setSearch: (value : string) => set({ search: value }),
    setCategory: (value : string) => set({ category: value }),

    cart: [],
  addToCart: (product: Product, quantity: number) => set((state) => {
 
    const exists = state.cart.find(item => item.product.id === product.id);

    if (exists) {
      return {
        cart: state.cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        )
      };
    }

    // 3. Si no existe, agregamos el nuevo objeto { product, quantity } al arreglo
    return {
      cart: [...state.cart, { product, quantity }]
    };
  }),

  decreaseQuantity: (product: CartItem) => set((state) => {
    // 1. Buscamos si el producto existe usando su ID
    const exists = state.cart.find(item => item.product.id === product.product.id);

    if (exists) {
      // Caso A: Si tiene más de una unidad, restamos 1
      if (exists.quantity > 1) {
        return {
          cart: state.cart.map(item =>
            item.product.id === product.product.id
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
        };
      } 
      
      // Caso B: Si tiene exactamente 1 unidad, lo eliminamos del carrito
      return {
        cart: state.cart.filter(item => item.product.id !== product.product.id)
      };
    }

    // Si por alguna razón no existía, simplemente devolvemos el estado sin cambios
    return { cart: state.cart };
  }),
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
