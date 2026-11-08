import { create } from "zustand";

type RateState = {
  tasa: number;
  actualizadoEn: number | null;
  setTasa: (tasa: number) => void;
};

export const useRateStore = create<RateState>()((set) => ({
  tasa: 0,
  actualizadoEn: null,
  setTasa: (tasa) => set({ tasa, actualizadoEn: Date.now() }),
}));

/**
 * Devuelve la tasa global de Zustand. Si el store todavía no fue hidratado
 * (primer render del servidor), usa la tasa recibida como fallback.
 */
export function useTasa(fallback: number): number {
  const tasa = useRateStore((state) => state.tasa);
  return tasa > 0 ? tasa : fallback;
}
