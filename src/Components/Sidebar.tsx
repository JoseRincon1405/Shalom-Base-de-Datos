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
                        className={``}
                    >

                    </button>
                )
            })}
        </nav>
    </aside>
  )
}
