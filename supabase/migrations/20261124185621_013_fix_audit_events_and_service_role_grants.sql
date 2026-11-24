/*
# Fix audit_events security and edge function compatibility

## 1. Prevent direct audit INSERT from browser

### Problem
The `managers_insert_audit` policy allows any authenticated propietario or
gerente to INSERT into audit_events directly from the browser. This means a
user could fabricate audit entries with arbitrary content.

### Fix
- Drop the INSERT policy from authenticated
- Revoke INSERT from authenticated
- Grant INSERT to service_role only (used by the edge function)
- audit_events remains readable by authenticated members (SELECT)
- The service_role bypasses RLS, so no INSERT policy is needed for it

## 2. Grant service_role on all tables used by edge function

The edge function uses the service_role key, which bypasses RLS but still
needs table-level grants to access tables.

## 3. Ensure security functions are callable by service_role

service_role needs to call security.is_club_member and security.user_club_role
when doing role checks in edge functions.
*/

-- ============================================================
-- Step 1: Remove direct INSERT from authenticated on audit_events
-- ============================================================
DROP POLICY IF EXISTS "managers_insert_audit" ON public.audit_events;

REVOKE INSERT ON public.audit_events FROM authenticated;
GRANT INSERT ON public.audit_events TO service_role;

-- ============================================================
-- Step 2: Grant service_role access to all tables
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.club_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.club_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.players TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.courts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO service_role;
GRANT SELECT, INSERT ON public.audit_events TO service_role;

-- ============================================================
-- Step 3: Grant service_role execute on security functions
-- ============================================================
GRANT EXECUTE ON FUNCTION security.is_club_member(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION security.user_club_role(uuid) TO service_role;
