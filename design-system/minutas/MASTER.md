# Design System Master File (Original: Minutas)

> **LOGIC:** When building a specific page, first check `design-system/minutas/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Minutas
**Role:** Generador de Reportes de Protección Civil Local-First
**Style:** Utilitario, Denso, Táctico y Local-First
**Creative North Star:** "The Tactical Terminal" (El Terminal Táctico)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary (Light Mode) | `#1d4ed8` | `var(--primary)` |
| Primary (Dark Mode) | `#3b82f6` | `var(--primary)` |
| Success / CTA | `#22c55e` | `var(--success)` |
| Background (Light Mode) | `#f0f4f8` | `var(--background)` |
| Background (Dark Mode) | `#050506` | `var(--background)` |
| Background (Facebook Mode) | `#18191a` | `var(--background)` |
| Foreground / Text (Light) | `#030712` | `var(--foreground)` |
| Foreground / Text (Dark) | `#f9fafb` | `var(--foreground)` |
| Border / Input | `#e2e8f0` / `#27272a` | `var(--border)` |

**Color Notes:** Cobalt Blue (Light) / Vibrant Indigo (Dark) representing authority and operational clarity.

### Typography

- **Heading Font:** Outfit, sans-serif
- **Body Font:** Outfit, sans-serif
- **Mood:** Professional, sober, technical, precise

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps, inline details |
| `--space-sm` | `8px` | Icon gaps, padding small |
| `--space-md` | `16px` | Standard page padding, grid gaps |
| `--space-lg` | `24px` | Section padding, card internals |
| `--space-xl` | `32px` | Large structural gaps |

### Shadow Depths (Tonal-Layering - Flat by Default)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.08)` | Floating popovers, tooltips, dialogs only |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 8px 16px;
  border-radius: 8px; /* rounded-md */
  font-weight: 500;
  transition: background-color 150ms ease, box-shadow 150ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-hover); /* oklch/hex oscurecido */
}
```

### Cards / Containers

```css
.card {
  background: var(--card);
  border-radius: 16px; /* rounded-2xl / 1rem */
  border: 1px solid var(--border);
  padding: 24px;
  /* Flat by default - no shadow unless floating */
}
```

### Inputs

```css
.input {
  padding: 8px 12px;
  border: 1px solid var(--input);
  border-radius: 8px;
  background: var(--input-bg);
  transition: border-color 150ms ease;
}

.input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
```

---

## Style Guidelines

- **Densidad de datos:** Mantener padding mínimo y rejillas compactas para máxima visibilidad de datos de emergencias/novedades.
- **Transiciones:** Siempre usar transiciones ultrarrápidas de 100-150ms para cambios de estado (evitar saltos instantáneos) adaptadas a situaciones de respuesta crítica.
- **Cursores:** Todo elemento interactivo debe llevar explícitamente `cursor-pointer`.
- **Contraste de legibilidad (WCAG AAA):** El texto secundario o descriptivo debe mantener un ratio de contraste de al menos 5:1 contra el fondo de la pantalla (nivel WCAG AAA recomendado para visualización bajo luz solar directa o en cabinas de vehículos de emergencias).
- **Privacidad Local:** Diseños que dejen claro al usuario de forma visual que los datos sensibles no se transmiten al servidor externo.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Emojis decorativos como iconos** — Usar siempre iconos SVG (`lucide-react`).
- ❌ **Bordes acentuados a un solo lado (side-stripe borders > 1px)** — Utilizar bordes completos o variaciones de fondo.
- ❌ **Texto en degradado o Glassmorphism** — No encajan en el concepto utilitario y de alto contraste de la terminal táctica.
- ❌ **Anidación de tarjetas (cards inside cards)** — Utilizar divisores o variaciones de color plano para estructurar información interna.
