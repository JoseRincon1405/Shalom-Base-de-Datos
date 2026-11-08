import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryClient } from "@/components/inventory/inventory-client";
import { PageLoader } from "@/components/ui/spinner";
import { requireAdmin } from "@/lib/auth";
import { getInventarioData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Inventario",
};

async function InventoryLoader() {
  await requireAdmin();
  const { productos, categorias, movimientos } = await getInventarioData();

  return (
    <InventoryClient
      productos={productos}
      categorias={categorias}
      movimientos={movimientos}
    />
  );
}

export default function InventarioPage() {
  return (
    <Suspense fallback={<PageLoader label="Cargando inventario…" />}>
      <InventoryLoader />
    </Suspense>
  );
}
