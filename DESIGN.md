---
name: Minutas
description: Generador de Reportes Policiales Local-First
colors:
  primary: "#1d4ed8"
  primary-dark: "#3b82f6"
  background: "#f0f4f8"
  background-dark: "#050506"
  foreground: "#030712"
  foreground-dark: "#f9fafb"
  border: "#e2e8f0"
  border-dark: "#27272a"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#1e40af"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Minutas

## 1. Overview

**Creative North Star: "The Tactical Terminal" (El Terminal Táctico)**

El diseño de Minutas se define como un entorno utilitario, altamente denso y preciso, concebido para brindar máxima eficiencia a los funcionarios en servicio. Prioriza la legibilidad inmediata y un orden riguroso que minimice la fatiga visual bajo condiciones de luz cambiante (como turnos nocturnos o luz solar directa sobre dispositivos móviles). Este sistema rechaza el decorativismo vacío de los dashboards comerciales comunes y se establece como una herramienta de trabajo sobria, confiable y extremadamente rápida.

**Key Characteristics:**
- Alta densidad de datos sin abrumar visualmente.
- Interfaz adaptativa optimizada con modo oscuro OLED profundo y modo "Facebook" de bajo contraste.
- Jerarquía de información clara a través de contrastes tipográficos y espaciados calculados.
- Ausencia de adornos: cada borde y fondo cumple una función delimitadora o de estado.

---

## 2. Colors

La paleta de colores utiliza contrastes fuertes para garantizar una lectura rápida y cumplir rigurosamente con los estándares de accesibilidad WCAG AA.

### Primary
- **Tactical Cobalt** (`#1d4ed8` / `oklch(0.51 0.22 260)`): Azul de alta intensidad usado para acciones primarias, acentos de selección principales e indicadores clave del sistema. Simboliza autoridad y claridad.
- **Vibrant Indigo (Dark Mode)** (`#3b82f6` / `oklch(0.65 0.22 260)`): Variante más luminosa del azul primario, optimizada para destacar sobre el fondo negro OLED del modo oscuro sin causar fatiga visual.

### Neutral
- **Deep Obsidian (Dark Background)** (`#050506` / `oklch(0.12 0.01 240)`): Fondo ultra oscuro óptimo para pantallas OLED, disminuyendo el consumo de batería y reduciendo la fatiga ocular nocturna.
- **Facebook Slate (Gray Background)** (`#18191a` / `oklch(0.20 0.01 240)`): Variante de modo oscuro para pantallas no OLED, reduciendo el contraste extremo.
- **Cool Light-Gray (Light Background)** (`#f0f4f8` / `oklch(0.96 0.01 240)`): Fondo claro que evita el blanco puro para reducir el deslumbramiento.
- **Ink Primary** (`#030712` / `oklch(0.12 0.01 240)`): Texto principal sobre fondo claro.
- **Ink Muted** (`#475569` / `oklch(0.45 0.03 240)`): Texto secundario, descripciones y placeholders de alta legibilidad que garantizan contraste AA.

### Named Rules
**The 10% Accent Rule.** El azul primario se reserva estrictamente para botones de acción directa, enlaces de navegación activos e indicadores de estado crítico. Nunca se usa como color de fondo decorativo para secciones completas.

---

## 3. Typography

**Display Font:** Outfit (con fallbacks sans-serif)
**Body Font:** Outfit (con fallbacks sans-serif)

El sistema tipográfico utiliza la fuente *Outfit* para proyectar modernidad y precisión técnica sin perder legibilidad en tamaños reducidos.

### Hierarchy
- **Display** (Bold, `2rem` a `3rem` vía clamp, `1.2` line-height): Títulos principales del sistema y encabezados de páginas.
- **Headline** (SemiBold, `1.5rem` / `24px`, `1.3` line-height): Títulos de tarjetas principales y bloques lógicos.
- **Title** (Medium, `1.125rem` / `18px`, `1.4` line-height): Subsecciones, nombres de campos en formularios de plantillas.
- **Body** (Regular, `14px` (móvil) / `16px` (desktop), `1.5` line-height): Texto de reportes, minutas generadas y párrafos explicativos. Longitud máxima limitada a 65–75 caracteres (`max-w-prose`) para lectura óptima.
- **Label** (Medium/Bold, `12px` / `0.05em` tracking, uppercase): Etiquetas de botones pequeños, badges de estado y eyebrows selectivos.

### Named Rules
**The Balance Rule.** Todos los encabezados `h1` a `h3` deben aplicar la propiedad `text-wrap: balance` para evitar saltos de línea huérfanos e incómodos. El texto de cuerpo largo debe usar `text-wrap: pretty`.

---

## 4. Elevation

El sistema de profundidad se basa estrictamente en la separación tonal de fondos (capas de color plano) para mantener la limpieza técnica y evitar sombras innecesarias que ralenticen el renderizado o ensucien el contraste.

### Shadow Vocabulary
- **Float Control** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`): Utilizado únicamente para elementos flotantes interactivos como diálogos (modales), menús desplegables (`popovers`), alertas de toast y controles de mapas interactivos.

### Named Rules
**The Flat-By-Default Rule.** Todos los paneles, campos y tarjetas del sistema son planos y se delimitan mediante bordes sutiles de alta definición (`#e2e8f0` en modo claro, `#27272a` en modo oscuro) o variaciones del fondo tonal. Las sombras solo aparecen cuando un elemento "flota" activamente sobre la interfaz.

---

## 5. Components

Cada componente se diseña bajo el principio de ergonomía y robustez física (fácil de tocar en dispositivos móviles).

### Buttons
- **Shape:** Radio de borde medio (8px / `rounded-md`).
- **Primary:** Fondo Tactical Cobalt (`#1d4ed8`) y texto blanco, con padding generoso (`8px 16px` o superior en móvil para aumentar la zona de toque).
- **Hover / Focus:** Transiciones fluidas en 200ms (`transition-colors duration-200`). En hover se oscurece a `#1e40af`. Al enfocar se muestra un anillo de enfoque marcado (`ring-2 ring-primary`).

### Cards / Containers
- **Corner Style:** Radio de borde amplio (16px / `rounded-2xl` / `var(--radius)`) para suavizar el aspecto del terminal técnico.
- **Background:** Blanco puro (`#ffffff`) en modo claro; Obsidian Dark (`#0b0b0c`) en modo oscuro.
- **Border:** Borde sólido de 1px (`border-border`) que delimita el contenedor sin depender de sombras.
- **Internal Padding:** Spacing generoso (`16px` a `24px`) para evitar el hacinamiento de texto.

### Inputs / Fields
- **Style:** Fondo claro o neutro oscuro, radio de 8px, y borde sólido de 1px (`#e2e8f0` o `#27272a`).
- **Focus:** Cambio de borde inmediato al color primario con anillo de enfoque sutil.
- **Error:** Borde rojo destructivo (`#ef4444`) con mensaje aclaratorio inmediato de alto contraste.

---

## 6. Do's and Don'ts

### Do:
- **Do** Asegurar que todo texto principal tenga un contraste mínimo de 4.5:1 (usando grises oscuros o colores sólidos sobre los fondos).
- **Do** Usar iconos SVG de `lucide-react` con tamaño fijo de `w-5 h-5` (20px) o `w-6 h-6` (24px) para mantener consistencia.
- **Do** Agregar la clase `cursor-pointer` a cualquier tarjeta o elemento que sea clickeable.
- **Do** Respetar la preferencia de movimiento reducido `@media (prefers-reduced-motion: reduce)` simplificando las transiciones a opacidades inmediatas.

### Don't:
- **Don't** Usar emojis decorativos en la interfaz o como iconos de navegación (ej: ⚙️, 📅, 👥). Utilizar siempre SVGs.
- **Don't** Usar textos en degradado (gradient text) o glassmorphism como elemento por defecto; desvirtúa el concepto de Terminal Táctico.
- **Don't** Colocar bordes acentuados gruesos a un solo lado (side-stripe borders mayores a 1px) en tarjetas o alertas. Si hay borde, debe ser completo.
- **Don't** Animar imágenes o tarjetas mediante transformaciones de escala o rotación agresivas en `:hover` que causen desbordamiento o alteren la posición de otros elementos del layout.
- **Don't** Nestar tarjetas dentro de otras tarjetas ("cards inside cards"). Si se necesita jerarquía, utiliza colores de fondo planos alternativos o divisores semánticos.
