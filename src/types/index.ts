
export type Product = {
    id: string;
    name: string;
    category: 'Insumos' | 'Herramientas' | 'Moldes' | 'Colorantes'; // Categoria que tendra el producto
    cost: number; // Precio al que se compra al proveedor
    revenue: number; // Porcentaje de ganancia (ej. 30 para 30%)
    sell: number; // Calculado automáticamente: costo * (1 + margen/100)
    stock: number;
    minStock: number; // Para la alerta de punto de reorden crítico
    unit: string; // "Kg", "Unidad", "Litro", etc.
}

export type ItemCart = {
    product: Product
    quantity: number
}