/*
# Move btree_gist extension to extensions schema

Moves the btree_gist extension out of the public schema to address
the security advisor warning about extensions in public schema.
The exclusion constraint on court_bookings depends on it, so we
drop the constraint, move the extension, and recreate it.
*/

CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the constraint that depends on btree_gist
ALTER TABLE court_bookings DROP CONSTRAINT IF EXISTS court_bookings_no_overlap;

-- Drop and recreate extension in extensions schema
DROP EXTENSION IF EXISTS btree_gist CASCADE;
CREATE EXTENSION btree_gist SCHEMA extensions;

-- Recreate the exclusion constraint
ALTER TABLE court_bookings
  ADD CONSTRAINT court_bookings_no_overlap
  EXCLUDE USING GIST (
    court_id WITH =,
    time_range WITH &&
  )
  WHERE (status = 'activa');
