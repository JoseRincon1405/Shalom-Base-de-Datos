# inFlow

Sistema de inventario y punto de venta para un negocio de insumos de repostería. Opera en dólares (USD) con conversión referencial a bolívares (VES) usando la tasa del día, control de stock con decimales (kg, g, ml, L), roles de acceso y reportes de cierre de caja.

## Características

- **Punto de venta**: búsqueda por nombre, categoría o código de barras, carrito con Zustand, cantidades decimales, selección de método de pago y factura con numeración automática.
- **Inventario**: alta/edición de productos con precio de detalle calculado desde costo + margen, precio mayorista opcional, stock mínimo, activación/desactivación y auditoría de movimientos.
- **Ventas ACID**: transacción serializable que relee precios desde la base de datos, valida stock, descuenta inventario, registra movimientos y congela la tasa aplicada.
- **Cierre de caja**: resumen del día por método de pago, ticket promedio, productos más vendidos y detalle de cada factura.
- **Reportes**: filtros por rango de fechas en hora de Venezuela (America/Caracas), desglose por método de pago y exportación CSV.
- **Usuarios y roles**: `ADMIN` (todo el sistema) y `CAJERO` (POS y cierre), con protección para no dejar el sistema sin administradores activos.
- **Tasa de cambio**: editable solo por administradores y aplicada en tiempo real a todo el POS.

## Stack

- Next.js **16.4.5** (App Router, Turbopack, Cache Components + Partial Prefetching)
- React **19.3** y TypeScript estricto
- Tailwind CSS **v4** (tema oscuro/dorado con tokens propios)
- Prisma **7** con driver adapter `@prisma/adapter-pg` sobre PostgreSQL
- Zustand **5** para el carrito y la tasa en cliente
- Zod **4** para validación de entradas
- Autenticación propia con **jose** (JWT en cookie httpOnly) y **bcryptjs**

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior

## Puesta en marcha

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo de entorno a partir del ejemplo:

   ```bash
   copy .env.example .env
   ```

   Edita `.env` y define:

   - `DATABASE_URL`: cadena de conexión de PostgreSQL.
   - `AUTH_SECRET`: secreto largo y aleatorio para firmar las sesiones (mínimo 32 caracteres).

3. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npm run db:deploy
   npm run db:generate
   ```

   Para desarrollo local también puedes usar `npm run db:migrate` (crea/aplica migraciones) o `npm run db:push` (sincroniza el esquema sin historial).

4. Carga los datos iniciales:

   ```bash
   npm run db:seed
   ```

5. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

### Credenciales de demostración (seed)

| Rol    | Correo               | Contraseña  |
| ------ | -------------------- | ----------- |
| Admin  | `admin@inflow.local` | `Admin123!` |
| Cajero | `cajero@inflow.local`| `Cajero123!`|

Cambia estas credenciales antes de publicar en producción.

## Scripts

| Script               | Descripción                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Servidor de desarrollo con Turbopack                   |
| `npm run build`      | Build de producción                                    |
| `npm run start`      | Servidor de producción                                 |
| `npm run lint`       | ESLint                                                 |
| `npm run typecheck`  | Verificación de tipos con TypeScript                   |
| `npm run db:generate`| Genera el cliente de Prisma en `src/generated/prisma`  |
| `npm run db:push`    | Sincroniza el esquema sin crear migraciones            |
| `npm run db:migrate` | Crea y aplica migraciones en desarrollo                |
| `npm run db:deploy`  | Aplica migraciones existentes (producción/CI)          |
| `npm run db:seed`    | Ejecuta `prisma/seed.ts`                               |
| `npm run db:studio`  | Abre Prisma Studio                                     |

## Estructura

```text
prisma/
  schema.prisma                 Modelo de datos (usuarios, productos, ventas, inventario)
  migrations/                   Migración inicial + lockfile
  seed.ts                       Datos iniciales idempotentes
src/
  actions/                      Server Actions (auth, productos, ventas, usuarios, ajustes)
  app/
    (app)/                      Rutas autenticadas con el shell de la aplicación
      pos/                      Punto de venta
      cierre/                   Cierre de caja del día
      admin/                    Panel, inventario, reportes y usuarios
    login/                      Inicio de sesión
    layout.tsx                  Layout raíz y tema global
  components/
    ui/                         Botones, campos, tarjetas, modales, badges, spinners
    shell/                      Sidebar, topbar y modal de tasa
    pos/                        Cliente del punto de venta
    inventory/                  Gestión de inventario
    users/                      Gestión de usuarios
    reports/                    Reportes y exportación CSV
    cierre/                     Cierre de caja
  lib/                          Prisma, auth, validaciones, DTOs, utilidades
  store/                        Stores de Zustand (carrito y tasa)
  proxy.ts                      Protección de rutas y RBAC (nombre de middleware en Next 16)
```

## Notas de arquitectura

- **`src/proxy.ts`**: Next.js 16 reemplazó `middleware.ts` por `proxy.ts`. Aquí se resuelve la sesión, se protegen `/pos`, `/cierre` y `/admin`, y se restringe el área administrativa al rol `ADMIN`.
- **Cache Components**: las lecturas de base de datos están dentro de `<Suspense>` y usan `connection()` para excluirse del prerenderizado. El build no necesita una base de datos disponible.
- **Prisma 7**: la conexión se construye con `PrismaPg` en `src/lib/prisma.ts`. El cliente generado vive en `src/generated/prisma` y se regenera con `npm run db:generate`.
- **Dinero y stock**: se almacenan como `Decimal` en PostgreSQL. Los DTO de `src/lib/data.ts` convierten a `number` antes de enviar datos a componentes cliente.
- **Ventas**: `src/actions/sales.ts` ejecuta todo en una transacción `Serializable` con reintentos ante conflictos (P2034). El precio nunca se confía al cliente.
- **Tasa congelada**: cada venta guarda `tasaCambioAplicada`, de modo que los reportes históricos no cambian si luego se actualiza la tasa.

## Despliegue

1. Configura `DATABASE_URL` y `AUTH_SECRET` en el entorno del servidor.
2. Ejecuta `npm run db:deploy` para aplicar migraciones.
3. Ejecuta `npm run build` y luego `npm run start`.
4. Opcionalmente ejecuta `npm run db:seed` solo en el primer despliegue.

## Solución de problemas

- **`Turbopack build failed: Error parsing package.json`**: el archivo debe estar en UTF-8 sin BOM. Vuelve a guardarlo sin BOM.
- **Error de conexión a PostgreSQL**: verifica `DATABASE_URL`, que el servidor esté accesible y que la base de datos exista.
- **Cambios de esquema no reflejados**: ejecuta `npm run db:generate` después de modificar `prisma/schema.prisma`.
- **Sesión inválida**: borra la cookie `inflow_session` y vuelve a iniciar sesión; cambia `AUTH_SECRET` solo si aceptas invalidar todas las sesiones.
