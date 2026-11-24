# Arquitectura — Club de Pádel (F0 Fundamentos)

## Visión general

Aplicación web para gestión integral de un club de pádel. F0 establece los
cimientos: identidad, seguridad, canchas, jugadores, catálogo, ajustes y
gestión de personal con roles verificados en base de datos.

## Stack

- **Frontend**: React 18 + Vite 5 + TypeScript estricto
- **UI**: Tailwind CSS + componentes shadcn/ui (Radix primitives)
- **Routing**: React Router 6
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Testing**: Vitest (unitarios) + Playwright (E2E)
- **Deploy**: Netlify (configurado con `netlify.toml`)

## Estructura de carpetas

```
src/
  app/           # Router, layout administrativo
  components/ui/ # Componentes de UI reutilizables (button, input, dialog, etc.)
  features/
    auth/        # Contexto de autenticación, login, protected route, no-access
    dashboard/   # Panel principal
    players/     # Gestión de jugadores
    courts/      # Gestión de canchas
    catalog/     # Catálogo de productos y servicios
    settings/    # Configuración del club
    staff/       # Gestión de personal y roles
  lib/
    supabase/    # Cliente Supabase singleton
    validation/  # Validación compartida (teléfono MX, precios, etc.)
    auth/        # Permisos por rol
    utils.ts     # Utilidad cn() para clases
  types/         # Tipos de TypeScript (Database schema)
  styles/        # CSS global + variables de tema
  test/          # Setup de Vitest
tests/
  unit/          # Pruebas unitarias (Vitest)
  e2e/           # Pruebas E2E (Playwright)
docs/            # Documentación
```

## Modelo de datos

### Tablas (8 migraciones aplicadas)

1. **clubs** — Registro único del club (nombre, timezone, moneda)
2. **club_memberships** — Vincula usuarios (auth.users) con club + rol
3. **club_settings** — Datos de contacto y horarios (1:1 con club)
4. **players** — Jugadores del club (no usuarios del sistema)
5. **courts** — Canchas del club
6. **catalog_categories** — Categorías del catálogo (5 predefinidas)
7. **catalog_items** — Productos y servicios con precio en centavos
8. **audit_events** — Historial no destructivo de cambios sensibles

### Roles

| Rol | Permisos F0 |
|-----|-------------|
| propietario | Todo: personal, canchas, jugadores, catálogo, ajustes |
| gerente | Canchas, jugadores, catálogo (incluye precios) |
| cajero | Jugadores (crear/editar); catálogo sólo lectura; NO precios |
| cocina | Sin permisos de gestión en F0 |
| entrenador | Sin permisos de gestión en F0 |
| organizador | Sin permisos de gestión en F0 |

### Diseño con club_id

Todas las tablas operativas incluyen `club_id` desde F0, preparado para
multi-club sin implementar la funcionalidad. Las policies RLS filtran
por `user_club_id(auth.uid())`.

## Seguridad

### RLS (Row Level Security)

- RLS activada en TODAS las tablas.
- El rol `anon` NO tiene ningún grant en tablas F0.
- El rol `authenticated` tiene grants explícitos por tabla y verb.
- Functions helper (`is_club_member`, `user_club_role`, `user_club_id`)
  usan `SECURITY INVOKER` con `search_path = public` fijo.
- Políticas verifican membresía + rol en DB, no en el frontend.
- Un usuario sin membresía no puede leer ni escribir datos del club.
- Nadie puede autoelevar privilegios: la policy UPDATE de memberships
  requiere que el solicitante sea propietario.
- `audit_events` es append-only (sin UPDATE ni DELETE).

### Verificación

- `get_advisors` (security): 0 findings.
- `get_security_posture`: todas las tablas con RLS, grants explícitos.

### Secretos

- `.env` en `.gitignore`.
- Sólo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (publicables) en frontend.
- `SUPABASE_SERVICE_ROLE_KEY` nunca se importa en código frontend.

## Dinero

- Los precios se guardan en centavos enteros (`price_cents`, integer).
- Conversión en frontend: `pesosToCents()` / `centsToPesos()`.
- No se usa `float` para dinero en ningún momento.

## Validación

- Teléfono México: 10 dígitos, normalización de prefijos (+52, 044, 045).
- Precios: positivos, máximo $999,999.99.
- Duplicados: índice único en `(club_id, normalized_phone)`.
- Campos requeridos validados en frontend y DB (NOT NULL, CHECK).

## Decisiones de diseño

1. **Jugadores ≠ usuarios**: los jugadores no tienen cuenta de acceso.
   Son registros operativos del club.
2. **Soft-delete**: `active=false` en jugadores, canchas y artículos.
   No se borran registros que puedan romper referencias futuras.
3. **Audit append-only**: `audit_events` no se actualiza ni borra.
4. **Cajero sin edición de precios**: la policy RLS de UPDATE en
   `catalog_items` no incluye al rol cajero, por lo que la DB rechaza
   cualquier intento de modificar precios (o cualquier campo) desde
   ese rol, independientemente de la UI.
5. **Alta de personal**: usa `supabase.auth.signUp` desde la sesión del
   propietario. En producción, esto requiere que "Allow new users to
   sign up" esté activado en Supabase Auth settings, o se puede usar
   el dashboard de User Management para crear usuarios manualmente.

## Límites de F0

- Sin agenda, reservas ni bloques horarios.
- Sin caja, cobros, cortes ni pagos mixtos.
- Sin retas, inscripciones ni listas de espera.
- Sin Patodólares ni comisiones.
- Sin comandas, clases ni inventario.
- Sin integraciones WhatsApp o Clip.
- Sin funcionalidad multi-club (estructura preparada, no activada).
- Los módulos futuros aparecen en el menú como "Próximamente".
