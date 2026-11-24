/*
# Actualizar seed: Zona 5 Padel Club

## Descripción
Actualiza el club existente con el nombre real "Zona 5 Padel Club" y
los datos de contacto reales extraídos del sitio zona5padel.club.

## Datos
- Nombre: Zona 5 Padel Club
- Teléfono: 998 2272 313
- Email: hola@zona5padel.club
- Dirección: Calle Quintana Roo #1, 77560 Alfredo V. Bonfil, Q.R.
- Zona horaria: America/Cancun (ya fijada)
*/

UPDATE public.clubs
SET name = 'Zona 5 Padel Club'
WHERE id = (SELECT id FROM public.clubs LIMIT 1);

-- Insertar o actualizar club_settings con los datos reales
INSERT INTO public.club_settings (club_id, contact_phone, contact_email, address, opening_hours)
SELECT id, '9982272313', 'hola@zona5padel.club', 'Calle Quintana Roo #1, 77560 Alfredo V. Bonnil, Q.R', 'Lun-Vie 7:00-23:00, Sáb-Dom 8:00-22:00'
FROM public.clubs
WHERE id = (SELECT id FROM public.clubs LIMIT 1)
ON CONFLICT (club_id) DO UPDATE SET
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  address = EXCLUDED.address,
  opening_hours = EXCLUDED.opening_hours;
