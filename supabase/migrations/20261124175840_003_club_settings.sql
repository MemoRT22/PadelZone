/*
# Crear tabla club_settings

## Descripción
Crea la tabla `club_settings` para almacenar los datos de contacto y horarios
del club. Es un registro único por club (uno a uno).

## Tablas nuevas
- `club_settings`: id, club_id (FK→clubs), contact_phone, contact_email,
  address, opening_hours, timestamps

## Seguridad
- RLS activada.
- Miembros del club pueden leer settings.
- Sólo propietario puede insertar y actualizar settings.
- Grant SELECT a authenticated; INSERT, UPDATE a authenticated (RLS controla).

## Notas
1. Un índice único en club_id garantiza un solo registro por club.
*/

CREATE TABLE IF NOT EXISTS public.club_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  contact_phone text,
  contact_email text,
  address text,
  opening_hours text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_club_settings_club_id
  ON public.club_settings(club_id);

ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.club_settings TO authenticated;

DROP POLICY IF EXISTS "members_can_read_settings" ON public.club_settings;
CREATE POLICY "members_can_read_settings"
ON public.club_settings FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

DROP POLICY IF EXISTS "propietario_can_update_settings" ON public.club_settings;
CREATE POLICY "propietario_can_update_settings"
ON public.club_settings FOR UPDATE
TO authenticated
USING (club_id = public.user_club_id(auth.uid()) AND public.user_club_role(auth.uid()) = 'propietario')
WITH CHECK (club_id = public.user_club_id(auth.uid()) AND public.user_club_role(auth.uid()) = 'propietario');

DROP POLICY IF EXISTS "propietario_can_insert_settings" ON public.club_settings;
CREATE POLICY "propietario_can_insert_settings"
ON public.club_settings FOR INSERT
TO authenticated
WITH CHECK (club_id = public.user_club_id(auth.uid()) AND public.user_club_role(auth.uid()) = 'propietario');

DROP TRIGGER IF EXISTS trg_club_settings_updated_at ON public.club_settings;
CREATE TRIGGER trg_club_settings_updated_at
  BEFORE UPDATE ON public.club_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
