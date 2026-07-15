import { useAppStore } from "@/stores/useAppStore"
import Image from "next/image"
import { FaPlus, FaMinus, FaShoppingBag } from "react-icons/fa"

export default function ProductsCart() {
  const actualCurrency = useAppStore((state) => state.currency)
  const exchangeRate = useAppStore((state) => state.exchangeRate)
  const cart = useAppStore((state) => state.cart)
  const addToCart = useAppStore((state) => state.addToCart)
  const decreaseQuantity = useAppStore((state) => state.decreaseQuantity)
  const removeFromCart = useAppStore((state) => state.removeFromCart)
  const clearCart = useAppStore((state) => state.clearCart)


  const totalUSD = cart.reduce((acc, item) => acc + item.product.sell * item.quantity, 0)
  const totalDisplay = actualCurrency === "USD" 
    ? `$${totalUSD.toFixed(2)}` 
    : `${(totalUSD * exchangeRate).toFixed(2)} Bs`

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-120px)] sticky top-6">
      {/* Cabecera del Carrito */}
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-50 p-2 rounded-lg text-amber-500">
            <FaShoppingBag size={18} />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-lg tracking-tight">Pedido Actual</h2>
            <p className="text-[11px] text-gray-400 font-medium">
              {cart.length} {cart.length === 1 ? "artículo" : "artículos"} en cola
            </p>
          </div>
          <div>
            <button 
            type="button"
            onClick={() => clearCart()}
            className="bg-gray-100 font-bold p-2 rounded-lg text-sm hover:cursor-pointer hover:bg-gray-800 hover:text-white transition-all"
            >Vaciar Carrito</button>
            </div>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-50 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="bg-gray-50 p-4 rounded-full text-gray-300 mb-3">
              <FaShoppingBag size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">El carrito está vacío</h3>
            <p className="text-xs text-gray-400 max-w-[200px] mt-1">
              Selecciona productos del catálogo para comenzar a facturar.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const precioUnitario = actualCurrency === "USD"
              ? `$${item.product.sell.toFixed(2)}`
              : `${(item.product.sell * exchangeRate).toFixed(2)} Bs`

            const subtotal = actualCurrency === "USD"
              ? `$${(item.product.sell * item.quantity).toFixed(2)}`
              : `${(item.product.sell * exchangeRate * item.quantity).toFixed(2)} Bs`

            return (
              <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-3">
              
                <div className="relative h-16 w-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  <Image  
                    src={item.product.image || "/placeholder-product.png"} 
                    alt={item.product.name}
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                </div>

                {/* Info Principal del Producto */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm truncate leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {precioUnitario} c/u
                  </p>
                  
                  {/* Subtotal en pequeño abajo del precio */}
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Subtotal: <span className="text-amber-500 font-bold">{subtotal}</span>
                  </p>
                </div>

                {/* Controles de Cantidad Estéticos en Fila */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">

                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1">
                    <button 
                      type="button"
                      onClick={() => decreaseQuantity(item)}
                      className="text-gray-500 hover:bg-white hover:text-gray-900 h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer text-xs"
                    >
                      <FaMinus />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-800">
                      {item.quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => addToCart(item.product, 1)}
                      className="text-gray-500 hover:bg-white hover:text-gray-900 h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer text-xs"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div>
                    <button 
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-white font-bold bg-gray-800 p-2 text-[11px] rounded-lg hover:bg-amber-400 hover:cursor-pointer transition-all">
                      Eliminar</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pie del Carrito con el Total General */}
      {cart.length > 0 && (
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">Total a Pagar</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {totalDisplay}
            </span>
          </div>

          <button
            type="button"
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-amber-400 hover:text-gray-900 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            Procesar Venta 
          </button>
        </div>
      )}
    </div>
  )
}
