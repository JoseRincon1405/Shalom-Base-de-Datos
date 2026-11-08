import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsClient } from "@/components/reports/reports-client";
import { PageLoader } from "@/components/ui/spinner";
import { requireAdmin } from "@/lib/auth";
import { getReporte } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reportes",
};

type ReportesSearchParams = {
  desde?: string;
  hasta?: string;
};

async function ReportsLoader({
  searchParams,
}: {
  searchParams: Promise<ReportesSearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const reporte = await getReporte(params.desde, params.hasta);

  return <ReportsClient reporte={reporte} />;
}

export default function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<ReportesSearchParams>;
}) {
  return (
    <Suspense fallback={<PageLoader label="Calculando reporte…" />}>
      <ReportsLoader searchParams={searchParams} />
    </Suspense>
  );
}
