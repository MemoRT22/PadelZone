/*
# Crear tabla players

## Descripción
Crea la tabla `players` para registrar los jugadores del club. Los jugadores NO
son usuarios del sistema; son personas que pueden reservar canchas, participar
en retas o tomar clases.

## Tablas nuevas
- `players`: id, club_id (FK→clubs), name, phone (opcional), normalized_phone
  (para búsqueda/duplicados), notes (operativas), active, timestamps

## Seguridad
- RLS activada.
- Miembros del club pueden leer jugadores.
- Propietario, gerente y cajero pueden crear/editar.
- Los teléfonos no se exponen en rutas públicas (sólo dentro del panel autenticado).
- Grants: SELECT a authenticated; INSERT, UPDATE a authenticated.

## Validaciones
- Índice único en (club_id, normalized_phone) para detectar duplicados.
- normalized_phone se limpia (sólo dígitos) para comparación.

## Notas
1. phone puede ser NULL (opcional).
2. normalized_phone se calcula desde la app antes de insertar.
3. active=false es soft-delete (no rompe referencias futuras).
*/

CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  normalized_phone text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_club_normalized_phone
  ON public.players(club_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.players TO authenticated;

-- Miembros del club pueden leer jugadores
DROP POLICY IF EXISTS "members_can_read_players" ON public.players;
CREATE POLICY "members_can_read_players"
ON public.players FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

-- Propietario, gerente y cajero pueden crear jugadores
DROP POLICY IF EXISTS "staff_can_insert_players" ON public.players;
CREATE POLICY "staff_can_insert_players"
ON public.players FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero')
);

-- Propietario, gerente y cajero pueden editar jugadores
DROP POLICY IF EXISTS "staff_can_update_players" ON public.players;
CREATE POLICY "staff_can_update_players"
ON public.players FOR UPDATE
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero')
)
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente', 'cajero')
);

DROP TRIGGER IF EXISTS trg_players_updated_at ON public.players;
CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
