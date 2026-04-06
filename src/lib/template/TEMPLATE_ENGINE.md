# Motor de Plantillas — Referencia de Sintaxis

Documento generado desde el código fuente (`lexer.ts`, `parser.ts`, `evaluator.ts`, `renderer.ts`).

---

## 1. Campos `{FieldName}`

### Sintaxis básica

```
{NombreCampo}
```

- El nombre del campo es **case-sensitive** tal como se escribe.
- Si el nombre es `hora` o `fecha` (case-insensitive), el tipo se detecta automáticamente:
  - `hora` → `time-hlv`
  - `fecha` → `date`

### Sintaxis completa con modificadores

```
{NombreCampo:tipo:opciones}
```

Los segmentos están separados por `:`. El orden de los segmentos después del nombre no importa.

#### Tipos de campo disponibles

| Tipo | Descripción |
|------|-------------|
| `text` | Texto simple (por defecto) |
| `textarea` | Texto largo / multilinea |
| `date` | Fecha (formato YYYY-MM-DD → se renderiza como DD/Mes/YYYY) |
| `time-hlv` | Hora (HH:MM) |
| `predefined` | Valor predefinido globalmente |
| `multi-text` | Lista de textos |
| `dropdown` | Selección de opciones |
| `semantic` | Concepto semántico (resuelto en post-proceso) |

#### Modificadores de campo

| Modificador | Descripción |
|-------------|-------------|
| `full` | Campo ocupa ancho completo en el formulario |
| `req` | Campo requerido |
| `upper` | Convierte a MAYÚSCULAS al renderizar |
| `lower` | Convierte a minúsculas al renderizar |
| `title` | Convierte a Título (primera letra de cada palabra en mayúscula) |

#### Dropdown con opciones inline

```
{TipoCampo:dropdown(Clave1=Valor1|Clave2=Valor2)}
```

- La `Clave` es lo que ve el usuario en el formulario.
- El `Valor` es lo que se inserta en el reporte al renderizar.
- Las opciones se separan con `|`.

```
Ejemplo: {Estado:dropdown(A=Activo|I=Inactivo|S=Suspendido)}
```

#### Combinando modificadores

```
{Descripcion:textarea:full:req}
{Reportante:text:upper}
{Nombre:title:req:full}
```

---

## 2. Campos Repetibles `{Campo}*`

Un campo seguido de `*` genera automáticamente una sección repetible.

```
Novedades: {novedad}*
```

Esto crea una sección repetible donde el campo `novedad` puede tener múltiples instancias.

Ejemplo con campos de direcciones repetibles:
```text
["INFORMACIÓN GEOGRÁFICA"
- *UBICACIÓN:* {Ubicación:textarea:req}
- *DESTINO:* {Destino:textarea:req}*
]
```

---

## 3. Secciones `[Label]...[/]`

### Sección simple

```
[Título de la sección]
Contenido con {campos}
[/]
```

- La sección se incluye en el reporte si tiene al menos un campo con valor.
- El título aparece como encabezado si se incluye.

### Sección repetible

```
[Label]*
{campo1}
{campo2}
[/]
```

El `*` al final del `[Label]*` marca la sección como repetible.

### Sección repetible con etiquetas singulares/plurales

```
[singular="Novedad" plural="Novedades" sub="NOVEDAD"]
{descripcion:textarea}
[/]
```

| Atributo | Descripción |
|----------|-------------|
| `singular` | Título cuando hay 1 ítem |
| `plural` | Título cuando hay más de 1 ítem |
| `sub` | Prefijo para cada ítem (e.g. `NOVEDAD #01`) |

---

## 4. Secciones Auto-contenidas `["Título" {Campo}]`

Una sección completa en una sola línea (sin `[/]`):

```
["Título de ejemplo" {campo1} {campo2}]
```

El contenido entre `"Título"` y `]` son los campos de la sección.

---

## 5. Separadores Visuales `[""]`

Una sección vacía con comillas vacías actúa como separador visual:

```
[""]
```

Se elimina limpiamente en el reporte final (no genera texto).

---

## 6. Condicionales `[?{Campo} op valor]...[/]`

Muestra el contenido solo si la condición es verdadera.

### Sintaxis

```
[?{Campo} = valor]
Contenido visible si Campo = valor
[/]
```

### Modo del condicional (conditionMode)

Por defecto, los campos dentro de un condicional **se ocultan en el formulario** hasta que la condición se cumpla. Puedes cambiar este comportamiento con el sufijo `:show`:

```
[?{Campo} = valor:show]
Contenido siempre visible en el formulario, pero solo en el reporte si se cumple
[/]
```

| Sintaxis | Formulario | Reporte |
|---|---|---|
| `[?{Estatus}=Finalizado]` | Oculto hasta que se cumpla | Solo si condición es verdadera |
| `[?{Estatus}=Finalizado:show]` | **Siempre visible** (con indicador visual) | Solo si condición es verdadera |

### Operadores disponibles

| Operador | Descripción |
|----------|-------------|
| `=` | Igual |
| `!=` | Diferente |
| `>` | Mayor que |
| `<` | Menor que |
| `>=` | Mayor o igual |
| `<=` | Menor o igual |

### Comparación de valores

- Si ambos valores son numéricos, la comparación es **numérica**.
- Si alguno no es numérico, la comparación es **de texto**.
- Los valores pueden ir entre **comillas dobles opcionales**: `[?{Estado} = "activo"]`

### Condicional con dropdown

Cuando el campo es un dropdown, la comparación se hace contra el **label** (la clave visible), no contra el valor interno.

```
{Tipo:dropdown(Robo=Descripción de robo|Vandalismo=Descripción de vandalismo)}

[?{Tipo} = Robo]
Monto robado: {monto}
[/]

[?{Tipo} = Vandalismo]
Área dañada: {area}
[/]
```

### Condicional anidado

Los condicionales pueden anidarse dentro de secciones:

```
[Sección Principal]
{campo1}
[?{tipo} = Robo]
{monto}
[/]
[/]
```

---

## 7. Condicionales de Mapeo `[?{Campo}]...[/]`

Un condicional **sin operador ni valor** es un bloque de mapeo. Define una tabla de traducción para un campo.

```
[?{Tipo}]
Robo=El día de hoy se registró un robo de...
Vandalismo=Se reportó acto vandálico en...
Accidente=Ocurrió un accidente de tránsito en...
[/]
```

**Comportamiento:**
- El bloque en sí **no genera texto** en el reporte.
- Cuando el campo `{Tipo}` se renderiza en cualquier otro lugar de la plantilla, se sustituye por el **valor** (el texto después de `=`) que corresponda al **label seleccionado**.
- Implícitamente convierte `{Tipo}` en un campo de tipo `dropdown`.
- Las claves son los valores del dropdown que ve el usuario.
- Los valores son los textos largos que van al reporte.

---

## 8. Marcadores de Resumen `<<...>>`

El contenido entre `<<` y `>>` se puede extraer como resumen:

```
<<{descripcion}>>
```

Si se renderiza con `summaryOnly: true`, solo se extrae el contenido de los marcadores. En el reporte normal, los marcadores `<<` y `>>` se eliminan pero el contenido se muestra normalmente.

---

## 9. Escapado

- `{{` → Literal `{` (no se interpreta como campo)
- `[[` → Literal `[` (no se interpreta como sección)

---

## 10. Orden de resolución de valores

Al renderizar, el motor busca el valor de un campo en este orden:

1. `dynamicPredefinedValues` (valores predefinidos en tiempo de ejecución)
2. `itemData` (datos del ítem actual en secciones repetibles)
3. `data` (datos del formulario raíz)
4. Datos de secciones no-repetibles asociadas
5. `predefinedValues` (valores predefinidos globales, e.g. fecha del sistema)

La búsqueda de claves es **case-insensitive** (se compara en minúsculas).

---

## 11. Limpieza final del reporte

Después del renderizado, el motor aplica automáticamente:

1. Elimina bloques condicionales no procesados `[?...][/]`
2. Elimina separadores `[""]`
3. Elimina otras secciones `[...]` no procesadas
4. Elimina marcadores de resumen `<<` y `>>`
5. Convierte `\*` en `*` (asterisco literal)
6. Reduce más de 2 saltos de línea consecutivos a máximo 2
7. Convierte tabulaciones en 4 espacios
8. Hace trim del resultado final

---

## Ejemplo completo

```
REPORTE DE INCIDENTE
Fecha: {fecha}
Hora: {hora}
Reportado por: {reportante:upper:req}

Tipo de incidente: {tipo:dropdown(Robo=Robo|Vandalismo=Vandalismo|Accidente=Accidente)}

[?{tipo}]
Robo=Se registró un evento de robo en las instalaciones.
Vandalismo=Se registraron actos de vandalismo.
Accidente=Se registró un accidente de tránsito.
[/]

[?{tipo} = Robo]
Monto aproximado: {monto}
Objetos sustraídos: {objetos:textarea:full}
[/]

[?{tipo} = Vandalismo]
Área afectada: {area:textarea:full}
[/]

[""]

Descripción general: {descripcion:textarea:full:req}

<<{descripcion}>>

[singular="Novedad" plural="Novedades" sub="NOVEDAD"]*
{novedad:textarea:full}
[/]
```
