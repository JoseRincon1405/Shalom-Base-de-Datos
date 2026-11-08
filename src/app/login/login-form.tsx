"use client";

import { Eye, EyeOff, LogIn, Mail, ShieldAlert } from "lucide-react";
import { useActionState, useState } from "react";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({
  callbackUrl,
  showDemo,
}: {
  callbackUrl: string;
  showDemo: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  const emailError = state && !state.ok ? state.fieldErrors?.email?.[0] : undefined;
  const passwordError =
    state && !state.ok ? state.fieldErrors?.password?.[0] : undefined;
  const generalError =
    state && !state.ok && !emailError && !passwordError
      ? state.error
      : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field
        label="Correo electrónico"
        htmlFor="email"
        error={emailError ?? generalError}
      >
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className="pl-9"
            defaultValue=""
            required
          />
        </div>
      </Field>

      <Field label="Contraseña" htmlFor="password" error={passwordError}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </Field>

      {generalError ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{generalError}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="w-full"
        icon={<LogIn className="h-4 w-4" />}
      >
        Entrar a inFlow
      </Button>

      {showDemo ? (
        <div className="rounded-xl border border-line bg-ink-950/60 p-3 text-[11px] leading-relaxed text-zinc-500">
          <p className="font-medium text-zinc-400">Credenciales del seed (dev)</p>
          <p className="mt-1">
            <span className="text-gold-soft">Admin:</span> admin@inflow.local /
            Admin123!
          </p>
          <p>
            <span className="text-gold-soft">Cajero:</span> cajero@inflow.local /
            Cajero123!
          </p>
        </div>
      ) : null}
    </form>
  );
}
