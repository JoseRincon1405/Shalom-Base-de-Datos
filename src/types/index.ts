
export type Product = {
    id: string;
    name: string;
    category: string // Categoria que tendra el producto
    cost: number; // Precio al que se compra al proveedor
    sell: number; // Calculado automáticamente: costo * (1 + margen/100)
    stock: number;
    minStock: number; // Para la alerta de punto de reorden crítico
    unit: string; // "Kg", "Unidad", "Litro", etc.
    image: string; // URL de la imagen del producto
}

export type ItemCart = {
    product: Product
    quantity: number
}