# Guía del Motor de Reglas Estadísticas y Etiquetas Especiales

El sistema de estadísticas de **Minutas** permite mapear de forma automatizada las palabras clave, valores y selecciones de los reportes hacia categorías estadísticas consolidadas. 

Cuando los campos pertenecen a **Secciones Repetibles** (listas dinámicas donde el usuario puede añadir múltiples registros, marcados en la plantilla con corchetes y asterisco, ej: `["Datos del Detenido"]*`), evaluar condiciones requiere un comportamiento especial. Para resolver esto, se crearon dos etiquetas especiales en la definición de reglas condicionales:

---

## 1. El Asterisco (`*`) - Evaluación Secuencial Repetible

### ¿Cómo funciona?
Cuando el identificador del campo (`field_id`) en una regla condicional termina con un asterisco (ej. `NombreDetenido*`), el motor de evaluación entiende que **debe iterar sobre todos los elementos de esa sección repetible**.

* **Iteración dinámica**: En lugar de evaluar el campo como un valor único, el motor extrae el arreglo completo de respuestas y ejecuta la regla sobre cada uno de los registros de forma secuencial.
* **Consolidación de estadísticas**: Si la regla se cumple para 3 registros diferentes (por ejemplo, 3 vehículos con marcas específicas que disparan la regla), la categoría estadística correspondiente sumará **3 ocurrencias** (o la ponderación correspondiente) en el reporte de cierre.

### Correlación con condiciones secundarias (Y / O)
Si utilizas condiciones compuestas (por ejemplo, una condición principal `NombreDetenido*` y una condición secundaria `EdadDetenido*` conectada mediante un operador **Y**):
* El motor evalúa secuencialmente **el mismo índice de fila** para ambas variables.
* Evaluará el `NombreDetenido` del Detenido #1 junto con la `EdadDetenido` del Detenido #1. Si ambos cumplen la condición, computa un acierto. Posteriormente pasará al Detenido #2, y así sucesivamente. Esto evita mezclar datos de registros diferentes.

### Ejemplo de Caso de Uso
* **Plantilla**:
  ```text
  ["Vehículos Involucrados"]*
  Marca: {MarcaVehiculo}
  Estado: {EstadoVehiculo:dropdown(Retenido=1|Liberado=2)}
  ```
* **Regla**: 
  * *SI*: `EstadoVehiculo*` `=` `Retenido`
  * *ENTONCES*: Asignar a la categoría `03.01 Vehículos Retenidos`.
  * *Resultado*: Si en un reporte se listan 3 vehículos y 2 son marcados como "Retenido", el motor sumará automáticamente 2 unidades a la estadística de retenciones.

---

## 2. El Paréntesis Uno (` (1)`) - Primera Coincidencia

### ¿Cómo funciona?
Cuando el identificador del campo termina con la etiqueta ` (1)` (ej. `NombreDetenido (1)`), el motor de evaluación **solo analizará el primer registro válido (no vacío) de la lista repetible**, ignorando por completo cualquier fila subsiguiente.

* **Limitación de cardinalidad**: Asegura que la regla se ejecute como máximo una sola vez por reporte, sin importar cuántos elementos añada el usuario en la sección repetible.
* **Extracción de cabecera**: Extrae el primer elemento del arreglo que no sea `null`, `undefined` ni una cadena vacía.

### Ejemplo de Caso de Uso
* **Plantilla**:
  ```text
  ["Detenidos"]*
  Nombre: {NombreDetenido}
  ```
* **Regla**:
  * *SI*: `NombreDetenido (1)` `filled` (Lleno)
  * *ENTONCES*: Asignar a `04.02 Reporte con Detenidos`.
  * *Resultado*: Sin importar si el funcionario ingresa 1 o 15 detenidos en el reporte, la regla solo se evaluará sobre el primero. Al cumplirse, se asigna exactamente **1 ocurrencia** a la categoría general, evitando duplicar o inflar la métrica general de reportes con detenidos.

---

## Resumen de Comportamiento Técnico

El archivo encargada de esta lógica es [categories.ts](file:///c:/Users/Dark/Documents/GitHub/Minutas/src/lib/estadisticas/categories.ts). A continuación se muestra cómo se limpian y procesan las etiquetas especiales en la función `obtenerCategoriasReporte`:

```typescript
const originalfield_id = rule.field_id || '';
const isSequentialPrimary = originalfield_id.endsWith('*');
const isFirstOnlyPrimary = originalfield_id.endsWith(' (1)');

// Limpieza para obtener el ID real en form_data
const basefield_id = isSequentialPrimary 
  ? originalfield_id.slice(0, -1) 
  : (isFirstOnlyPrimary ? originalfield_id.slice(0, -4) : originalfield_id);
const normfield_id = normalizarParaComp(basefield_id);

// ... búsqueda de valores ...

// Si es (1), solo tomamos el primer valor no vacío
if (isFirstOnlyPrimary && values.length > 0) {
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  values = nonEmpty.length > 0 ? [nonEmpty[0]] : [values[0]];
}

// Si es *, el motor procesará todo el listado de forma iterativa y sumará los aciertos individuales.
```

---

## 3. El Sufijo Virtual de Origen (`-Origen*`) - Evaluación de Trayectos o Rutas

### ¿Cómo funciona?
Cuando tienes una sección repetible de destinos (ej. `Destino*`) pero el punto de partida inicial proviene de un campo de cabecera único fuera de la repetición (ej. `Ubicación`), evaluar cada "tramo" o "segmento" del viaje requiere comparar de dónde vienes con hacia dónde vas.

Para facilitar esto sin obligar al usuario a duplicar información, el motor admite de forma nativa la sintaxis `[Campo]-Origen*` (ej. `Destino-Origen*`).

* **Resolución dinámica de tramos**: Al evaluar la fila `i` del campo repetible `Destino*`:
  - Para la **primera fila** (`i = 0`), `Destino-Origen*` devuelve el valor del campo principal **`Ubicación`**.
  - Para las **filas siguientes** (`i > 0`), `Destino-Origen*` devuelve el valor que tenía el destino anterior: **`Destino[i - 1]`**.
* **Garantía de emparejamiento**: El motor asegura que la longitud del arreglo virtual de orígenes coincida exactamente con el de destinos, permitiendo una comparación uno a uno (uno para cada tramo) mediante lógica secuencial.

---

### Ejemplo de Caso de Uso (Traslados)
Queremos clasificar cada tramo del traslado en:
- **Urbano** (si tanto el origen como el destino están dentro del Municipio).
- **Extraurbano** (si el origen o el destino están fuera del Municipio).

* **Campos en Plantilla**:
  - `Ubicación` (Campo de texto simple: punto de inicio)
  - `Destino` (Campo repetible: puntos intermedios y finales)

* **Reglas Estadísticas**:
  1. **6.1 TRASLADOS URBANOS**:
     - *SI*: `Destino*` `=` `{Municipio}`
     - *Y*: `Destino-Origen*` `=` `{Municipio}`
  2. **6.2 TRASLADOS EXTRAURBANOS**:
     - *SI*: `Destino*` `!=` `{Municipio}`
     - *O*: `Destino-Origen*` `!=` `{Municipio}`

* **Resultado Práctico**:
  Si la `Ubicación` inicial es **Barcelona** (dentro del municipio Bolívar), y el usuario añade dos destinos en la lista repetible:
  1. **Barcelona** (dentro de Bolívar)
  2. **Guanta** (fuera de Bolívar)

  El motor desglosará el trayecto en 2 tramos y los evaluará:
  * **Tramo 1 (Origen: Barcelona, Destino: Barcelona)**:
    - Ambos son iguales a `Bolívar` (el municipio). Se cumple la regla de **Urbano**.
  * **Tramo 2 (Origen: Barcelona, Destino: Guanta)**:
    - El destino es `Guanta` (diferente a `Bolívar`). Se cumple la condición `O` de **Extraurbano**.

  **Resultado final**: El reporte sumará automáticamente **1 traslado urbano** y **1 traslado extraurbano**.
