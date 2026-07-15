"use client";

import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import TasaSelector from "@/components/TasaSelector";
import ProductsCard from "@/components/ProductCard";
import { MOCK_PRODUCTS } from "@/constants/mockData";
import { useAppStore } from "@/stores/useAppStore";
import ProductsCart from "@/components/ProductsCart";

export default function PuntoDeVentaPage() {
  // Leemos la pestaña activa y los filtros desde Zustand
  const activeTab = useAppStore((state) => state.activeTab);
  const search = useAppStore((state) => state.search);
  const category = useAppStore((state) => state.category);    
     
  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Todos" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  // Esta función decide qué renderizar en la pantalla principal según el menú lateral
  const renderContenidoPestana = () => {
    switch (activeTab) {
      case "punto-de-venta":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catálogo */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <ProductsCard key={product.id} product={product} />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                  No se encontraron productos que coincidan.
                </div>
              )}
            </div>

            {/* Carrito  */}
              <div>
                <ProductsCart />
              </div>
          </div>
        );

      case "inventario":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Control de Stock e Inventario</h2>
            <p className="text-sm text-gray-500">Aquí programaremos la tabla completa de insumos.</p>
          </div>
        );

      case "ventas":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reporte de Ventas y Ganancias Netas</h2>
            <p className="text-sm text-gray-500">Aquí calcularemos los ingresos totales y métodos de pago.</p>
          </div>
        );

      case "configuracion":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Configuración General</h2>
            <p className="text-sm text-gray-500">Opciones generales del sistema inFlow.</p>
          </div>
        );
    }
  };

  return (

    <div className="min-h-screen bg-gray-50 pl-64">
      {/* Renderizamos el componente Sidebar */}
      <Sidebar />

      {/* Zona del Contenido Principal */}
      <div className="p-8">
        {/* Barra de Herramientas Superior (Buscador + Tasa de Cambio) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <SearchBar />
          <TasaSelector />
        </div>

        <main>
          {renderContenidoPestana()}
        </main>
        
      </div>
    </div>
  );
}