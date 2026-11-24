/*
# Court Bookings — Agenda y Reservas de Canchas

## Descripción general
Crea la tabla `court_bookings` para registrar la ocupación de canchas
(reservas de renta y bloqueos administrativos). Implementa prevención
de traslapes a nivel PostgreSQL mediante una restricción de exclusión
GiST sobre `court_id` + `time_range` (tstzrange).

## Tabla nueva
- `court_bookings`
  - `id` (uuid, PK)
  - `court_id` (uuid, FK → courts.id)
  - `booking_type` (text, CHECK: 'reserva' | 'bloqueo')
  - `status` (text, CHECK: 'activa' | 'cancelada', default 'activa')
  - `time_range` (tstzrange, NOT NULL) — intervalo inicio/fin con zona horaria
  - `responsible_name` (text, nullable) — nombre del responsable de la reserva
  - `responsible_phone` (text, nullable) — teléfono opcional
  - `player_id` (uuid, nullable, FK → players.id) — asociación opcional
  - `notes` (text, nullable)
  - `created_by` (uuid, NOT NULL DEFAULT auth.uid()) — usuario que creó el registro
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Restricción de exclusión (anti-traslapes)
- Exclusion constraint GiST: impide que dos registros con status='activa'
  ocupen la misma cancha durante intervalos que se traslapen.
- Solo aplica a registros activos (cancelados no bloquean).
- Permite reservas consecutivas que comparten solo el límite.

## Seguridad
- RLS habilitada en `court_bookings`.
- SELECT: todos los miembros del club pueden consultar.
- INSERT: propietario, gerente, cajero pueden crear reservas;
  propietario, gerente pueden crear bloqueos.
- UPDATE: propietario, gerente, cajero pueden modificar reservas;
  propietario, gerente pueden modificar bloqueos.
- DELETE: no se permite (soft-delete via status='cancelada').
- Grant service_role para auditoría futura.

## Notas
- Requiere extensión `btree_gist` para GiST sobre uuid.
- `created_by` se establece automáticamente desde auth.uid().
- Los registros cancelados se conservan para historial operativo.
- La zona horaria operativa es America/Cancun (manejada en aplicación).
*/

-- Extensión necesaria para GiST sobre uuid + tstzrange
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabla de ocupación de canchas
CREATE TABLE IF NOT EXISTS court_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
  booking_type text NOT NULL CHECK (booking_type IN ('reserva', 'bloqueo')),
  status text NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'cancelada')),
  time_range tstzrange NOT NULL,
  responsible_name text,
  responsible_phone text,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice GIST para consulta eficiente de traslapes
CREATE INDEX IF NOT EXISTS court_bookings_time_range_idx
  ON court_bookings USING GIST (time_range);

-- Restricción de exclusión: ninguna cancha puede tener dos ocupaciones activas
-- que se traslapen en el tiempo. Los registros cancelados no cuentan.
-- Dos reservas consecutivas (límite compartido) sí se permiten (&& es traslape estricto).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'court_bookings_no_overlap'
  ) THEN
    ALTER TABLE court_bookings
      ADD CONSTRAINT court_bookings_no_overlap
      EXCLUDE USING GIST (
        court_id WITH =,
        time_range WITH &&
      )
      WHERE (status = 'activa');
  END IF;
END $$;

-- RLS
ALTER TABLE court_bookings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON court_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON court_bookings TO service_role;

-- Políticas

-- SELECT: todos los miembros pueden ver
DROP POLICY IF EXISTS "members_read_bookings" ON court_bookings;
CREATE POLICY "members_read_bookings"
  ON court_bookings FOR SELECT
  TO authenticated
  USING (security.is_club_member(auth.uid()));

-- INSERT: propietario/gerente/cajero pueden crear reservas;
-- propietario/gerente pueden crear bloqueos
DROP POLICY IF EXISTS "staff_insert_bookings" ON court_bookings;
CREATE POLICY "staff_insert_bookings"
  ON court_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    security.is_club_member(auth.uid())
    AND (
      (booking_type = 'reserva'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero'))
      OR
      (booking_type = 'bloqueo'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente'))
    )
  );

-- UPDATE: propietario/gerente/cajero pueden modificar reservas;
-- propietario/gerente pueden modificar bloqueos
DROP POLICY IF EXISTS "staff_update_bookings" ON court_bookings;
CREATE POLICY "staff_update_bookings"
  ON court_bookings FOR UPDATE
  TO authenticated
  USING (
    security.is_club_member(auth.uid())
    AND (
      (booking_type = 'reserva'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero'))
      OR
      (booking_type = 'bloqueo'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente'))
    )
  )
  WITH CHECK (
    security.is_club_member(auth.uid())
    AND (
      (booking_type = 'reserva'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero'))
      OR
      (booking_type = 'bloqueo'
        AND security.user_club_role(auth.uid()) IN ('propietario', 'gerente'))
    )
  );

-- No se permite DELETE (soft-delete via status='cancelada')
