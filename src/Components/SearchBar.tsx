"use client"

import { useAppStore } from "@/stores/useAppStore";
import { FaSearch } from "react-icons/fa"



export default function SearchBar() {
  
    const search = useAppStore((state) => state.search);
    const setSearch = useAppStore((state) => state.setSearch);
    const category = useAppStore((state) => state.category);
    const setCategory = useAppStore((state) => state.setCategory);    

  return (
    <>

    <div className="flex flex-row">
        
        <input 
        type="text" 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-gray-100 p-3 w-2xs h-10 rounded-l-lg focus:outline-none"
        placeholder="Nombre de producto"
        />
        <select 
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-gray-100 text-gray-600 px-4 text-sm"
        >
            <option value="Todos" >Todas</option>
            <option value="Insumos" >Insumos</option>
            <option value="Herramientas" >Herramientas</option>
            <option value="Moldes" >Moldes</option>
            <option value="Colorantes" >Colorantes</option>
        </select>
        <button 
        type="button"
        className="flex items-center justify-center w-12 h-10 bg-amber-400 rounded-r-lg hover:cursor-pointer hover:bg-amber-500"
        >
             <FaSearch size={16} />
        </button>
  
    </div>
    </>
  )
}
