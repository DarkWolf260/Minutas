# Motor de Plantillas — Referencia de Sintaxis

Documento generado desde el código fuente (`lexer.ts`, `parser.ts`, `validator.ts`, `evaluator.ts`, `renderer.ts`, `titles.ts`).

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
| `predefined` | Campo con valor predefinido |
| `multi-text` | Lista de textos |
| `dropdown` | Selección de opciones desplegables |
| `cedula` | Número de cédula venezolana (V-XX.XXX.XXX) con formato automático |
| `semantic` | Tipo semántico legado (retrocompatibilidad; tratado como texto) |

#### Modificadores de campo

| Modificador | Descripción |
|-------------|-------------|
| `full` | El campo ocupa el ancho completo (100%) en el formulario |
| `req` | Campo obligatorio / requerido |
| `upper` | Convierte el texto a MAYÚSCULAS al renderizar |
| `lower` | Convierte el texto a minúsculas al renderizar |
| `title` | Convierte a Formato Título (primera letra de cada palabra en mayúscula) |
| `capitalize` | Convierte la primera letra del texto en mayúscula |
| `hidden` | Oculta el campo en la salida del reporte renderizado |
| `single` | Permite ingresar una sola hora (sin rango) para campos `time-hlv` |
| `default("Valor")` / `def=(Valor)` | Asigna un valor predeterminado si el campo queda vacío |

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

Los modificadores de presentación pueden combinarse con `:` o con tubería `|`:

```
{Descripcion:textarea:full:req}
{Reportante:text:upper}
{Nombre:title:req:full}
{Tipo:dropdown(A=Opción 1|B=Opción 2)|upper}
{Estatus:default("Pendiente"):req}
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
*DIRECTORA*
{Director}
[/]
[?{Director.sex} = M]
*DIRECTOR*
{Director}
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

1. Elimina marcadores de fotos `{photos}` y `{fotos}`
2. Elimina marcadores de resumen `<<` y `>>`
3. Elimina bloques condicionales y secciones residuales no procesadas `[?...][/]`, `[""]`, `[...]`
4. Convierte `\*` en `*` (asterisco literal)
5. **Colapsa 3+ saltos de línea consecutivos a máximo 2** (elimina líneas en blanco fantasma de bloques condicionales no renderizados)
6. Elimina líneas que quedaron con solo espacios/tabulaciones tras la sustitución
7. Hace `trim()` del resultado final

---

## 13. Campos Especiales y Etiquetas Reservadas

El motor de plantillas y el sistema reconocen una serie de palabras clave, etiquetas delimitadoras y metacampos con comportamiento predefinido o reservado:

### A. Etiquetas y Marcadores Estructurales Reservados

| Etiqueta / Marcador | Tipo / Ámbito | Comportamiento en el Motor |
|---------------------|---------------|----------------------------|
| `{photos}` / `{fotos}` | Marcador de fotos | Indica el punto de inserción de las fotografías adjuntas. En `renderFinalReport` se elimina limpiamente del texto si no hay fotos. |
| `<<` ... `>>` | Delimitador de resumen | Delimita texto de resumen ejecutivo. Con `summaryOnly: true`, el motor extrae únicamente lo encerrado aquí. En el reporte normal, los marcadores `<<` y `>>` se retiran automáticamente. |
| `[""]` | Separador de bloque | Representa un divisor estructural horizontal o salto de sección limpio sin título. |
| `["Título"]` | Separador con título | Sección estructural con título visible sin campos obligatorios. |
| `["Título" {campo}]` | Sección auto-contenida | Contiene texto y campos inline; si el campo no tiene datos, todo el bloque de texto y corchetes desaparece. |
| `[Label]*` | Sección repetible | Define un bloque de repetición múltiple (1 a N iteraciones). |
| `{Campo}*` | Campo repetible inline | Atajo que crea una sección repetible virtual para un solo campo. |
| `[singular="..." plural="..." sub="..."]*` | Atributos de sección repetible | `singular`: título con 1 elemento; `plural`: título con 2+ elementos; `sub`: prefijo/etiqueta para cada ítem iterado (`#01`, `#02`, etc.). |
| `[?{Campo} = Valor] ... [/]` | Bloque condicional | Controla la visibilidad del bloque según el valor del campo. |
| `[?{Campo} :show] ... [/]` | Condicional explícito | Fuerza la visibilidad del contenido cuando la condición se cumple. |
| `[?{Campo} :hide] ... [/]` | Condicional invertido | Oculta el bloque cuando la condición se cumple. |
| `[?{Campo}] Clave=Valor [/]` | Bloque de mapeo | Bloque de definición (no emite texto directo). Genera opciones desplegables dinámicas para `{Campo}` y traduce su valor en el reporte. |

---

### B. Campos con Detección Automática de Tipo

Si no se les especifica un tipo mediante modificadores (`:tipo`), el motor infiere automáticamente su comportamiento:

| Nombre del Campo | Tipo Asignado | Formateo y Comportamiento |
|------------------|---------------|---------------------------|
| `{hora}` / `{Hora}` | `time-hlv` | Valida y formatea hora militar en formato de 24 horas (HH:MM o HLV). |
| `{fecha}` / `{Fecha}` | `date` | Valida formato `YYYY-MM-DD` y lo formatea automáticamente a lenguaje natural: `DD/Mes/YYYY` con el nombre del mes capitalizado en español. |

---

### C. Campos de Personal con Formato Institucional

Al vincularse con registros de personal (`StaffMember`), ciertos nombres de campo activan un formateo protocolar automático:

| Campo | Función Aplicada | Resultado en Reporte |
|-------|------------------|----------------------|
| `{Reporta}` | `formatStaffReporta()` | Formato protocolar para quien suscribe el informe (ej. Grado, Nombre, Apellido, Cargo). |
| `{Analista}` | `formatStaffMember(showCedula = true)` | Formato que incluye obligatoriamente la Cédula de Identidad formateada del funcionario. |
| `{Director}`, `{Conductor}`, u otros | `formatStaffMember(showCedula = false)` | Formato institucional estándar de funcionario sin cédula visible. |

---

### D. Propiedades de Notación de Punto `{Campo.propiedad}`

Disponibles para campos que contienen objetos o listas de personal (`StaffMember`):

| Propiedad | Descripción | Ejemplo de Uso |
|-----------|-------------|----------------|
| `.sex` | Sexo del funcionario (`M` o `F`). Usado frecuentemente para condicionales de tratamiento protocolar. | `[?{Director.sex} = F]*DIRECTORA:*[/]` |
| `.name` | Nombre completo del funcionario. | `{Director.name}` |
| `.cargo` | Cargo o rol institucional asignado (`role_id` o `roleId`). | `{Director.cargo}` |
| `.rank` | Grado o jerarquía del funcionario. | `{Director.rank}` |
| `.cedula` / `.ci` | Número de cédula de identidad formateado. | `{Director.cedula}` |
| `.titulo` | Título profesional o de cortesía institucional. | `{Director.titulo}` |
| `.role_id` | Identificador interno del rol. | `{Director.role_id}` |
| `.observations` | Observaciones registradas para el funcionario. | `{Director.observations}` |
| `.id` | Identificador único del registro de personal. | `{Director.id}` |

---

### E. Metacampos y Variables Globales Predefinidas (`predefinedValues`)

Valores inyectados a nivel de Workspace, sistema y sesión activa, disponibles automáticamente para cualquier plantilla sin intervención manual:

| Variable Global | Origen del Auto-llenado | Descripción y Formato |
|-----------------|-------------------------|------------------------|
| `{Fecha}` | Reloj del sistema / Backend | Inicializado con la fecha actual (`YYYY-MM-DD`). Se formatea a `DD/Mes/YYYY` en el reporte. |
| `{Hora}` | Reloj del sistema | Hora actual en formato militar de 24 horas (`time-hlv`, HH:MM). |
| `{Municipio}` | Configuración del Workspace | Nombre del municipio asignado a la base operativa activa (ej. `Guanta`, `Bolívar`). |
| `{Estado}` | Configuración del Workspace | Entidad federal (`Anzoátegui`). |
| `{REDAN}` | Configuración Institucional | Región Estratégica de Evaluación de Daños (`Oriente`). |
| `{ZOEDAN}` | Configuración Institucional | Zona Operativa de Evaluación de Daños (`Anzoátegui`). |
| `{Usuario}` | Sesión de usuario activa | Nombre o identificador del usuario que elabora la minuta. |

---

### F. Auto-llenado por Guardia Activa y Asignación de Personal (`activeStaff`)

Al crear una minuta, el formulario inicializa automáticamente campos basados en el turno de guardia activo (`active_guard_id`) y su dotación de personal:

#### 1. Identificación de la Guardia
| Campo Reconocido | Comportamiento |
|------------------|----------------|
| `{Guardia}` / `{Grupo}` / `{Grupo de guardia}` / `{Guardia de servicio}` | Se completa automáticamente con el identificador o nombre del grupo de guardia en servicio según la Orden del Día. |

#### 2. Carga Automática de Funcionarios por Rol
| Campo de Personal | Lógica de Selección Automática |
|-------------------|--------------------------------|
| `{Reporta}` | Selecciona al primer funcionario disponible según la prioridad de roles configurada en el sistema (`settings.reportarole_ids`). |
| `{Analista}` | Carga al funcionario asignado al rol de Analista de guardia, formateando e incluyendo su Cédula de Identidad en el reporte final. |
| `{Director}`, `{Jefe de operaciones}`, `{Jefe de los servicios}` | Carga automáticamente al titular de la jefatura o dirección activa registrada en la institución. |
| `{Técnico}`, `{Auxiliar}`, `{Conductor}` | **Excepción manual intencional**: Están definidos como campos manuales (`MANUAL_FIELDS`) para permitir al operador seleccionar específicamente a los integrantes de la tripulación de ese servicio puntual sin sobreescritura automática. |

---

### G. Valores por Defecto en la Plantilla (`default` / `def`)

Cualquier campo en la plantilla puede definir un valor de auto-llenado por defecto:
- Sintaxis: `{Campo:default("Valor")}` o `{Campo:def=(Valor)}`
- Al abrir el formulario, el campo ya contendrá ese valor precargado a menos que el usuario lo modifique.

---

### H. Tabla de Tipos y Modificadores de Campos Reservados

Cada campo especial o reservado posee un tipo base (`FieldType`) asignado en el sistema y es compatible con modificadores específicos:

| Campo Reservado | Tipo de Dato (`FieldType`) | Modificadores Específicos | Modificadores de Texto Soportados | Modificadores de Estructura |
|-----------------|----------------------------|---------------------------|-----------------------------------|-----------------------------|
| `{Fecha}` / `{fecha}` | `date` | *(Formato natural DD/Mes/YYYY automático)* | `:upper` (ej. `29/SEPTIEMBRE/2026`), `:lower`, `:title`, `:hidden` | `:req`, `:full`, `:default("YYYY-MM-DD")` |
| `{Hora}` / `{hora}` | `time-hlv` | `:single` *(fuerza hora única puntual en vez de rango)* | `:upper`, `:lower`, `:hidden` | `:req`, `:full`, `:default("HH:MM")` |
| `{Municipio}` | `predefined` | *(Inyectado desde Workspace)* | `:upper` (ej. `GUANTA`), `:lower`, `:title`, `:capitalize`, `:hidden` | `:req`, `:full` |
| `{Estado}` | `predefined` | *(Inyectado desde Workspace)* | `:upper`, `:lower`, `:title`, `:hidden` | `:req`, `:full` |
| `{REDAN}` | `predefined` | *(Inyectado institucional)* | `:upper`, `:lower`, `:title`, `:hidden` | `:req`, `:full` |
| `{ZOEDAN}` | `predefined` | *(Inyectado institucional)* | `:upper`, `:lower`, `:title`, `:hidden` | `:req`, `:full` |
| `{Usuario}` | `predefined` / `text` | *(Sesión activa)* | `:upper`, `:lower`, `:title`, `:capitalize`, `:hidden` | `:req`, `:full` |
| `{Reporta}` | `predefined` / `staff` | Formateo protocolar vía `formatStaffReporta()` | `:upper` (suscripción en mayúsculas), `:title`, `:hidden` | `:req`, `:full` |
| `{Analista}` | `predefined` / `staff` | Formateo con Cédula obligatoria vía `formatStaffMember(showCedula = true)` | `:upper`, `:title`, `:hidden` | `:req`, `:full` |
| `{Director}`, `{Jefe de operaciones}`, etc. | `staff` | Notación de punto: `.sex`, `.name`, `.cargo`, `.rank`, `.cedula`, `.titulo` | `:upper`, `:title`, `:hidden` | `:req`, `:full` |
| `{Guardia}` / `{Grupo}` | `text` | *(Auto-rellenado con `active_guard_id`)* | `:upper`, `:lower`, `:title` | `:req`, `:full`, `:default("...")` |
| `{photos}` / `{fotos}` | *Marcador estructural* | *(No es campo de datos; marcador de fotos)* | *(Ninguno)* | *(Ninguno)* |
| `<<...>>` | *Marcador estructural* | *(Delimitador de resumen ejecutivo)* | *(Ninguno)* | *(Ninguno)* |

---

## 14. Ejemplo completo

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
