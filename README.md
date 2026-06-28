# Minutas - Generador de Reportes de Protección Civil Local-First

Una aplicación web moderna construida con **Vite 7**, **React 19** y **Tailwind CSS** para la generación dinámica de reportes de incidentes, novedades y minutas para cuerpos de Protección Civil (paramédicos, rescatistas, bomberos) y administradores de guardia.

## 🚀 Características Principales

-   **Sistema de Plantillas Dinámicas**: Crea formularios complejos definiendo simples archivos de texto con campos de fecha, hora, dropdowns y lógica condicional.
-   **Persistencia Local-First**: Todos los datos se guardan de forma local en el navegador usando RxDB y almacenamiento reactivo, permitiendo el uso 100% offline.
-   **Modo Nube Integrado**: Sincronización en la nube opcional mediante Supabase para equipos de trabajo que requieran administración centralizada.
-   **Mapas Interactivos**: Integración con Leaflet para geolocalización precisa de direcciones e incidentes.
-   **Modo Oscuro/Claro (OLED y Slate)**: Interfaz adaptativa usando `shadcn/ui` y optimizada para reducir la fatiga visual nocturna (modo OLED profundo).
-   **Validación Inteligente**: Formularios robustos con tipos de datos estrictos y validación reactiva.

---

## 📖 Sistema de Plantillas

El corazón de la aplicación es su potente motor de plantillas (`template-parser.ts`). Permite definir la estructura de un reporte usando una sintaxis de marcas simple.

### 1. Variables Básicas
Para capturar un dato, simplemente encierra el nombre del campo entre llaves:

```text
El funcionario {NombreFuncionario} se presentó en el lugar.
```

### 2. Tipos de Campos
Puedes especificar el tipo de input que se mostrará en el formulario añadiendo `:tipo` después del nombre:

| Sintaxis | Descripción |
| :--- | :--- |
| `{Fecha:date}` | Selector de fecha. |
| `{Hora:time-hlv}` | Selector de hora (formato HLV/militar). |
| `{Detalles:textarea}` | Área de texto multilinea. |
| `{Edad:number}` | Input numérico. |

### 3. Dropdowns (Listas Desplegables)
Puedes definir opciones directamente en la plantilla:

```text
Situación: {Estado:dropdown(Activo=1|Inactivo=0|Pendiente=2)}
```
*Formato*: `Etiqueta=Valor`. El usuario ve la etiqueta, el reporte guarda el valor.

### 4. Secciones
Agrupa campos relacionados en bloques visuales.

**Sección Simple:**
```text
["Datos del Vehículo"]
Marca: {Marca}
Modelo: {Modelo}
```

**Sección Repetible (Listas):**
Añade un asterisco `*` al final del corchete de cierre para permitir al usuario añadir múltiples entradas de esta sección.

```text
["Evidencia Colectada"]*
Descripción: {DescripcionEvidencia}
Peso: {Peso}
```

**Metadatos de Sección:**
Puedes personalizar las etiquetas de los botones para secciones repetibles:
```text
[plural="Vehículos" singular="Vehículo" sub="Datos del Vehículo"]*
...campos...
```

### 5. Lógica Condicional
Muestra u oculta bloques de texto basándote en el valor de un campo anterior.

```text
¿Hubo detenidos? {HuboDetenidos:dropdown(Sí=1|No=0)}

[?{HuboDetenidos}=1]
  ["Datos del Detenido"]*
  Nombre: {NombreDetenido}
  Cédula: {CedulaDetenido}
[/]
```
*Nota*: El bloque solo se mostrará si el campo `{HuboDetenidos}` tiene el valor `1`.

### 6. Resumen Automático
Usa marcadores dobles `<< >>` para definir qué parte del texto debe aparecer en la vista previa o resumen corto, ignorando el resto.

```text
<<Se reporta incidente tipo {Tipo} en {Ubicacion}.>>
Detalles extensos: {DetallesCompletos} ...
```

### 7. Separadores
Usa `[""]` para insertar una línea divisoria visual en el formulario sin crear una nueva sección de datos.

### 8. Reglas Estadísticas y Etiquetas Especiales (`*` y ` (1)`)
La aplicación cuenta con un motor de mapeo automático de estadísticas basado en reglas condicionales. Para campos que pertenecen a **secciones repetibles**, el editor ofrece dos etiquetas especiales:
* **Asterisco (`Campo*`)**: Evalúa secuencialmente **todos** los registros agregados por el usuario en esa lista repetible. Incrementará las estadísticas por cada fila individual que cumpla la condición.
* **Paréntesis Uno (`Campo (1)`)**: Evalúa únicamente la **primera** fila no vacía ingresada en la lista repetible. Ideal para métricas a nivel general de reporte (ej. saber si hubo detenidos sin duplicar el contador por cada persona detenida).

Para obtener más información y ver ejemplos detallados sobre el funcionamiento y diseño de este motor de reglas, consulta la [Guía de Reglas Estadísticas y Etiquetas Especiales](file:///c:/Users/Dark/Documents/GitHub/Minutas/docs/statistics-rules-guide.md).

---

## 🛠️ Tecnologías

-   **Entorno/Bundler**: [Vite 7](https://vite.dev)
-   **Librería Principal**: [React 19](https://react.dev)
-   **Base de Datos Local**: [RxDB](https://rxdb.info) con persistencia local reactiva.
-   **Sincronización en la Nube**: [Supabase](https://supabase.com) (Opcional, configurable por Workspace).
-   **UI**: [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
-   **Estilos**: [Tailwind CSS](https://tailwindcss.com)
-   **Mapas**: [React Leaflet](https://react-leaflet.js.org) + [Leaflet](https://leafletjs.com)
-   **Iconos**: [Lucide React](https://lucide.dev)

## 📦 Instalación y Uso

### Requisitos previos
- Node.js 18+ instalado.
- Administrador de paquetes `pnpm` (recomendado) o `npm`.

### Pasos
```bash
# 1. Instalar dependencias
pnpm install
# o con npm
npm install --legacy-peer-deps

# 2. Iniciar servidor de desarrollo
pnpm run dev
# o con npm
npm run dev
```

El servidor local se levantará por defecto en `http://localhost:5173`.

---

## 🔒 Privacidad y Sincronización

Este proyecto prioriza la privacidad operacional:
* **En Modo Local (`isCloud = false`)**: Todos los datos residen exclusivamente en tu navegador. Ninguna información de incidentes o personal es transmitida al exterior.
* **En Modo Nube (`isCloud = true`)**: Requiere autenticación de usuario. Permite sincronizar las novedades de guardia e incidentes con la base de datos Supabase configurada por los administradores. Los ajustes de módulos activos se manejan centralmente.

---

## 🌱 Desarrollo Guiado por Especificaciones (Spec Kit)

El desarrollo del proyecto se realiza bajo la metodología **Spec-Driven Development (SDD)**. La configuración se encuentra en la carpeta `.agents/skills/spec-kit`.

Puedes utilizar los comandos de Spec Kit para trabajar en nuevas funcionalidades:
- **`speckit-constitution`**: Consulta las directrices de código en [`.specify/memory/constitution.md`](file:///.specify/memory/constitution.md) (SOLID, WCAG AAA, etc.).
- **`speckit-specify`**: Describe los requerimientos y el alcance funcional de la característica en `specs/<id>/spec.md`.
- **`speckit-plan`**: Diseña el plan de arquitectura técnica en `specs/<id>/plan.md`.
- **`speckit-tasks`**: Genera la lista de tareas en `specs/<id>/tasks.md`.
- **`speckit-implement`**: Ejecuta las tareas de implementación de forma secuencial y ordenada.

## 📄 Licencia
Privado. Uso interno y oficial de Protección Civil.
