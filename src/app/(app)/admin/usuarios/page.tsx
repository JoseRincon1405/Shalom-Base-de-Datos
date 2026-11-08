import type { Metadata } from "next";
import { Suspense } from "react";

import { UsersClient } from "@/components/users/users-client";
import { PageLoader } from "@/components/ui/spinner";
import { requireAdmin } from "@/lib/auth";
import { getUsuarios } from "@/lib/data";

export const metadata: Metadata = {
  title: "Usuarios",
};

async function UsersLoader() {
  const currentUser = await requireAdmin();
  const usuarios = await getUsuarios();

  return (
    <UsersClient usuarios={usuarios} currentUserId={currentUser.id} />
  );
}

export default function UsuariosPage() {
  return (
    <Suspense fallback={<PageLoader label="Cargando usuarios…" />}>
      <UsersLoader />
    </Suspense>
  );
}
