/*
# Fix RLS recursion, catalog permissions, and single-settings constraint

## Overview
This migration addresses three critical security issues from the F0.1 audit:
1. RLS recursion in is_club_member/user_club_role
2. Cajero can update catalog prices via direct API calls
3. No uniqueness constraint on club_settings

## 1. Fix RLS recursion

### Problem
is_club_member(uid) and user_club_role(uid) are SECURITY INVOKER functions
that query club_memberships. The SELECT policy on club_memberships calls
is_club_member(auth.uid()), creating a circular dependency.

### Fix
Move both functions to a new security schema and make them SECURITY DEFINER.
They bypass RLS on club_memberships, breaking the cycle.

## 2. Fix catalog permissions

### Problem
staff_update_items policy allows cajero to UPDATE catalog_items including
price_cents via direct API calls.

### Fix
Replace with managers_update_items restricting UPDATE to propietario/gerente.

## 3. Single club_settings row

### Fix
Add a sentinel column with CHECK(=1) and UNIQUE index guaranteeing at most
one row can ever exist.
*/

-- ============================================================
-- Step 1: Create security schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS security;

-- ============================================================
-- Step 2: Create SECURITY DEFINER functions in security schema FIRST
-- ============================================================
CREATE OR REPLACE FUNCTION security.is_club_member(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'security', 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE user_id = check_uid
    AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION security.user_club_role(check_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'security', 'public'
AS $$
  SELECT role::text FROM public.club_memberships
  WHERE user_id = check_uid AND active = true
  LIMIT 1;
$$;

ALTER FUNCTION security.is_club_member(uuid) OWNER TO postgres;
ALTER FUNCTION security.user_club_role(uuid) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION security.is_club_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION security.user_club_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION security.is_club_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION security.user_club_role(uuid) TO authenticated;

-- ============================================================
-- Step 3: Drop ALL policies that reference old public functions
-- Must do this BEFORE dropping the old functions
-- ============================================================

-- club_memberships
DROP POLICY IF EXISTS "members_read_memberships" ON public.club_memberships;
DROP POLICY IF EXISTS "owners_insert_memberships" ON public.club_memberships;
DROP POLICY IF EXISTS "owners_update_memberships" ON public.club_memberships;

-- club_settings
DROP POLICY IF EXISTS "members_read_settings" ON public.club_settings;
DROP POLICY IF EXISTS "managers_update_settings" ON public.club_settings;
DROP POLICY IF EXISTS "managers_insert_settings" ON public.club_settings;

-- players
DROP POLICY IF EXISTS "members_read_players" ON public.players;
DROP POLICY IF EXISTS "staff_insert_players" ON public.players;
DROP POLICY IF EXISTS "staff_update_players" ON public.players;

-- courts
DROP POLICY IF EXISTS "members_read_courts" ON public.courts;
DROP POLICY IF EXISTS "managers_insert_courts" ON public.courts;
DROP POLICY IF EXISTS "managers_update_courts" ON public.courts;

-- catalog_categories
DROP POLICY IF EXISTS "members_read_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "managers_insert_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "managers_update_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "managers_delete_categories" ON public.catalog_categories;

-- catalog_items
DROP POLICY IF EXISTS "members_read_items" ON public.catalog_items;
DROP POLICY IF EXISTS "managers_insert_items" ON public.catalog_items;
DROP POLICY IF EXISTS "staff_update_items" ON public.catalog_items;
DROP POLICY IF EXISTS "managers_delete_items" ON public.catalog_items;

-- audit_events
DROP POLICY IF EXISTS "members_read_audit" ON public.audit_events;
DROP POLICY IF EXISTS "managers_insert_audit" ON public.audit_events;

-- ============================================================
-- Step 4: Now drop old public functions
-- ============================================================
DROP FUNCTION IF EXISTS public.is_club_member(uuid);
DROP FUNCTION IF EXISTS public.user_club_role(uuid);

-- ============================================================
-- Step 5: Recreate all policies using security.* functions
-- ============================================================

-- club_memberships
CREATE POLICY "members_read_memberships"
ON public.club_memberships FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "owners_insert_memberships"
ON public.club_memberships FOR INSERT
TO authenticated
WITH CHECK (security.user_club_role(auth.uid()) = 'propietario');

CREATE POLICY "owners_update_memberships"
ON public.club_memberships FOR UPDATE
TO authenticated
USING (security.user_club_role(auth.uid()) = 'propietario')
WITH CHECK (security.user_club_role(auth.uid()) = 'propietario');

-- club_settings
CREATE POLICY "members_read_settings"
ON public.club_settings FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "managers_update_settings"
ON public.club_settings FOR UPDATE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_insert_settings"
ON public.club_settings FOR INSERT
TO authenticated
WITH CHECK (security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- players
CREATE POLICY "members_read_players"
ON public.players FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "staff_insert_players"
ON public.players FOR INSERT
TO authenticated
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']));

CREATE POLICY "staff_update_players"
ON public.players FOR UPDATE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']))
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente', 'cajero']));

-- courts
CREATE POLICY "members_read_courts"
ON public.courts FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "managers_insert_courts"
ON public.courts FOR INSERT
TO authenticated
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_update_courts"
ON public.courts FOR UPDATE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- catalog_categories
CREATE POLICY "members_read_categories"
ON public.catalog_categories FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "managers_insert_categories"
ON public.catalog_categories FOR INSERT
TO authenticated
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_update_categories"
ON public.catalog_categories FOR UPDATE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_delete_categories"
ON public.catalog_categories FOR DELETE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- catalog_items — CRITICAL FIX: cajero removed from UPDATE
CREATE POLICY "members_read_items"
ON public.catalog_items FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "managers_insert_items"
ON public.catalog_items FOR INSERT
TO authenticated
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_update_items"
ON public.catalog_items FOR UPDATE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']))
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

CREATE POLICY "managers_delete_items"
ON public.catalog_items FOR DELETE
TO authenticated
USING (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- audit_events
CREATE POLICY "members_read_audit"
ON public.audit_events FOR SELECT
TO authenticated
USING (security.is_club_member(auth.uid()));

CREATE POLICY "managers_insert_audit"
ON public.audit_events FOR INSERT
TO authenticated
WITH CHECK (security.is_club_member(auth.uid()) AND security.user_club_role(auth.uid()) = ANY (ARRAY['propietario', 'gerente']));

-- ============================================================
-- Step 6: Fix catalog_items grants — column-restricted UPDATE
-- ============================================================
REVOKE UPDATE ON public.catalog_items FROM authenticated;
GRANT UPDATE (name, type, price_cents, available, category_id) ON public.catalog_items TO authenticated;

-- ============================================================
-- Step 7: Enforce single row on club_settings
-- ============================================================
ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS singleton_guard integer NOT NULL DEFAULT 1
  CHECK (singleton_guard = 1);

CREATE UNIQUE INDEX IF NOT EXISTS club_settings_singleton_idx
  ON public.club_settings (singleton_guard);

-- ============================================================
-- Step 8: Grant USAGE on security schema to authenticated
-- ============================================================
GRANT USAGE ON SCHEMA security TO authenticated;
