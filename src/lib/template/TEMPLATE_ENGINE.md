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

## 2. Acceso a propiedades de personal `{Campo.propiedad}`

Permite acceder a una propiedad específica del **primer miembro** asignado a un campo de personal (array de StaffMember).

### Sintaxis

```
{Campo.propiedad}
```

### Propiedades disponibles

| Propiedad | Descripción | Ejemplo |
|-----------|-------------|---------|
| `sex` | Sexo del miembro (`M` o `F`) | `{Director.sex}` |
| `name` | Nombre completo | `{Director.name}` |
| `cargo` | Cargo institucional | `{Director.cargo}` |
| `rank` | Jerarquía/Rango | `{Director.rank}` |
| `cedula` | Cédula de identidad | `{Director.cedula}` |
| `titulo` | Título profesional | `{Director.titulo}` |

### Uso en texto

```
El {Director.cargo} {Director} se reunió con...
```

### Uso en condicionales (caso de género)

```
[?{Director.sex} = F]
*DIRECTORA-PRESIDENTA:* {Director}
[/]
[?{Director.sex} = M]
*DIRECTOR-PRESIDENTE:* {Director}
[/]
```

Si el Director es femenino (`sex = "F"`), solo se renderiza el primer bloque. El segundo se suprime sin dejar líneas en blanco extra.

> **Nota**: El campo base (`{Director}`) debe ser un campo de tipo personal (array de StaffMember). Si el campo no tiene personal asignado, la propiedad devuelve vacío.

---

## 3. Campos Repetibles `{Campo}*`

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

## 4. Secciones `[Label]...[/]`

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

## 5. Secciones Auto-contenidas `["Título" {Campo}]`

Una sección completa en una sola línea (sin `[/]`):

```
["Título de ejemplo" {campo1} {campo2}]
```

El contenido entre `"Título"` y `]` son los campos de la sección.

---

## 6. Separadores Visuales `[""]`

Una sección vacía con comillas vacías actúa como separador visual:

```
[""]
```

Se elimina limpiamente en el reporte final (no genera texto).

---

## 7. Condicionales `[?{Campo} op valor]...[/]`

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
| `=` | Igual (case-insensitive para texto) |
| `!=` | Diferente |
| `>` | Mayor que |
| `<` | Menor que |
| `>=` | Mayor o igual |
| `<=` | Menor o igual |

### Verificar si un campo tiene contenido

Usando `!= ""` el condicional solo renderiza si el campo tiene algún valor:

```
[?{Observaciones} != ""]
- *OBSERVACIONES:* {Observaciones}
[/]
```

Funciona con:
- Texto: vacío (`""`) → condición falsa
- Arrays de personal: vacío (`[]`) → condición falsa; con elementos → condición verdadera
- Arrays de texto: vacío → falsa; con contenido → verdadera

### Comparación de valores

- Si ambos valores son numéricos, la comparación es **numérica**.
- Si alguno no es numérico, la comparación es **de texto** (case-insensitive).
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

### Condicional de género (uso típico con personal)

```
[?{Director.sex} = F]
*DIRECTORA-PRESIDENTA:* {Director}
[/]
[?{Director.sex} = M]
*DIRECTOR-PRESIDENTE:* {Director}
[/]
```

El bloque cuya condición sea falsa se suprime automáticamente. Los saltos de línea extra que quedarían se colapsan en la limpieza final.

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

## 8. Condicionales de Mapeo `[?{Campo}]...[/]`

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

## 9. Marcadores de Resumen `<<...>>`

El contenido entre `<<` y `>>` se puede extraer como resumen:

```
<<{descripcion}>>
```

Si se renderiza con `summaryOnly: true`, solo se extrae el contenido de los marcadores. En el reporte normal, los marcadores `<<` y `>>` se eliminan pero el contenido se muestra normalmente.

---

## 10. Escapado

- `{{` → Literal `{` (no se interpreta como campo)
- `[[` → Literal `[` (no se interpreta como sección)

---

## 11. Orden de resolución de valores

Al renderizar, el motor busca el valor de un campo en este orden:

1. `dynamicPredefinedValues` (valores predefinidos en tiempo de ejecución)
2. `itemData` (datos del ítem actual en secciones repetibles)
3. `data` (datos del formulario raíz)
4. Datos de secciones no-repetibles asociadas
5. `predefinedValues` (valores predefinidos globales, e.g. fecha del sistema)

La búsqueda de claves es **case-insensitive** (se compara en minúsculas).

Para campos con notación de punto (`{Director.sex}`), primero se resuelve el campo base (`Director`) usando el orden anterior, y luego se extrae la propiedad del objeto resultante.

---

## 12. Limpieza final del reporte

Después del renderizado, el motor aplica automáticamente:

1. Elimina marcadores de resumen `<<` y `>>`
2. Elimina bloques condicionales no procesados `[?...][/]`
3. Elimina separadores `[""]`
4. Elimina otras secciones `[...]` no procesadas
5. Resuelve etiquetas semánticas `{campo:semantic}`
6. Convierte `\*` en `*` (asterisco literal)
7. **Colapsa 3+ saltos de línea consecutivos a máximo 2** (elimina líneas en blanco fantasma de bloques condicionales no renderizados)
8. Elimina líneas que quedaron con solo espacios/tabulaciones tras la sustitución
9. Hace `trim()` del resultado final

---

## Ejemplo completo

```
REPORTE DE INCIDENTE
Fecha: {fecha}
Hora: {hora}
Reportado por: {reportante:upper:req}

[?{Director.sex} = F]
*DIRECTORA-PRESIDENTA:* {Director}
[/]
[?{Director.sex} = M]
*DIRECTOR-PRESIDENTE:* {Director}
[/]

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

[?{Observaciones} != ""]
- *OBSERVACIONES:* {Observaciones}
[/]

[""]

Descripción general: {descripcion:textarea:full:req}

<<{descripcion}>>

[singular="Novedad" plural="Novedades" sub="NOVEDAD"]*
{novedad:textarea:full}
[/]
```
