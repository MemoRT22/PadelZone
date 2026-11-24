/*
# Seed: categorías de catálogo por defecto

## Descripción
Crea un club inicial y las 5 categorías de catálogo predefinidas.
Este seed crea un club "Club de Pádel Demo" que el primer propietario
podrá renombrar desde la pantalla de configuración.

## Importante
Este seed es para fines de inicialización. En producción, el primer admin
creará el club manualmente o mediante el proceso documentado.

## Categorías
1. Renta de cancha
2. Participación en reta
3. Clases
4. Bar y cocina
5. Accesorios
*/

-- Crear club inicial si no existe
INSERT INTO public.clubs (name, timezone, currency)
SELECT 'Club de Pádel', 'America/Cancun', 'MXN'
WHERE NOT EXISTS (SELECT 1 FROM public.clubs);

-- Insertar categorías por defecto para el club existente
-- Usar DO block para evitar duplicados en re-run
DO $$
DECLARE
  club_record RECORD;
BEGIN
  SELECT id INTO club_record FROM public.clubs LIMIT 1;
  IF club_record.id IS NULL THEN
    RETURN;
  END IF;

  -- Insertar cada categoría si no existe para este club
  INSERT INTO public.catalog_categories (club_id, name, key, sort_order)
  SELECT club_record.id, 'Renta de cancha', 'renta_cancha', 1
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_categories
    WHERE club_id = club_record.id AND key = 'renta_cancha'
  );

  INSERT INTO public.catalog_categories (club_id, name, key, sort_order)
  SELECT club_record.id, 'Participación en reta', 'participacion_reta', 2
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_categories
    WHERE club_id = club_record.id AND key = 'participacion_reta'
  );

  INSERT INTO public.catalog_categories (club_id, name, key, sort_order)
  SELECT club_record.id, 'Clases', 'clases', 3
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_categories
    WHERE club_id = club_record.id AND key = 'clases'
  );

  INSERT INTO public.catalog_categories (club_id, name, key, sort_order)
  SELECT club_record.id, 'Bar y cocina', 'bar_cocina', 4
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_categories
    WHERE club_id = club_record.id AND key = 'bar_cocina'
  );

  INSERT INTO public.catalog_categories (club_id, name, key, sort_order)
  SELECT club_record.id, 'Accesorios', 'accesorios', 5
  WHERE NOT EXISTS (
    SELECT 1 FROM public.catalog_categories
    WHERE club_id = club_record.id AND key = 'accesorios'
  );
END $$;
