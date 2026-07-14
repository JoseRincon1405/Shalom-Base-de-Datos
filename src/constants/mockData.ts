// src/constants/mockData.ts
import { Product } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: 'Harina de Trigo Especial Repostería',
    category: 'Insumos',
    cost: 1.20,
    revenue: 25,
    sell: 1.50,
    stock: 50,
    minStock: 10,
    unit: 'Kg',
    image: '/harina-de-trigo.jpg'
  },
  {
    id: '2',
    name: 'Azúcar Glass Extra Fina',
    category: 'Insumos',
    cost: 1.80,
    revenue: 30,
    sell: 2.34,
    stock: 8, // Provocará alerta de stock crítico
    minStock: 15,
    unit: 'Kg',
    image: '/azucar-glass.jpeg'
  },
  {
    id: '3',
    name: 'Boquilla de Acero Inoxidable Nro 1M (Estrella)',
    category: 'Herramientas',
    cost: 2.00,
    revenue: 40,
    sell: 2.80,
    stock: 12,
    minStock: 5,
    unit: 'Unidad',
    image: '/boquillas.jpg'
  },
  {
    id: '4',
    name: 'Colorante en Gel Rojo Navidad 60ml',
    category: 'Colorantes',
    cost: 3.50,
    revenue: 35,
    sell: 4.72,
    stock: 20,
    minStock: 6,
    unit: 'Unidad',
    image: '/colorante-gel.jpg'
  },
  {
    id: '5',
    name: 'Molde de Aluminio Redondo 20cm',
    category: 'Moldes',
    cost: 5.00,
    revenue: 30,
    sell: 6.50,
    stock: 4,
    minStock: 5, // Alerta
    unit: 'Unidad',
    image: '/molde-aluminio.jpg'
  }
];