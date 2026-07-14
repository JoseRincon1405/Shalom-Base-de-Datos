import SearchBar from "@/Components/SearchBar"

export default function puntoDeVentaPage() {
  return (
    <div>

        <div className="text-left m-5">
            <h1 className="font-black text-2xl">inFlow</h1>
        </div>

        <nav className="flex justify-center mt-5  ">
            <div>
                <SearchBar />
            </div>

        </nav>
    </div>
  )
}
