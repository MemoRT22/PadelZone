/*
# Crear tablas catalog_categories y catalog_items

## Descripción
Crea el catálogo comercial del club en dos tablas: categorías y artículos
(productos o servicios).

## Tablas nuevas
- `catalog_categories`: id, club_id (FK→clubs), name, key (renta_cancha,
  participacion_reta, clases, bar_cocina, accesorios), sort_order, timestamps
- `catalog_items`: id, club_id (FK→clubs), category_id (FK→catalog_categories),
  name, type (servicio/producto), price_cents (entero MXN), available, timestamps

## Seguridad
- RLS activada en ambas tablas.
- Miembros del club pueden leer.
- Propietario y gerente pueden gestionar categorías y artículos.
- El precio (price_cents) NO puede ser editado por cajero: la policy UPDATE
  de catalog_items para cajero NO incluye price_cents (ver notas).
- Grants: SELECT a authenticated; INSERT, UPDATE a authenticated.

## Notas sobre restricción de precios para cajero
1. En lugar de column-level privileges complejos, la policy RLS de UPDATE
   restringe por rol: sólo propietario y gerente pueden actualizar catalog_items.
   El cajero NO tiene policy UPDATE, por lo que no puede modificar artículos
   en absoluto desde la DB. La UI también oculta la edición de precios para
   cajero, pero la seguridad se aplica en DB.
2. price_cents se guarda en centavos enteros (ej. $100.00 = 10000).
3. available=false es soft-delete.
*/

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL CHECK (
    key IN ('renta_cancha', 'participacion_reta', 'clases', 'bar_cocina', 'accesorios')
  ),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_club_id
  ON public.catalog_categories(club_id);

ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.catalog_categories TO authenticated;

DROP POLICY IF EXISTS "members_can_read_categories" ON public.catalog_categories;
CREATE POLICY "members_can_read_categories"
ON public.catalog_categories FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

-- Sólo propietario y gerente pueden gestionar categorías
-- INSERT
DROP POLICY IF EXISTS "managers_can_insert_categories" ON public.catalog_categories;
CREATE POLICY "managers_can_insert_categories"
ON public.catalog_categories FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

-- UPDATE
DROP POLICY IF EXISTS "managers_can_update_categories" ON public.catalog_categories;
CREATE POLICY "managers_can_update_categories"
ON public.catalog_categories FOR UPDATE
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
)
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

-- ============================================================
-- Tabla: catalog_items
-- ============================================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.catalog_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('servicio', 'producto')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_club_id ON public.catalog_items(club_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id
  ON public.catalog_items(category_id);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Grant SELECT a authenticated; INSERT, UPDATE sólo a propietario y gerente
-- Cajero sólo tiene SELECT
GRANT SELECT ON public.catalog_items TO authenticated;

DROP POLICY IF EXISTS "members_can_read_items" ON public.catalog_items;
CREATE POLICY "members_can_read_items"
ON public.catalog_items FOR SELECT
TO authenticated
USING (club_id = public.user_club_id(auth.uid()));

-- Sólo propietario y gerente pueden INSERT (incluye price_cents)
GRANT INSERT ON public.catalog_items TO authenticated;

DROP POLICY IF EXISTS "managers_can_insert_items" ON public.catalog_items;
CREATE POLICY "managers_can_insert_items"
ON public.catalog_items FOR INSERT
TO authenticated
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

-- Sólo propietario y gerente pueden UPDATE (incluye price_cents)
-- Cajero NO tiene policy UPDATE → no puede modificar artículos en absoluto
GRANT UPDATE ON public.catalog_items TO authenticated;

DROP POLICY IF EXISTS "managers_can_update_items" ON public.catalog_items;
CREATE POLICY "managers_can_update_items"
ON public.catalog_items FOR UPDATE
TO authenticated
USING (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
)
WITH CHECK (
  club_id = public.user_club_id(auth.uid())
  AND public.user_club_role(auth.uid()) IN ('propietario', 'gerente')
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS trg_catalog_categories_updated_at ON public.catalog_categories;
CREATE TRIGGER trg_catalog_categories_updated_at
  BEFORE UPDATE ON public.catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER trg_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
