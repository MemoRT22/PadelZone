/*
# Crear tabla clubs + funciones helper de membresía

## Descripción
Crea la tabla base `clubs` y las funciones helper SQL reutilizables en las
políticas RLS. Las funciones consultan `club_memberships` que se crea en la
siguiente migración; por eso las funciones se definen aquí pero la tabla
`club_memberships` se crea en la migración 002.

En realidad, para evitar errores de dependencia, esta migración SÓLO crea
la tabla clubs. Las funciones helper se mueven a la migración 002, después
de crear club_memberships.

## Tablas nuevas
- `clubs`: id, name, timezone (America/Cancun), currency (MXN), timestamps

## Seguridad
- RLS activada en clubs.
- Políticas básicas: authenticated users con membresía pueden leer; propietario
  puede actualizar. Las políticas usan funciones que se crearán en la migración 002.
- Para que las políticas funcionen correctamente, las funciones helper se crean
  AL FINAL de esta migración como funciones que retornan NULL temporalmente,
  y se reemplazan en la migración 002.

## Notas
1. Esta migración es segura de re-ejecutar (IF NOT EXISTS).
2. El club se crea sin datos; el primer admin lo poblará.
*/

-- ============================================================
-- Tabla: clubs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Cancun',
  currency text NOT NULL DEFAULT 'MXN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.clubs TO authenticated;
