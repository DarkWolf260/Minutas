# Minutas - Generador de Reportes Policiales

Una aplicación web moderna construida con **Next.js 16**, **React 19** y **Tailwind CSS** para la generación dinámica de reportes policiales y minutas.

## 🚀 Características Principales

-   **Sistema de Plantillas Dinámicas**: Crea formularios complejos definiendo simples archivos de texto.
-   **Persistencia Local**: Todos los datos se guardan de forma segura en el navegador (`localStorage`).
-   **Mapas Interactivos**: Integración con Leaflet para geolocalización precisa de direcciones.
-   **Modo Oscuro/Claro**: Interfaz adaptativa usando `shadcn/ui`.
-   **Validación Inteligente**: Formularios robustos con tipos de datos estrictos.

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

---

## 🛠️ Tecnologías

-   **Framework**: [Next.js](https://nextjs.org) (App Router)
-   **UI**: [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
-   **Estilos**: [Tailwind CSS](https://tailwindcss.com)
-   **Mapas**: [React Leaflet](https://react-leaflet.js.org) + [Leaflet](https://leafletjs.com)
-   **Iconos**: [Lucide React](https://lucide.dev)

## 📦 Instalación

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm run dev
```

## 🔒 Seguridad
Este proyecto no utiliza base de datos en la nube. Toda la información sensible reside únicamente en el dispositivo del usuario.

## 📄 Licencia
Privado. Uso interno.
