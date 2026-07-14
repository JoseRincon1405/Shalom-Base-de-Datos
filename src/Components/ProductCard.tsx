import { Product } from "@/types";
import Image from "next/image";

type ProductCardProps = {
  product: Product;
};

export default function ProductsCard({ product }: ProductCardProps) {

  const isStockCritical = product.stock <= 5; 

  return (
    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
      <div>
        {/* Cabecera de la tarjeta */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
            {product.category || "General"}
          </span>
          {isStockCritical && (
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
              Stock Bajo
            </span>
          )}
        </div>

        {/* Contenedor de la Imagen */}
        <div className="relative w-full h-32 bg-gray-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
          <Image 
            src={product.image || "/placeholder.png"} 
            alt={product.name} 
            width={100} 
            height={100} 
            className="object-contain p-1"
          />
        </div>

        {/* Información del Producto */}
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
      </div>

      {/* Precios y Stock Inferior */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Precio</p>
          <p className="text-base font-bold text-gray-900">${product.sell.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-medium">Stock</p>
          <p className={`text-xs font-semibold ${isStockCritical ? 'text-red-600' : 'text-gray-600'}`}>
            {product.stock} unds
          </p>
        </div>
      </div>

      {/* Botón de acción para el punto de venta */}
      <button 
        type="button"
        className="w-full mt-4 bg-gray-900 hover:bg-amber-400 hover:text-gray-900 text-white py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
      >
        Agregar
      </button>
    </div>
  );
}
