import { FaSearch } from "react-icons/fa"

export default function SearchBar() {



  return (
    <>

    <div className="flex flex-row">
        
        <input 
        type="text" 
        className="bg-gray-100 p-3 flex justify-center w-2xs h-10 rounded-l-lg focus:outline-0"
        placeholder="Nombre de producto"
        />
        <select 
        className="bg-gray-100 text-gray-600 px-4 text-2"
        >
            <option value="" >Todas</option>
        </select>
        <button 
        type="button"
        className="p-3 bg-amber-400 h-10 rounded-r-lg hover:cursor-pointer hover:bg-amber-500"
        >
             <FaSearch />
        </button>
  
    </div>
    </>
  )
}
