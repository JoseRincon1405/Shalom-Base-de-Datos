"use client";

import SearchBar from "@/components/SearchBar";
import { MOCK_PRODUCTS } from "@/constants/mockData";
import {useAppStore} from "@/stores/useAppStore";
import ProductCard from "@/components/ProductCard";

export default function PuntoDeVentaPage() {
  const search = useAppStore((state) => state.search);
  const category = useAppStore((state) => state.category);    
     

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Todos" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <header className="mb-6">
        <h1 className="font-black text-3xl text-gray-900 tracking-tight">inFlow</h1>
        <p className="text-xs text-gray-400">Gestión de Inventario & Puntos de Venta</p>
      </header>

      {/* Barra de herramientas centralizada */}
      <nav className="flex justify-start mb-8">
        <SearchBar />
      </nav>

      {/* Contenedor principal */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECCIÓN CATÁLOGO */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Mensaje de feedback si la búsqueda está vacía */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
              No se encontraron productos que coincidan.
            </div>
          )}
        </div>

        {/* SECCIÓN CARRITO */}
        <div className="bg-black p-4 rounded-xl shadow-sm h-fit ">
          <h2 className="font-bold text-white  pb-2 mb-4">Pedido Actual</h2>
          <div className="text-gray-100 text-sm">
            Hola mundo (Aquí vendrá el carrito)
          </div>
        </div>

      </main>
    </div>
  );
}
