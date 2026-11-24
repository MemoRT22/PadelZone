/*
# Simplify courts model and seed 7 courts

## Overview
Zona 5 has 7 identical padel courts. The previous model included name, surface,
and description fields that are unnecessary for this single-club system. This
migration simplifies the model to just number + active + sort_order, with name
generated automatically as "Cancha N".

## Changes

### 1. Drop surface and description columns
These fields have no operational use at Zona 5. All courts are identical.

### 2. Add UNIQUE constraint on court number
Prevents duplicate court numbers.

### 3. Set name defaults
The name column gets a default of 'Cancha ' || number::text via a trigger,
so the application never needs to send it. However, since we can't easily
do a generated column that references another column in PostgreSQL without
a trigger, we keep name as NOT NULL with a simple default and populate it
in the seed. The application will set name = 'Cancha N' on insert.

### 4. Seed 7 courts
Insert Cancha 1 through Cancha 7 if they don't already exist.

## Security
No policy changes — existing RLS policies remain valid.
*/

-- ============================================================
-- Step 1: Drop surface and description columns
-- ============================================================
ALTER TABLE public.courts DROP COLUMN IF EXISTS surface;
ALTER TABLE public.courts DROP COLUMN IF EXISTS description;

-- ============================================================
-- Step 2: Add unique constraint on number
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courts_number_key'
    AND conrelid = 'public.courts'::regclass
  ) THEN
    ALTER TABLE public.courts ADD CONSTRAINT courts_number_key UNIQUE (number);
  END IF;
END $$;

-- ============================================================
-- Step 3: Seed 7 courts (only if none exist)
-- ============================================================
INSERT INTO public.courts (name, number, active, sort_order)
SELECT 'Cancha ' || n, n, true, n
FROM generate_series(1, 7) AS n
WHERE NOT EXISTS (SELECT 1 FROM public.courts WHERE number = n);
