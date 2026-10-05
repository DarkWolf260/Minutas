---
timestamp: 2026-10-05T18-58-05Z
slug: src-pages-orden-del-dia-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No hay indicador de autoguardado o estado de borrador ("Borrador guardado"); el badge `animate-pulse` vibra sin cesar. |
| 2 | Match System / Real World | 3 | El icono del "Ojo" (`Eye`) para "Generar Orden" confunde "Previsualizar" con "Compilar/Generar reporte final". |
| 3 | User Control and Freedom | 3 | Se pueden restaurar actividades/notas predeterminadas, pero no hay botón "Deshacer" al eliminar ítems individuales. |
| 4 | Consistency and Standards | 3 | `GuardConfigCard` cambia de tamaño y estructura según si hay o no guardia elegida, alterando el flujo visual. |
| 5 | Error Prevention | 2 | La eliminación de notas, actividades u oficiales es instantánea con un clic en la papelera; sin confirmación ni toast con deshacer. |
| 6 | Recognition Rather Than Recall | 2 | `AddActivityForm` monopoliza el alto de la tarjeta, ocultando la lista de actividades previas y obligando a hacer scroll continuo. |
| 7 | Flexibility and Efficiency | 2 | Hay arrastre (`dnd-kit`) para personal, pero faltan atajos de teclado clave (`Ctrl+Enter` para añadir actividad, `Esc` para cancelar edición). |
| 8 | Aesthetic and Minimalist Design | 3 | Diseño limpio con tarjetas shadcn/ui, pero la columna de personal queda excesivamente angosta y saturada en monitores estándar. |
| 9 | Error Recovery | 2 | Si faltan campos requeridos en la actividad (texto o fecha/hora), el botón "Añadir" queda deshabilitado en silencio sin mensaje de ayuda. |
| 10 | Help and Documentation | 2 | Sin tooltips ni guía contextual sobre cómo la orden diaria alimenta la Minuta o el Reporte Final. |
| **Total** | | **24/40** | **Acceptable** |

#### Anti-Patterns Verdict

- **LLM assessment**: La interfaz no cae en los clichés comunes de IA (no hay gradientes de texto ni tarjetas de vidrio gratuitas). Sin embargo, sufre de **saturación vertical y asimetría de layout**: colocar toda la jerarquía de cargos y personal (que puede contener decenas de oficiales con observaciones) en una sola columna angosta de 1/3, mientras la configuración de la guardia y las notas comparten los otros 2/3, genera una asimetría que sobrecarga la columna izquierda y deja huecos o desproporciones a la derecha. Además, el formulario para añadir actividades está incrustado permanentemente arriba de la lista ocupando más de 200px fijos.
- **Deterministic scan**: El escáner determinista (`detect.mjs`) no encontró infracciones estructurales (`0 violations`).
- **Visual overlays**: Entorno browser subagent sin CDP port disponible en este entorno; se realizó auditoría completa mediante inspección estática y semántica del árbol de componentes.

#### Overall Impression
La Orden del Día es un módulo central altamente funcional que resuelve bien el dominio policial/militar (roles, HLV, cargos, encargado E, periodos). Sin embargo, se siente como un conjunto de formularios técnicos apiñados en lugar de una mesa de despacho ágil: falta respiración entre personal y actividades, los formularios fijos roban espacio a las listas, y faltan salvaguardas (undo en borrado rápido) y atajos de teclado para operaciones bajo presión de tiempo.

#### What's Working
1. **Arrastre fluido de personal con Dnd-Kit**: La posibilidad de reasignar miembros entre cargos mediante drag-and-drop con overlay translúcido es una interacción premium muy útil para reorganizar la guardia.
2. **Selector de Guardias y fechas integrado con bloqueo inteligente**: Cuando una guardia está abierta, los selectores se deshabilitan para proteger la integridad operativa de los datos.
3. **Opciones de texto libre para personal**: Permite escribir un oficial eventual sin obligar a registrarlo primero en la base de datos general de Personal.

#### Priority Issues

- **[P1] Formulario de actividad fijo satura la tarjeta y oculta el historial**:
  - *Why it matters*: `AddActivityForm` ocupa más del 50% de la tarjeta de Actividades con DatePicker, TimeInput y un Textarea fijo (`h-28`). En pantallas de laptop, el operador solo ve 1 o 2 actividades anteriores y debe hacer scroll constante.
  - *Fix*: Convertir la adición de actividad en un acordeón/colapsable expandible o un formulario en línea compacto, o moverlo a un botón "+ Añadir Actividad" que despliegue el formulario solo cuando se requiera.
  - *Suggested command*: `/impeccable layout` o `/impeccable distill`

- **[P1] Eliminación destructiva sin confirmación ni deshacer**:
  - *Why it matters*: Al hacer clic en el icono de papelera en una actividad, nota o miembro del personal, el ítem se elimina de inmediato de la orden. Un clic accidental durante el scroll elimina datos operativos sin posibilidad de recuperación.
  - *Fix*: Implementar un toast con acción "Deshacer" (`toast.success("Actividad eliminada", { action: { label: "Deshacer", onClick: ... } })`) o un diálogo de confirmación para bajas accidentales.
  - *Suggested command*: `/impeccable harden`

- **[P1] Asimetría de columnas y saturación en Distribución de Personal**:
  - *Why it matters*: La columna de personal está restringida a `xl:col-span-1`. Con 6-10 roles y múltiples oficiales por rol (cada uno con jerarquía, nombre, cédula y campo de observación), el scrollbar se vuelve kilométrico mientras las columnas de actividades y notas a menudo quedan semi-vacías.
  - *Fix*: Rebalancear el grid: permitir pestañas ("Personal" vs "Operaciones / Actividades y Notas") o un layout donde la distribución de personal aproveche un ancho mayor (2 columnas internas o vista tipo tablero kanban de roles).
  - *Suggested command*: `/impeccable layout`

- **[P2] Metáfora confusa del botón "Generar Orden" (Icono de Ojo)**:
  - *Why it matters*: El botón de acción principal en el header y en el botón flotante móvil utiliza el icono `Eye` (Ojo), que convencionalmente denota "Ver", "Mostrar contraseña" o "Vista previa". El usuario duda si al hacer clic se emitirá la orden, se guardará o solo se mirará.
  - *Fix*: Reemplazar `Eye` por `Sparkles`, `FileText` o `Printer`/`Share2`, y en el modal resultante dar opciones claras de "Copiar texto", "Exportar a PDF" y "Cerrar".
  - *Suggested command*: `/impeccable clarify`

- **[P2] Falta de aceleradores de teclado (`Ctrl+Enter`, `Esc`)**:
  - *Why it matters*: Un analista en sala de monitoreo suele transcribir múltiples novedades consecutivas. Tener que levantar la mano del teclado para cliquear "Añadir" cada vez ralentiza la guardia significativamente.
  - *Fix*: Escuchar `Ctrl+Enter` en el textarea para enviar la actividad y `Esc` para cancelar la edición.
  - *Suggested command*: `/impeccable polish`

#### Persona Red Flags

- **Alex (Power User / Supervisor de Guardia)**:
  - *Red Flag*: No puede pulsar `Ctrl+Enter` para guardar una actividad tras redactarla; está forzado a usar el mouse para cliquear "Añadir". Al eliminar una nota con la papelera, no hay deshacer. Pierde tiempo en cada ronda de guardia.
- **Jordan (First-Timer / Analista Nuevo)**:
  - *Red Flag*: Entra a la página y ve una tarjeta gigante "Esperando Selección" con un candado gris. No entiende si le faltan permisos de administrador o si simplemente debe seleccionar una guardia arriba. El icono `Eye` no le deja claro si al pulsarlo se envía algo irreversible.
- **Sam (Accessibility / Teclado)**:
  - *Red Flag*: La reordenación de personal solo es usable con arrastre de ratón (`DndContext` con sensor pointer); no hay botones accesibles de "Subir / Bajar jerarquía" por teclado para usuarios de lector de pantalla o navegación por tabs.

#### Minor Observations
- El badge "Guardia Activa" tiene `animate-pulse` infinito, lo que distrae la atención periférica del usuario constantemente.
- Las notas administrativas usan tipografía monoespaciada rígida (`font-mono text-xs`) en un textarea de una sola línea que no se expande suavemente al escribir notas largas.
- Si no hay guardias creadas en la base de datos, el botón de "Configurar Guardias en Personal" está en el centro, pero el selector superior sigue mostrando "Selecciona una guardia..." deshabilitado sin explicar el motivo.

#### Questions to Consider
- ¿Debería la Orden del Día funcionar como un flujo guiado en 2 pasos (1. Confirmar personal de guardia -> 2. Cargar actividades y notas) o mantener todo visible en una sola pantalla?
- ¿Podría la adición de actividades abrirse en un panel rápido o diálogo emergente para que la lista de actividades sea la protagonista visual?
- ¿Qué tan útil sería permitir importar automáticamente las actividades de la guardia anterior como borrador inicial?
