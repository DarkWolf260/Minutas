# 🛠️ Motor de Plantillas (v1.1.0)

El motor de plantillas de Minutas es un sistema modular diseñado para transformar texto enriquecido con etiquetas en formularios dinámicos y reportes finales estructurados.

---

## 🏗️ Arquitectura del Motor

El flujo de procesamiento se divide en cinco etapas desacopladas:

1.  **Lexer** (`lexer.ts`): Escanea el texto crudo y genera tokens identificando campos `{}` y secciones `[]`.
2.  **Parser** (`parser.ts`): Construye un Árbol de Sintaxis Abstracta (AST) y extrae configuraciones (tipos, validaciones, anidamiento).
3.  **Validator** (`validator.ts`): Verifica que la gramática sea correcta (secciones cerradas, campos válidos).
4.  **Evaluator** (`evaluator.ts`): Procesa la lógica condicional y aplica modificadores de texto.
5.  **Renderer** (`renderer.ts`): Combina la estructura con los datos del usuario para generar el texto final.

---

## 📝 Sintaxis de Etiquetas

### 1. Campos Básicos
La sintaxis general es: `{NombreCampo:tipo:propiedad|modificador}`

- **Simple**: `{Ubicación}` (Texto por defecto)
- **Tipo específico**: `{Fecha:date}`
- **Ancho completo**: `{Resumen:textarea:full}`
- **Requerido**: `{Cédula:text:req}`
- **Combinado**: `{Hora:time-hlv:full:req}`

### 2. Modificadores de Texto
Se aplican usando el carácter pipe `|`:
- **Mayúsculas**: `{Nombre|upper}` -> "JUAN PEREZ"
- **Minúsculas**: `{Nombre|lower}` -> "juan perez"
- **Título**: `{Nombre|title}` -> "Juan Perez"

### 3. Campos Especiales (Dropdown)
Puedes definir opciones directamente en la etiqueta:
- `{Turno:dropdown(Mañana=M|Tarde=T|Noche=N)}`

---

## 📂 Secciones y Estructura

### 1. Secciones Estáticas
Agrupan campos lógicamente.
```text
[Datos del Vehículo]
Placa: {Placa}
Color: {Color}
[/]
```

### 2. Secciones Repetibles
Permiten al usuario añadir múltiples elementos del mismo tipo. Se activan con el asterisco `*`.
```text
[Acompañantes]*
Nombre: {Nombre}
Cédula: {Cédula:text:req}
[/]
```

### 3. Campos Repetibles (Acceso rápido)
Un campo seguido de `*` se convierte automáticamente en una sección repetible de un solo campo.
- `{Evidencias}*`

---

## ⚖️ Lógica Condicional

Permite mostrar u ocultar contenido basado en el valor de otros campos.

**Sintaxis**: `[?{Campo} operador valor] contenido [/]`

**Operadores Soportados**:
- `=` (Igual a)
- `!=` (Diferente de)
- `>` (Mayor que)
- `<` (Menor que)
- `>=` (Mayor o igual)
- `<=` (Menor o igual)

**Ejemplo**:
```text
¿Hubo heridos? {Heridos:dropdown(Si=S|No=N)}

[?{Heridos} = S]
[Lista de Heridos]*
Nombre: {Nombre}
Gravedad: {Gravedad:dropdown(Leve=L|Grave=G)}
[/]
[/]
```

---

## 📋 Tipos de Datos Soportados

| Tipo | Uso | Descripción |
| :--- | :--- | :--- |
| `text` | `{Nombre:text}` | Entrada de texto corto de una línea. |
| `textarea` | `{Detalles:textarea}` | Caja de texto multilínea. |
| `date` | `{Fecha:date}` | Selector de fecha (YYYY-MM-DD). |
| `time-hlv` | `{Hora:time-hlv}` | Selector de hora específico (formato HLV). |
| `number` | `{Edad:number}` | Entrada numérica. |
| `dropdown` | `{Opción:dropdown(...)}` | Menú desplegable de selección única. |
| `multi-text` | `{Unidades:multi-text}` | Selección múltiple de elementos. |
| `semantic` | `{Concepto:semantic}` | Campo vinculado a lógica del sistema. |
| `predefined` | `{Campo:predefined}` | Campo con valores pre-inyectados. |
