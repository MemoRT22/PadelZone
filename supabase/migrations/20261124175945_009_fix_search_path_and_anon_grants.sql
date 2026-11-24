/*
# Fix: search_path en funciones + revocar grants excesivos de anon

## Descripción
1. Fija search_path en todas las funciones helper para evitar WARN del advisor.
2. Revoca todos los grants del rol anon en todas las tablas F0.
   Las policies sólo permiten authenticated, pero el rol anon tenía grants
   heredados que podían permitir acceso no deseado.
3. Re-grant explícito sólo a authenticated con los verbs necesarios.

## Seguridad
- anon no tiene ningún grant en tablas F0.
- authenticated tiene SELECT en todas + INSERT/UPDATE donde corresponde.
- search_path fijado a 'public' en todas las funciones.
*/

-- ============================================================
-- Fix search_path en funciones helper
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_club_member(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
AS $$
  SELECT club_id FROM public.club_memberships
    WHERE user_id = check_uid AND active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Revocar grants de anon en TODAS las tablas F0
-- ============================================================

REVOKE ALL ON public.clubs FROM anon;
REVOKE ALL ON public.club_settings FROM anon;
REVOKE ALL ON public.club_memberships FROM anon;
REVOKE ALL ON public.players FROM anon;
REVOKE ALL ON public.courts FROM anon;
REVOKE ALL ON public.catalog_categories FROM anon;
REVOKE ALL ON public.catalog_items FROM anon;
REVOKE ALL ON public.audit_events FROM anon;

-- Re-grant explícito a authenticated
-- clubs: SELECT + UPDATE (propietario)
GRANT SELECT ON public.clubs TO authenticated;
GRANT UPDATE ON public.clubs TO authenticated;

-- club_settings: SELECT + INSERT + UPDATE (propietario)
GRANT SELECT ON public.club_settings TO authenticated;
GRANT INSERT ON public.club_settings TO authenticated;
GRANT UPDATE ON public.club_settings TO authenticated;

-- club_memberships: SELECT + INSERT + UPDATE
GRANT SELECT, INSERT, UPDATE ON public.club_memberships TO authenticated;

-- players: SELECT + INSERT + UPDATE
GRANT SELECT, INSERT, UPDATE ON public.players TO authenticated;

-- courts: SELECT + INSERT + UPDATE
GRANT SELECT, INSERT, UPDATE ON public.courts TO authenticated;

-- catalog_categories: SELECT + INSERT + UPDATE
GRANT SELECT, INSERT, UPDATE ON public.catalog_categories TO authenticated;

-- catalog_items: SELECT + INSERT + UPDATE
GRANT SELECT, INSERT, UPDATE ON public.catalog_items TO authenticated;

-- audit_events: SELECT + INSERT (append-only, no UPDATE/DELETE)
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
