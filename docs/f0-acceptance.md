# F0 — Criterios de aceptación

## Checklist de aceptación

### A. Inicio de sesión y seguridad
- [x] Pantalla de login con correo y contraseña
- [x] Cierre de sesión funcional
- [x] Rutas protegidas verifican sesión + membresía (no sólo ocultan menús)
- [x] Pantalla "Sin acceso" para usuarios sin membresía
- [x] Auto-registro público deshabilitado (sólo propietario crea personal)
- [ ] **Paso manual**: Crear primer usuario propietario (ver abajo)

### B. Layout administrativo
- [x] Navegación lateral (escritorio) y superior/inferior (móvil)
- [x] Diseño responsive para teléfono, tableta y escritorio
- [x] Estados de carga, error y vacío auténticos
- [x] Alertas (toasts) y confirmaciones
- [x] Módulos futuros visibles como "Próximamente"
- [x] Etiquetas en español de México
- [x] Paleta inspirada en canchas de pádel (verde, neutros)

### C. Jugadores
- [x] Crear, consultar, buscar y editar
- [x] Campos: nombre, teléfono opcional, notas
- [x] Validación de teléfono MX (10 dígitos)
- [x] Detección de duplicados por teléfono normalizado
- [x] Activar/desactivar (soft-delete)
- [x] Teléfono no expuesto en rutas públicas

### D. Canchas
- [x] Listar, crear, editar nombre/número
- [x] Superficie y descripción opcionales
- [x] Estado activo/inactivo
- [x] Orden de visualización (subir/bajar)
- [x] Sin agenda ni reservas

### E. Catálogo
- [x] 5 categorías predefinidas sembradas
- [x] Productos/servicios con nombre, tipo, precio (centavos en DB)
- [x] Disponible/inactivo
- [x] Sin ventas, stock, recetas ni compras

### F. Configuración
- [x] Nombre del club editable
- [x] Zona horaria fijada en America/Cancun
- [x] Moneda fijada en MXN
- [x] Datos de contacto y horarios editables

### G. Personal y roles
- [x] 6 roles previstos (propietario, gerente, cajero, cocina, entrenador, organizador)
- [x] Propietario administra personal y asigna roles
- [x] Gerente gestiona canchas/jugadores/catálogo
- [x] Cajero gestiona jugadores pero NO precios
- [x] No autoelevación de privilegios (RLS)
- [x] Propietario no puede desactivarse a sí mismo

### H. Base de datos
- [x] 8 migraciones aplicadas (clubs, memberships, settings, players, courts, catalog, audit, seed)
- [x] RLS en todas las tablas
- [x] Grants explícitos (anon sin acceso, authenticated con verbs específicos)
- [x] Funciones helper con search_path fijado
- [x] Auditoría append-only
- [x] club_id en todas las tablas operativas
- [x] UUID, FK, NOT NULL, CHECK constraints, índices

### I. Validación
- [x] `npm run typecheck` — PASS (0 errores)
- [x] `npm run build` — PASS (build exitoso)
- [x] `npm run lint` — PASS (0 errores, 0 warnings)
- [x] `npm run test` — PASS (27 pruebas, 2 suites)
- [x] `get_advisors` (security) — 0 findings
- [ ] Playwright E2E — configurado, requiere servidor en ejecución

### J. Seguridad verificada
- [x] Usuario sin membresía no puede leer datos del club
- [x] Cajero no puede editar precios (RLS niega UPDATE en catalog_items)
- [x] No hay secretos privilegiados en repositorio
- [x] service_role nunca se importa en frontend

## Pasos manuales pendientes

### 1. Crear el primer usuario propietario

La app no permite auto-registro público. Para crear el primer admin:

**Opción A — Supabase Dashboard (recomendada):**
1. Ve a tu proyecto en Supabase → Authentication → User Management
2. Click "Add User" → "Create new user"
3. Captura correo y contraseña del propietario
4. Ve a la sección SQL Editor y ejecuta:

```sql
-- Obtener el ID del usuario recién creado
SELECT id, email FROM auth.users WHERE email = 'correo@ejemplo.com';

-- Insertar el club y la membresía del propietario
INSERT INTO public.clubs (name) VALUES ('Mi Club de Pádel')
ON CONFLICT DO NOTHING;

INSERT INTO public.club_memberships (club_id, user_id, role, display_name)
SELECT c.id, u.id, 'propietario', 'Nombre del Propietario'
FROM public.clubs c, auth.users u
WHERE u.email = 'correo@ejemplo.com'
AND c.id = (SELECT id FROM public.clubs LIMIT 1);
```

**Opción B — Desde la app:**
1. Activa temporalmente "Allow new users to sign up" en Supabase Auth
2. Usa la pantalla de personal para crear el primer usuario
3. Luego ejecuta el SQL anterior para asignar rol de propietario
4. Desactiva el auto-registro público de nuevo

### 2. Variables de entorno

Las variables ya están configuradas en `.env`:
- `VITE_SUPABASE_URL` — URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` — Clave publicable (anon)

No se requieren variables adicionales para F0.

### 3. GitHub

1. Crea un repositorio en GitHub
2. Inicializa git: `git init && git add . && git commit -m "F0: Fundamentos"`
3. Conecta el remoto: `git remote add origin <url>`
4. Push: `git push -u origin main`

### 4. Despliegue en Netlify

1. Conecta tu repositorio de GitHub en Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` deben
   configurarse en Site Settings → Environment Variables

## Resultado de pruebas

| Prueba | Resultado |
|--------|-----------|
| typecheck (tsc --noEmit) | PASS |
| build (vite build) | PASS |
| lint (eslint) | PASS |
| test (vitest) | PASS — 27/27 |
| security advisors | PASS — 0 findings |
| Playwright E2E | Configurado, requiere servidor en ejecución |

## Lo que NO se hizo en F0

- Agenda, reservas, bloques horarios
- Caja, cobros, cortes, pagos mixtos
- Retas, inscripciones, listas de espera
- Patodólares (emisión/redención)
- Comisiones y liquidaciones
- Comandas, clases, inventario
- Integraciones WhatsApp, Clip
- Funcionalidad multi-club (sólo estructura)
- Auditoría automática en cambios de precio (tabla lista, trigger pendiente)
- Pruebas E2E completas (setup listo, falta servidor para ejecutar)
