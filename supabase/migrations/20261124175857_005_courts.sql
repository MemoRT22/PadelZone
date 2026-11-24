/*
# Crear tabla courts

## Descripción
Crea la tabla `courts` para registrar las canchas del club.

## Tablas nuevas
- `courts`: id, club_id (FK→clubs), name, number, surface (opcional),
  description (opcional), active, sort_order, timestamps

## Seguridad
- RLS activada.
- Miembros del club pueden leer canchas.
- Propietario y gerente pueden crear/editar.
- Grants: SELECT a authenticated; INSERT, UPDATE a authenticated.

## Notas
1. sort_order controla el orden de visualización.
2. active=false es soft-delete.
3. Sin agenda ni reservas en F0.
*/

CREATE TABLE IF NOT EXISTS public.courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer NOT NULL CHECK (number >= 1),
  surface text,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courts_club_id ON public.courts(club_id);

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.courts TO authenticated;

DROP POLICY IF EXISTS "members_can_read_courts" ON public.courts;
CREATE POLICY "members_can_read_courts"
ON public.courts FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

DROP POLICY IF EXISTS "managers_can_insert_courts" ON public.courts;
CREATE POLICY "managers_can_insert_courts"
ON public.courts FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

DROP POLICY IF EXISTS "managers_can_update_courts" ON public.courts;
CREATE POLICY "managers_can_update_courts"
ON public.courts FOR UPDATE
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
)
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

DROP TRIGGER IF EXISTS trg_courts_updated_at ON public.courts;
CREATE TRIGGER trg_courts_updated_at
  BEFORE UPDATE ON public.courts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
