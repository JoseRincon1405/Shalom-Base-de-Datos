"use client";

import { Calculator, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateRateAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useRateStore } from "@/store/useRateStore";
import { formatUSD, formatVES, round2 } from "@/lib/utils";

export function RateModal({
  open,
  onClose,
  tasa,
}: {
  open: boolean;
  onClose: () => void;
  tasa: number;
}) {
  const router = useRouter();
  const setTasa = useRateStore((state) => state.setTasa);
  const [value, setValue] = useState(tasa.toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = Number(value.replace(",", "."));
  const preview = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await updateRateAction({ tasaDolarVes: parsed });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTasa(result.data?.tasa ?? parsed);
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tasa de cambio del día"
      description="Solo un administrador puede modificarla. Aplica a todo el POS en tiempo real."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending} icon={<DollarSign className="h-4 w-4" />}>
            Actualizar tasa
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs uppercase tracking-wider text-gold/70">
            Tasa vigente
          </p>
          <p className="mt-1 text-2xl font-semibold text-gold-soft">
            {formatVES(tasa)} <span className="text-sm font-normal text-zinc-500">/ USD</span>
          </p>
        </div>

        <Field
          label="Nueva tasa (Bs por 1 USD)"
          htmlFor="tasa"
          error={error ?? undefined}
          hint="Ejemplo: 36.50"
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
              Bs
            </span>
            <Input
              id="tasa"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="pl-9 text-lg font-semibold"
              autoFocus
            />
          </div>
        </Field>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-950/60 p-3 text-xs text-zinc-400">
          <Calculator className="h-4 w-4 shrink-0 text-gold" />
          <p>
            {formatUSD(1)} equivale a{" "}
            <span className="font-semibold text-zinc-200">
              {formatVES(round2(preview))}
            </span>
            . Cada venta guarda la tasa aplicada para reportes históricos.
          </p>
        </div>
      </div>
    </Modal>
  );
}
