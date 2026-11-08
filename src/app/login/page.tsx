import {
  Boxes,
  CircleDollarSign,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";
import { Spinner } from "@/components/ui/spinner";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function LoginShell({ callbackUrl }: { callbackUrl: string }) {
  const showDemo = process.env.NODE_ENV !== "production";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 -left-40 h-[32rem] w-[32rem] rounded-full bg-gold/5 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-ink-900/70 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden flex-col justify-between gap-10 border-r border-line-soft bg-gradient-to-b from-ink-850 to-ink-900 p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xl font-semibold tracking-tight text-zinc-50">
                  in<span className="text-gold">Flow</span>
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Inventario & POS
                </p>
              </div>
            </div>

            <h1 className="mt-10 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-zinc-50">
              Todo tu negocio de repostería,{" "}
              <span className="text-gold-soft">en un solo flujo.</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
              Controla inventario fraccionado, ventas en dólares y bolívares, y
              reportes de caja con la tasa congelada de cada operación.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                icon: <Boxes className="h-4 w-4" />,
                title: "Inventario de precisión",
                text: "Stock decimal para kilos, litros, gramos y unidades.",
              },
              {
                icon: <CircleDollarSign className="h-4 w-4" />,
                title: "Multidivisa USD / VES",
                text: "Tasa global en tiempo real y congelada por venta.",
              },
              {
                icon: <ReceiptText className="h-4 w-4" />,
                title: "Cierre Z inmediato",
                text: "Desglose por Zelle, Pago Móvil, efectivo y mixto.",
              },
              {
                icon: <ShieldCheck className="h-4 w-4" />,
                title: "Roles y auditoría",
                text: "Accesos ADMIN/CAJERO y trazabilidad de cada ajuste.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-xl border border-line-soft bg-ink-950/40 p-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-zinc-600">
            inFlow · hecho para negocios que venden por peso y por cariño.
          </p>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="text-xl font-semibold tracking-tight text-zinc-50">
                  in<span className="text-gold">Flow</span>
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gold-soft">
                <LockKeyhole className="h-3 w-3" /> Acceso seguro
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
                Inicia sesión
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ingresa con las credenciales asignadas por tu administrador.
              </p>
            </div>

            <div className="mt-7">
              <LoginForm callbackUrl={callbackUrl} showDemo={showDemo} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const raw = params.callbackUrl;
  const callbackUrl =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "/pos";

  return <LoginShell callbackUrl={callbackUrl} />;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center">
          <Spinner className="h-8 w-8" />
        </main>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
