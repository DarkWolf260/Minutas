---
target: pagina de personal
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-10-05T19-52-35Z
slug: src-pages-personal-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Buen feedback en operaciones, pero el contador de resultados no tiene `aria-live` para lectores de pantalla. |
| 2 | Match System / Real World | 2 | **Iconos invertidos en CSV**: "Importar" tiene icono de descarga y "Exportar" tiene icono de subida. |
| 3 | User Control and Freedom | 3 | Selección masiva cuenta con diálogo de confirmación, pero solo permite eliminar (sin deshacer ni cambio de estado). |
| 4 | Consistency and Standards | 3 | Coherente con el resto del sistema, aunque la barra de acciones masivas usa colores hexadecimales rígidos (`#fff1f1`). |
| 5 | Error Prevention | 3 | Confirmaciones para eliminación individual y masiva; detalle de `colSpan={8}` en tabla con 9 columnas. |
| 6 | Recognition Rather Than Recall | 2 | Ausencia de filtros rápidos por Estado o Departamento; el usuario debe recordar y tipear términos en el buscador. |
| 7 | Flexibility and Efficiency | 2 | Sin atajos de teclado, sin paginación/virtualización para nóminas grandes (+100) ni edición de estado en lote. |
| 8 | Aesthetic and Minimalist Design | 3 | Pestañas limpias y diseño de tarjetas móviles bien resuelto, aunque el diálogo móvil tiene borde de acento en esquina redondeada. |
| 9 | Error Recovery | 3 | Mensajes claros vía toasts de Sonner y diálogos de confirmación destructiva. |
| 10 | Help and Documentation | 3 | Buen contexto inicial, pero falta guía visual o tooltips para la sincronización entre roles y estructura. |
| **Total** | | **27/40** | **Aceptable** |

#### Anti-Patterns Verdict

- **LLM assessment**: La interfaz está bien estructurada y modularizada (4 pestañas claras: *Funcionarios*, *Estructura*, *Guardias*, *Unidades*), pero adolece de fricciones de usabilidad comunes: iconos de importación/exportación invertidos, falta de filtros facetados (solo existe un input de texto libre), y estilos rígidos en la barra flotante de selección masiva.
- **Deterministic scan**: Se detectó 1 alerta con `detect.mjs`:
  - `border-accent-on-rounded` en `src/components/personnel/personnel-history-dialog.tsx:129` (`border-t-2` sobre contenedor con `rounded-t-3xl`).
- **Visual overlays**: No disponible en esta sesión debido a que el subagente de navegador reportó fallo de resolución de puerto CDP en el entorno local. Se completó el análisis exhaustivo de código fuente y AST.

#### Overall Impression
La página de Personal posee una arquitectura sólida y limpia con separación clara de responsabilidades y soporte responsivo móvil/escritorio. Su mayor debilidad radica en la eficiencia de gestión diaria: un oficial o administrador necesita filtrar rápidamente por funcionarios activos, reposos o departamentos sin tener que tipear manualmente en una barra de búsqueda general.

#### What's Working
1. **Organización en 4 Pestañas Claras**: División lógica entre nómina individual (*Funcionarios*), jerarquías departamentales (*Estructura*), asignación de turnos (*Guardias*) y parque automotor (*Unidades*).
2. **Presentación Adaptativa Móvil vs Escritorio**: La tabla completa de escritorio se transforma en un stack de tarjetas compactas en móviles con acciones rápidas al pie.
3. **Mapeo Robusto de CSV**: El importador/exportador normaliza acentos, variaciones de cabecera y formatos de cédula automáticamente.

#### Priority Issues
- **[P1] Iconos Invertidos en Importar/Exportar CSV**: En `csv-import-button.tsx`, "Importar CSV" tiene `<Download />` y "Exportar CSV" tiene `<Upload />`. Esto invierte la convención universal de transferencia de archivos.
  - *Por qué importa*: Genera confusión instantánea en el usuario que intenta respaldar o cargar la nómina.
  - *Fix*: Invertir los iconos (`Upload` para importar, `Download` para exportar).
  - *Comando sugerido*: `/impeccable clarify`
- **[P1] Ausencia de Filtros Rápidos por Estado y Departamento**: En `personnel-table.tsx`, el usuario solo cuenta con un campo de texto libre. No puede filtrar con un solo clic a los funcionarios en "Reposo", "Vacaciones" o "Permiso".
  - *Por qué importa*: Obliga a recordar la terminología exacta y buscar manualmente, elevando la carga cognitiva.
  - *Fix*: Incorporar chips o selectores de filtro rápido para Estado y Departamento junto al buscador.
  - *Comando sugerido*: `/impeccable layout`
- **[P2] Desalineación en Estado Vacío de la Tabla (`colSpan={8}`)**: En `personnel-table.tsx` línea 190, cuando no hay resultados de búsqueda o no hay personal, el `TableCell` tiene `colSpan={8}`, pero la cabecera tiene 9 columnas (Checkbox, Jerarquía, Nombre, Cédula, Sexo, Cargo, Departamento, Estado, Acciones).
  - *Por qué importa*: Causa que la celda de mensaje no cubra todo el ancho de la tabla, dejando un hueco visual o borde roto a la derecha.
  - *Fix*: Corregir `colSpan={9}`.
  - *Comando sugerido*: `/impeccable polish`
- **[P2] Estilos y Posicionamiento Flotante en Barra de Acciones Masivas**: En `mass-actions-bar.tsx`, se usan colores hexadecimales no parametrizados (`#fff1f1` y `#2a0a0a`) y un truco de `h-0 overflow-visible pointer-events-none` que puede solaparse con modales.
  - *Por qué importa*: Rompe la coherencia con los tokens de diseño del tema y puede interferir con la navegación táctil.
  - *Fix*: Emplear tokens semánticos `bg-destructive/10 border-destructive/20 text-destructive` y fijar la barra en la parte inferior o flotante limpia.
  - *Comando sugerido*: `/impeccable polish`
- **[P3] Borde de Acento en Contenedor Redondeado**: En `personnel-history-dialog.tsx`, la combinación de `border-t-2 border-primary/20` con `rounded-t-3xl` genera esquinas cuadradas en el trazado del borde superior sobre un sheet curvo.
  - *Fix*: Eliminar `border-t-2` y utilizar la línea de arrastre (*grab handle*) estándar de Radix/Vaul.
  - *Comando sugerido*: `/impeccable polish`

#### Persona Red Flags
- **Alex (Power User)**: No dispone de filtros inmediatos por turno o estado para revisar rápidamente la dotación disponible del día. No puede cambiar el estado de varios funcionarios a la vez (ej. pasar 5 funcionarios a guardia o permiso en un solo paso).
- **Jordan (Usuario Nuevo)**: Se desconcierta al pulsar "Importar" y ver una flecha hacia abajo (Download) creyendo que va a descargar una plantilla. Tampoco sabe si un funcionario sin cargo asignado puede participar en la Orden del Día.
- **Sam (Accesibilidad)**: El contador `Mostrando X de Y personas` no está marcado con `aria-live="polite"`, por lo que los usuarios de lectores de pantalla no se enteran de cuántos resultados quedan al escribir en el buscador.

#### Minor Observations
- El botón de volver atrás en `PersonnelHeader` redirige estáticamente a `/` mediante `<Link to="/">`, perdiendo el contexto de retorno si el usuario vino de `/orden-del-dia` o de `/reporte-final`.
- El campo `Título Académico` se exporta en el CSV pero no está visible como columna opcional en la tabla de escritorio.

#### Questions to Consider
- ¿Deberíamos añadir filtros rápidos por Estado (Activo, Vacaciones, Reposo, Permiso) junto a la barra de búsqueda?
- ¿Te gustaría permitir cambios de estado masivos (ej. marcar a los seleccionados como "Vacaciones" o "Activo") además de solo eliminarlos?
