"use server" // ¡Obligatorio para decirle a Next.js que esto corre en el servidor!

import { prisma } from "@/lib/prisma";
import { Product } from "@/types";

export type CreateProductInput = Omit<Product, "id">

export async function getProducts() {
  try {

    const dbProducts = await prisma.product.findMany()
    
    const products: Product[] = dbProducts.map((product ) => ({
      ...product,
      cost: product.cost.toNumber(),
      sell: product.sell.toNumber(), 
    }));
    
    return products

  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
}

export async function createProduct(data: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {

    const newDbProduct = await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        cost: data.cost, // Prisma acepta un 'number' o 'string' y lo guarda como Decimal
        sell: data.sell, // Prisma acepta un 'number' o 'string' y lo guarda como Decimal
        stock: data.stock,
        minStock: data.minStock,
        unit: data.unit,
        image: data.image,
      },
    });

   
    const formattedProduct: Product = {
      ...newDbProduct,
      cost: newDbProduct.cost.toNumber(),
      sell: newDbProduct.sell.toNumber(),
    };

    return { 
      success: true, 
      product: formattedProduct 
    };

  } catch (error: unknown) {
    // Capturamos el código de error P2002 de Prisma (violación de restricción única / nombre duplicado)
    if (error.code === "P2002") {
      return { 
        success: false, 
        error: "Ya existe un producto registrado con ese mismo nombre." 
      };
    }

    console.error("Error al crear producto en Neon:", error);
    return { 
      success: false, 
      error: "Ocurrió un error inesperado al registrar el producto." 
    };
  }
}
  


