import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Dejamos solo los logs, que sí es una propiedad válida
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;