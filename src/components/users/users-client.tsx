"use client";

import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createUserAction,
  toggleUserActiveAction,
  updateUserAction,
} from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ROL_LABELS, ROL_OPTIONS } from "@/lib/constants";
import type { Rol, UsuarioDTO } from "@/lib/types";
import { cn, formatDate, initials } from "@/lib/utils";

type Notice = { kind: "success" | "error"; text: string };

export function UsersClient({
  usuarios,
  currentUserId,
}: {
  usuarios: UsuarioDTO[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usuarios;
    return usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(query) ||
        usuario.email.toLowerCase().includes(query),
    );
  }, [usuarios, search]);

  const stats = useMemo(() => {
    const activos = usuarios.filter((usuario) => usuario.activo);
    return {
      total: usuarios.length,
      activos: activos.length,
      admins: activos.filter((usuario) => usuario.rol === "ADMIN").length,
      cajeros: activos.filter((usuario) => usuario.rol === "CAJERO").length,
    };
  }, [usuarios]);

  function changeRole(usuario: UsuarioDTO, rol: Rol) {
    if (rol === usuario.rol) return;
    setPendingId(usuario.id);

    startTransition(async () => {
      const result = await updateUserAction({ id: usuario.id, rol });
      setPendingId(null);

      if (!result.ok) {
        setNotice({ kind: "error", text: result.error });
        return;
      }

      setNotice({ kind: "success", text: "Rol actualizado" });
      router.refresh();
    });
  }

  function toggleActive(usuario: UsuarioDTO) {
    setPendingId(usuario.id);

    startTransition(async () => {
      const result = await toggleUserActiveAction(usuario.id, !usuario.activo);
      setPendingId(null);

      if (!result.ok) {
        setNotice({ kind: "error", text: result.error });
        return;
      }

      setNotice({
        kind: "success",
        text: usuario.activo ? "Usuario desactivado" : "Usuario activado",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm shadow-xl backdrop-blur",
            notice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-red-500/30 bg-red-500/15 text-red-200",
          )}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Usuarios"
          value={stats.total}
          hint={`${stats.activos} activos`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Administradores"
          value={stats.admins}
          hint="Acceso total"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent
        />
        <StatCard
          label="Cajeros"
          value={stats.cajeros}
          hint="Solo punto de venta"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Inactivos"
          value={stats.total - stats.activos}
          hint="Sin acceso al sistema"
          icon={<UserX className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Equipo de trabajo"
          description="Administra roles y accesos. Siempre debe quedar un administrador activo."
          action={
            <Button
              size="sm"
              onClick={() => setFormOpen(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Nuevo usuario
            </Button>
          }
        />

        <div className="border-b border-line-soft p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o correo…"
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Sin usuarios"
            description="No encontramos usuarios que coincidan con la búsqueda."
            icon={<Users className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line-soft text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Ventas</th>
                  <th className="px-4 py-3 font-medium">Alta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((usuario) => {
                  const isSelf = usuario.id === currentUserId;
                  const busy = pendingId === usuario.id;

                  return (
                    <tr
                      key={usuario.id}
                      className={cn(
                        "border-b border-line-soft/70 transition-colors hover:bg-white/[0.02]",
                        !usuario.activo && "opacity-55",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-xs font-semibold text-gold-soft">
                            {initials(usuario.nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-100">
                              {usuario.nombre}
                              {isSelf ? (
                                <span className="ml-2 text-[10px] uppercase tracking-wider text-gold/70">
                                  tú
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-[11px] text-zinc-500">
                              {usuario.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <Badge variant="gold">{ROL_LABELS[usuario.rol]}</Badge>
                        ) : (
                          <Select
                            value={usuario.rol}
                            disabled={busy || !usuario.activo}
                            onChange={(event) =>
                              changeRole(usuario, event.target.value as Rol)
                            }
                            className="h-8 w-36 py-0 text-xs"
                            aria-label={`Rol de ${usuario.nombre}`}
                          >
                            {ROL_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {usuario.ventas ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-zinc-500">
                        {formatDate(usuario.creadoEn)}
                      </td>
                      <td className="px-4 py-3">
                        {usuario.activo ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="danger">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            disabled={isSelf || busy}
                            onClick={() => toggleActive(usuario)}
                            className={cn(
                              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                              isSelf
                                ? "cursor-not-allowed text-zinc-700"
                                : usuario.activo
                                  ? "text-red-300 hover:bg-red-500/10"
                                  : "text-emerald-300 hover:bg-emerald-500/10",
                            )}
                            title={
                              isSelf
                                ? "No puedes desactivar tu propia cuenta"
                                : usuario.activo
                                  ? "Desactivar acceso"
                                  : "Activar acceso"
                            }
                          >
                            {usuario.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen ? (
        <UserForm
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice({ kind: "success", text: "Usuario creado" });
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function UserForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("CAJERO");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createUserAction({ nombre, email, password, rol });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo usuario"
      description="El usuario podrá iniciar sesión inmediatamente con estas credenciales."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending}>
            Crear usuario
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <Field label="Nombre completo" htmlFor="user-nombre">
          <Input
            id="user-nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej: María Pérez"
            autoFocus
          />
        </Field>

        <Field label="Correo" htmlFor="user-email">
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@inflow.local"
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="user-password"
          hint="Mínimo 8 caracteres, con letras y números."
        >
          <Input
            id="user-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Field label="Rol" htmlFor="user-rol">
          <Select
            id="user-rol"
            value={rol}
            onChange={(event) => setRol(event.target.value as Rol)}
          >
            {ROL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-start gap-2 rounded-xl border border-line bg-ink-950/40 px-3 py-2.5 text-[11px] text-zinc-500">
          <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
          <p>
            Los administradores gestionan inventario, reportes y usuarios. Los
            cajeros solo acceden al punto de venta y al cierre del día.
          </p>
        </div>
      </div>
    </Modal>
  );
}
