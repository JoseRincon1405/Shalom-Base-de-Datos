import type { Metadata } from "next";
import { Suspense } from "react";

import { CierreClient } from "@/components/cierre/cierre-client";
import { PageLoader } from "@/components/ui/spinner";
import { requireUser } from "@/lib/auth";
import { getCierre, getTasaActual } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cierre de caja",
};

async function CierreLoader() {
  await requireUser();
  const [reporte, tasa] = await Promise.all([getCierre(), getTasaActual()]);

  return <CierreClient reporte={reporte} tasa={tasa} />;
}

export default function CierrePage() {
  return (
    <Suspense fallback={<PageLoader label="Preparando el cierre…" />}>
      <CierreLoader />
    </Suspense>
  );
}
