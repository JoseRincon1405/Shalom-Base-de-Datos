"use server"

import { prisma } from "@/lib/prisma";

export type SaleItemInput = {
  productId: string;
  quantity: number;
  priceAtSale: number;
};

export async function createSale(items: SaleItemInput[], totalUSD: number) {
  try {
    if (items.length === 0) {
      return { success: false, error: "El carrito está vacío." };
    }

    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Verificar stock producto por producto
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true } 
        });

        if (!product) {
          throw new Error(`El producto ya no existe en el inventario.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para: ${product.name}. Disponible: ${product.stock}`);
        }
      }

      // 2. Crear Venta y sus SaleItems de forma anidada
      const sale = await tx.sale.create({
        data: {
          total: totalUSD,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.priceAtSale,
            })),
          },
        },
      });

      // 3. Modificar el stock en el inventario
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    });

    return { success: true, saleId: result.id };

  } catch (error: any) {
    console.error("Error en la transacción de venta:", error.message);
    return { 
      success: false, 
      error: error.message || "Ocurrió un error inesperado al procesar la venta." 
    };
  }
}