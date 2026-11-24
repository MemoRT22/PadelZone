/*
# Crear tabla club_memberships + funciones helper + políticas clubs

## Descripción
Crea la tabla `club_memberships` que vincula usuarios (auth.users) con un club
y un rol. También crea las funciones helper SQL reutilizables en RLS y añade
las políticas RLS para `clubs` y `club_memberships`.

## Tablas nuevas
- `club_memberships`: id, club_id (FK→clubs), user_id, role, display_name,
  active, timestamps

## Roles definidos
propietario, gerente, cajero, cocina, entrenador, organizador

## Seguridad
- RLS activada en club_memberships.
- Un usuario sólo puede leer su propia membresía (o todas si es propietario).
- Sólo propietario puede insertar/update memberships.
- Nadie puede autoelevar privilegios.
- Funciones helper: SECURITY INVOKER para respetar RLS.
- Grants: SELECT, INSERT, UPDATE a authenticated.

## Notas
1. El rol se guarda en club_memberships (no en user_metadata editable).
2. Trigger updated_at automático.
*/

-- ============================================================
-- Tabla: club_memberships (se crea ANTES que las funciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (
    role IN ('propietario', 'gerente', 'cajero', 'cocina', 'entrenador', 'organizador')
  ),
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_club_memberships_user_id
  ON public.club_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id
  ON public.club_memberships(club_id);

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.club_memberships TO authenticated;

-- ============================================================
-- Funciones helper (ahora la tabla existe)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_club_member(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE user_id = check_uid
    AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_club_role(check_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT role::text FROM public.club_memberships
    WHERE user_id = check_uid AND active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_club_id(check_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT club_id FROM public.club_memberships
    WHERE user_id = check_uid AND active = true
    LIMIT 1;
$$;

-- ============================================================
-- Políticas RLS para clubs
-- ============================================================

DROP POLICY IF EXISTS "members_can_read_clubs" ON public.clubs;
CREATE POLICY "members_can_read_clubs"
ON public.clubs FOR SELECT
TO authenticated
USING (id = public.user_club_id(auth.uid()));

DROP POLICY IF EXISTS "propietario_can_update_clubs" ON public.clubs;
CREATE POLICY "propietario_can_update_clubs"
ON public.clubs FOR UPDATE
TO authenticated
USING (id = public.user_club_id(auth.uid()) AND public.user_club_role(auth.uid()) = 'propietario')
WITH CHECK (id = public.user_club_id(auth.uid()) AND public.user_club_role(auth.uid()) = 'propietario');

-- ============================================================
-- Políticas RLS para club_memberships
-- ============================================================

-- Un usuario siempre puede leer su propia membresía
DROP POLICY IF EXISTS "users_can_read_own_membership" ON public.club_memberships;
CREATE POLICY "users_can_read_own_membership"
ON public.club_memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Un propietario puede leer todas las memberships de su club
DROP POLICY IF EXISTS "propietario_can_read_club_memberships" ON public.club_memberships;
CREATE POLICY "propietario_can_read_club_memberships"
ON public.club_memberships FOR SELECT
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) = 'propietario'
);

-- Sólo propietario puede insertar memberships
DROP POLICY IF EXISTS "propietario_can_insert_memberships" ON public.club_memberships;
CREATE POLICY "propietario_can_insert_memberships"
ON public.club_memberships FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) = 'propietario'
);

-- Sólo propietario puede actualizar memberships
DROP POLICY IF EXISTS "propietario_can_update_memberships" ON public.club_memberships;
CREATE POLICY "propietario_can_update_memberships"
ON public.club_memberships FOR UPDATE
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) = 'propietario'
)
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) = 'propietario'
);

-- ============================================================
-- Trigger para updated_at (compartido por todas las tablas)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_memberships_updated_at ON public.club_memberships;
CREATE TRIGGER trg_club_memberships_updated_at
  BEFORE UPDATE ON public.club_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_clubs_updated_at ON public.clubs;
CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
