/*
# Crear tabla audit_events

## Descripción
Crea la tabla `audit_events` para registrar cambios sensibles (precios, roles)
de forma no destructiva. Cada evento captura quién hizo el cambio, qué entidad
se modificó, la acción realizada, y los valores antes/después en JSONB.

## Tablas nuevas
- `audit_events`: id, club_id (FK→clubs), actor_id, entity_type, entity_id,
  action, before (JSONB), after (JSONB), created_at

## Seguridad
- RLS activada.
- Miembros del club pueden leer eventos de auditoría.
- INSERT: sólo propietario y gerente (la app inserta al cambiar precios/roles).
- NO hay UPDATE ni DELETE: el historial es inmutable.
- Grants: SELECT a authenticated; INSERT a authenticated.

## Notas
1. Esta tabla es append-only: no se actualizan ni borran registros.
2. actor_id puede ser NULL si el cambio fue del sistema.
3. before/after guardan snapshots JSON de la fila afectada.
*/

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_club_id
  ON public.audit_events(club_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity
  ON public.audit_events(entity_type, entity_id);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.audit_events TO authenticated;

DROP POLICY IF EXISTS "members_can_read_audit" ON public.audit_events;
CREATE POLICY "members_can_read_audit"
ON public.audit_events FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

-- Sólo propietario y gerente pueden insertar eventos de auditoría
GRANT INSERT ON public.audit_events TO authenticated;

DROP POLICY IF EXISTS "managers_can_insert_audit" ON public.audit_events;
CREATE POLICY "managers_can_insert_audit"
ON public.audit_events FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

-- No hay policy UPDATE ni DELETE: el historial es inmutable
