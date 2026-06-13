# Guía de Desarrollo Local con Supabase CLI

Esta guía explica cómo utilizar **Supabase CLI** en este proyecto para gestionar la base de datos localmente, realizar pruebas offline y administrar las migraciones del esquema.

## Requisitos Previos

1. **Docker Desktop**: Debes tener Docker instalado y ejecutándose en tu equipo.
   * [Descargar Docker](https://www.docker.com/products/docker-desktop/)

---

## 1. Configuración Inicial (Una sola vez)

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Inicializar Supabase localmente:**
   ```bash
   pnpm run supabase:init
   ```
   *Esto creará la carpeta `./supabase/` en la raíz del proyecto.*

3. **Vincular con el proyecto en la nube:**
   ```bash
   pnpm run supabase:link
   ```
   * Te solicitará la contraseña de la base de datos de tu proyecto remoto (`dcsmijbstwndaorigqyb`).
   * Al finalizar, el archivo `./supabase/config.toml` se actualizará con la referencia del proyecto.

---

## 2. Flujo de Trabajo en Desarrollo

### Arrancar la base de datos local
Para iniciar los contenedores locales de PostgreSQL, Auth, Realtime, etc.:
```bash
pnpm run supabase:start
```
* Una vez que termine, mostrará en consola las URLs locales y claves (anon, service_role).
* Puedes copiar la `anon key` y la `API URL` local (`http://127.0.0.1:54321`) a tu archivo `.env`.

### Ver estado
Para ver los puertos y las credenciales activas del entorno local:
```bash
pnpm run supabase:status
```

### Detener la base de datos local
Para pausar los contenedores locales y liberar recursos en tu PC:
```bash
pnpm run supabase:stop
```

---

## 3. Gestión de Esquemas y Migraciones

### Obtener el esquema actual de producción (DB Pull)
Para sincronizar tu entorno local con las tablas reales que ya existen en producción (incluyendo las tablas de `reports`, `personnel`, etc.), ejecuta:
```bash
pnpm run supabase:pull
```
* Esto creará un archivo SQL en `./supabase/migrations/<timestamp>_init.sql` que representa la base de datos de producción tal y como está hoy.
* La próxima vez que ejecutes `pnpm run supabase:start`, tu base de datos local se inicializará automáticamente con todas las tablas correctas y RLS.

### Crear una nueva migración
Si deseas añadir una nueva tabla o columna (por ejemplo, agregar una columna a una tabla existente):
1. Crea un archivo de migración en blanco:
   ```bash
   npx supabase migration new add_my_new_column
   ```
2. Abre el archivo generado en `./supabase/migrations/` y escribe el SQL correspondiente:
   ```sql
   ALTER TABLE public.personnel ADD COLUMN active_since date;
   ```
3. Aplica los cambios a tu base de datos local:
   ```bash
   npx supabase db reset
   ```
   *Esto reiniciará los contenedores locales y aplicará todas las migraciones en orden cronológico.*

### Subir migraciones locales a producción
Cuando estés listo para aplicar tus cambios locales en producción:
```bash
npx supabase db push
```
