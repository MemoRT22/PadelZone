/*
# Convert multi-tenant schema to single-club model

## Overview
Removes all club_id columns and the clubs table. This system manages a single
padel club, not a multi-tenant SaaS. All data belongs to one club.

## Changes

### 1. Drop all existing RLS policies
All current policies reference `club_id = user_club_id(auth.uid())` which will
no longer exist. They are dropped and recreated without club_id filtering.

### 2. Drop foreign key constraints referencing clubs
Removes FK constraints from club_settings, club_memberships, and any other
table that references the clubs table.

### 3. Add `name` column to club_settings
The club name previously lived in the `clubs` table. Since `clubs` is being
dropped, `club_settings` now holds the club name directly.

### 4. Drop club_id columns
Removed from: club_memberships, club_settings, players, courts,
catalog_categories, catalog_items, audit_events.

### 5. Drop clubs table
No longer needed in a single-club system.

### 6. Drop user_club_id() function
This function returned the club_id for a user, which is no longer needed.

### 7. Recreate RLS policies
New policies use `is_club_member(auth.uid())` for membership checks and
`user_club_role(auth.uid())` for role-based restrictions. No club_id filtering.

### 8. Fix grants
- audit_events: remove UPDATE/DELETE (it is append-only, SELECT + INSERT only)
- All other tables: grant only the verbs each role needs

## Security
- RLS remains enabled on all tables
- Membership checked via is_club_member(auth.uid())
- Role restrictions preserved per table
- audit_events is strictly append-only
*/

-- ============================================================
-- Step 1: Drop all existing RLS policies
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- Step 2: Drop foreign key constraints referencing clubs
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'f'
    AND confrelid = 'public.clubs'::regclass
  )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.table_name, r.conname);
  END LOOP;
END $$;

-- ============================================================
-- Step 3: Add name column to club_settings
-- ============================================================
ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Zona 5 Padel Club';

-- ============================================================
-- Step 4: Drop club_id columns from all tables
-- ============================================================
ALTER TABLE public.club_memberships DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.club_settings DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.players DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.courts DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.catalog_categories DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS club_id;
ALTER TABLE public.audit_events DROP COLUMN IF EXISTS club_id;

-- ============================================================
-- Step 5: Drop clubs table
-- ============================================================
DROP TABLE IF EXISTS public.clubs;

-- ============================================================
-- Step 6: Drop user_club_id function (no longer needed)
-- ============================================================
DROP FUNCTION IF EXISTS public.user_club_id(uuid);

-- ============================================================
-- Step 7: Recreate RLS policies (no club_id)
-- ============================================================

-- --- club_memberships (staff) ---
DROP POLICY IF EXISTS "members_read_memberships" ON public.club_memberships;
CREATE POLICY "members_read_memberships"
ON public.club_memberships FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "owners_insert_memberships" ON public.club_memberships;
CREATE POLICY "owners_insert_memberships"
ON public.club_memberships FOR INSERT
TO authenticated
WITH CHECK (public.user_club_role(auth.uid()) = 'propietario');

DROP POLICY IF EXISTS "owners_update_memberships" ON public.club_memberships;
CREATE POLICY "owners_update_memberships"
ON public.club_memberships FOR UPDATE
TO authenticated
USING (public.user_club_role(auth.uid()) = 'propietario')
WITH CHECK (public.user_club_role(auth.uid()) = 'propietario');

-- --- club_settings (single row) ---
DROP POLICY IF EXISTS "members_read_settings" ON public.club_settings;
CREATE POLICY "members_read_settings"
ON public.club_settings FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "managers_update_settings" ON public.club_settings;
CREATE POLICY "managers_update_settings"
ON public.club_settings FOR UPDATE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

DROP POLICY IF EXISTS "managers_insert_settings" ON public.club_settings;
CREATE POLICY "managers_insert_settings"
ON public.club_settings FOR INSERT
TO authenticated
WITH CHECK (public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- --- players ---
DROP POLICY IF EXISTS "members_read_players" ON public.players;
CREATE POLICY "members_read_players"
ON public.players FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "staff_insert_players" ON public.players;
CREATE POLICY "staff_insert_players"
ON public.players FOR INSERT
TO authenticated
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']));

DROP POLICY IF EXISTS "staff_update_players" ON public.players;
CREATE POLICY "staff_update_players"
ON public.players FOR UPDATE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']))
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']));

-- --- courts ---
DROP POLICY IF EXISTS "members_read_courts" ON public.courts;
CREATE POLICY "members_read_courts"
ON public.courts FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "managers_insert_courts" ON public.courts;
CREATE POLICY "managers_insert_courts"
ON public.courts FOR INSERT
TO authenticated
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

DROP POLICY IF EXISTS "managers_update_courts" ON public.courts;
CREATE POLICY "managers_update_courts"
ON public.courts FOR UPDATE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- --- catalog_categories ---
DROP POLICY IF EXISTS "members_read_categories" ON public.catalog_categories;
CREATE POLICY "members_read_categories"
ON public.catalog_categories FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "managers_insert_categories" ON public.catalog_categories;
CREATE POLICY "managers_insert_categories"
ON public.catalog_categories FOR INSERT
TO authenticated
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

DROP POLICY IF EXISTS "managers_update_categories" ON public.catalog_categories;
CREATE POLICY "managers_update_categories"
ON public.catalog_categories FOR UPDATE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

DROP POLICY IF EXISTS "managers_delete_categories" ON public.catalog_categories;
CREATE POLICY "managers_delete_categories"
ON public.catalog_categories FOR DELETE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- --- catalog_items ---
DROP POLICY IF EXISTS "members_read_items" ON public.catalog_items;
CREATE POLICY "members_read_items"
ON public.catalog_items FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "managers_insert_items" ON public.catalog_items;
CREATE POLICY "managers_insert_items"
ON public.catalog_items FOR INSERT
TO authenticated
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

DROP POLICY IF EXISTS "staff_update_items" ON public.catalog_items;
CREATE POLICY "staff_update_items"
ON public.catalog_items FOR UPDATE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']))
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']));

DROP POLICY IF EXISTS "managers_delete_items" ON public.catalog_items;
CREATE POLICY "managers_delete_items"
ON public.catalog_items FOR DELETE
TO authenticated
USING (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- --- audit_events (append-only: SELECT + INSERT only) ---
DROP POLICY IF EXISTS "members_read_audit" ON public.audit_events;
CREATE POLICY "members_read_audit"
ON public.audit_events FOR SELECT
TO authenticated
USING (public.is_club_member(auth.uid()));

DROP POLICY IF EXISTS "managers_insert_audit" ON public.audit_events;
CREATE POLICY "managers_insert_audit"
ON public.audit_events FOR INSERT
TO authenticated
WITH CHECK (public.is_club_member(auth.uid()) AND public.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- ============================================================
-- Step 8: Fix grants
-- ============================================================

-- Revoke all existing grants first
REVOKE ALL ON public.club_memberships FROM anon, authenticated;
REVOKE ALL ON public.club_settings FROM anon, authenticated;
REVOKE ALL ON public.players FROM anon, authenticated;
REVOKE ALL ON public.courts FROM anon, authenticated;
REVOKE ALL ON public.catalog_categories FROM anon, authenticated;
REVOKE ALL ON public.catalog_items FROM anon, authenticated;
REVOKE ALL ON public.audit_events FROM anon, authenticated;

-- Grant only what each table needs (app requires sign-in, so authenticated only)
GRANT SELECT, INSERT, UPDATE ON public.club_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.players TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.courts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
-- audit_events is append-only: no UPDATE or DELETE
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
