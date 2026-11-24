/*
# Bootstrap del primer propietario — Zona 5 Padel Club

## Propósito
Asignar el primer propietario del sistema de forma segura y controlada.

## Cuándo usar
Únicamente al inicializar el sistema en un entorno nuevo, antes de que
exista cualquier miembro del personal activo.

## Pasos

### 1. Crear el usuario en Supabase Auth
Desde el panel de Supabase (Dashboard > Authentication > Users > Add user):
- Email: correo real del propietario (ej. propietario@zona5padel.club)
- Password: contraseña temporal segura (mínimo 8 caracteres)
- Auto Confirm: Sí (marcar "Confirm user")

### 2. Obtener el UUID del usuario
En Dashboard > Authentication > Users, copiar el UID del usuario recién creado.

### 3. Insertar la membresía con rol propietario
Ejecutar en Dashboard > SQL Editor:

```sql
INSERT INTO public.club_memberships (user_id, role, display_name, active)
VALUES (
  'PEGAR-AQUI-EL-UUID',
  'propietario',
  'Nombre del Propietario',
  true
);
```

### 4. Insertar el registro de configuración del club
Ejecutar en el mismo SQL Editor. La restricción de unicidad permite un solo
registro — usar `ON CONFLICT` para evitar errores si ya existe:

```sql
INSERT INTO public.club_settings (name, contact_phone, contact_email, address, opening_hours)
VALUES (
  'Zona 5 Padel Club',
  NULL, NULL, NULL, NULL
)
ON CONFLICT (singleton_guard) DO NOTHING;
```

### 5. Verificar
Iniciar sesión con el correo y contraseña del paso 1.
El sistema debe mostrar el panel principal con acceso completo.

## Restricciones
- Este procedimiento NO se puede repetir para crear más propietarios.
  Una vez que existe un propietario activo, los nuevos miembros del personal
  se crean desde la pantalla de Personal dentro del sistema.
- No usar supabase.auth.signUp() desde el navegador para crear el primer
  propietario — no asigna el rol y deja una cuenta sin membresía.
- No escribir credenciales en el repositorio.
*/
