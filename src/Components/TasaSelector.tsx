"use client"

import { useAppStore } from "@/stores/useAppStore";
import { useState } from "react";
import { FaMoneyBillWave, FaEdit, FaCheck } from "react-icons/fa";

export default function TasaSelector() {

    const exchangeRate = useAppStore((state) => state.exchangeRate);
    const setExchangeRate = useAppStore((state) => state.setExchangeRate);
    const currency = useAppStore((state) => state.currency);
    const setCurrency = useAppStore((state) => state.setCurrency);

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(exchangeRate.toString());

    const handleSaveExchangeRate = () => {
        const parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue) && parsedValue > 0) {
             setExchangeRate(parsedValue);    
        }
        setIsEditing(false);
    };

return (
    <div className="flex items-center gap-3 bg-white p-1.5 border border-gray-200 rounded-xl shadow-sm">
      {/* Sección para cambiar la Moneda de la Pantalla ($ / Bs) */}
      <div className="flex border-r border-gray-200 pr-2 gap-1">
        <button
          type="button"
          onClick={() => setCurrency("USD")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            currency === "USD" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          $
        </button>
        <button
          type="button"
          onClick={() => setCurrency("BS")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            currency === "BS" ? "bg-amber-400 text-gray-900" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          Bs
        </button>
      </div>

      {/* Sección para mostrar/editar el valor numérico de la Tasa */}
      <div className="flex items-center gap-2 px-2 text-xs">
        <FaMoneyBillWave className="text-emerald-500 text-sm" />
        <span className="text-gray-400 font-medium">Tasa:</span>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-16 border rounded px-1.5 py-0.5 text-center font-bold focus:outline-none"
              step="0.1"
            />
            <button 
              onClick={handleSaveExchangeRate}
              className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600 cursor-pointer"
            >
              <FaCheck size={10} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">{exchangeRate.toFixed(2)} Bs</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <FaEdit size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
