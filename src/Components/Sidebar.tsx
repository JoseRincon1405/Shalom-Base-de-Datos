"use client";

import { useAppStore } from "@/stores/useAppStore";
import { FaStore, FaBoxes, FaChartLine, FaCog } from "react-icons/fa"

export default function Sidebar() {

    const activeTab = useAppStore((state) => state.activeTab);
    const setActiveTab = useAppStore((state) => state.setActiveTab);

    const tabs = [
        { id: "punto-de-venta" ,name: "Punto de Venta", icon: <FaStore /> },
        { id: "inventario",name: "Inventario", icon: <FaBoxes /> },
        { id: "ventas",name: "Ventas", icon: <FaChartLine /> },
        { id: "configuracion",name: "Configuración", icon: <FaCog /> },
    ] as const;

  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen p-5 flex flex-col justify-between fixed left-0 top-0">
        <div>
        <div className="mb-10 pt-2 px-2">
            <h1 className="font-black text-3xl tracking-tight text-amber-400">inFlow</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">SaaS de Comercio</p>
        </div>

        <nav className="space-y-2">
            {tabs.map((tab) => {
                const isSelected = activeTab === tab.id;


                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                            ? "bg-amber-400 text-gray-900 shadow-md font-bold" 
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                    >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.name}

                    </button>
                )
            })}
        </nav>
        </div>

        <div className="border-t border-gray-800 pt-4 px-2 text-xs text-gray-500">
            Modo Híbrido Activo
        </div>
    </aside>
  )
}
