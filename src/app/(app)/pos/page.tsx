import type { Metadata } from "next";
import { Suspense } from "react";

import { PosClient } from "@/components/pos/pos-client";
import { PageLoader } from "@/components/ui/spinner";
import { getPosData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Punto de venta",
};

async function PosLoader() {
  const { productos, categorias, tasa } = await getPosData();

  return (
    <PosClient productos={productos} categorias={categorias} tasa={tasa} />
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<PageLoader label="Cargando catálogo…" />}>
      <PosLoader />
    </Suspense>
  );
}
