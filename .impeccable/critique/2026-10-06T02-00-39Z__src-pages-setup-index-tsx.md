---
target: src/pages/setup
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-10-06T02-00-39Z
slug: src-pages-setup-index-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | El contador dice "Paso X de 8", pero el paso 0 y el paso 8 ocultan el indicador. El paso 8 actúa como un noveno paso sorpresa. |
| 2 | Match System / Real World | 3 | La terminología técnica (REDAN, ZOEDAN, Sala de Monitoreo) encaja con el ámbito operativo venezolano. |
| 3 | User Control and Freedom | 2 | "Saltar" solo existe en cabecera mientras hay barra; avanzar en pasos finales activa `finalizar()` y bloquea retroceso natural. |
| 4 | Consistency and Standards | 2 | Se usa `#3575dd` hardcodeado en `09-done.tsx` en vez de tokens; mezcla de radios (`rounded-3xl`, `rounded-2xl`, `rounded-xl`). |
| 5 | Error Prevention | 3 | Presets ("Base" / "Extendido") protegen al usuario de crear estructuras jerárquicas inválidas desde cero. |
| 6 | Recognition Rather Than Recall | 2 | Exige al usuario configurar jerarquías y departamentos complejos antes de haber visto cómo operan las guardias en la app. |
| 7 | Flexibility and Efficiency | 2 | Flujo de 9 pantallas consecutivas; fatiga cognitiva para operadores que necesitan despachar incidencias inmediatamente. |
| 8 | Aesthetic and Minimalist Design | 2 | Paso 7 (Guía estática) duplica el Onboarding Tour real; Paso 8 (Feedback preventivo) interrumpe la activación. |
| 9 | Error Recovery | 3 | Conserva estado en `localStorage` ante recargas y permite retroceder con botón "Atrás" en la mayoría de pasos. |
| 10 | Help and Documentation | 2 | Descripciones muy breves sin previsualizaciones reales del impacto de cada elección en el flujo de trabajo. |
| **Total** | | **23/40** | **Needs Focus (Enfoque y Reducción Requeridos)** |

---

### Anti-Patterns Verdict

- **LLM Assessment**: El asistente sufre de *scaffolding sprawl* (dispersión de pasos). En lugar de un onboarding rápido de un "Terminal Táctico", se siente como una encuesta administrativa de 9 etapas. El cierre del flujo termina en un anticlímax: pedir feedback preventivo sobre errores (`09-done.tsx`) en vez de celebrar la preparación de la estación de trabajo y lanzar el dashboard.
- **Deterministic Scan (`detect.mjs`)**: 0 violaciones detectadas en `src/pages/setup` (código sintácticamente limpio, sin gradient text ni side-stripe borders).
- **Visual Overlays**: No hay servidor de superposición inyectado en ejecución estática; análisis realizado sobre el código fuente y el diseño de componentes.

---

### Overall Impression
El setup tiene una base técnica funcional y respeta la temática de emergencias, pero comete el error clásico de pedir demasiadas decisiones de configuración organizativa antes del primer uso, diluyendo el momento "aha!" en 9 pantallas consecutivas.

---

### What's Working
1. **Presets Estructurales Claros**: La bifurcación entre "Estructura Base" y "Modo Extendido (con Sala de Monitoreo)" en `04-estructura.tsx` simplifica un modelo de datos que de otro modo sería abrumador.
2. **Persistencia Paso a Paso**: `useSetup` desacopla y persiste el progreso en `localStorage` (`minutas-setup-step`), evitando pérdida de datos si el operador recarga el navegador.
3. **Selector Tonal Inmediato**: El switch Claro / Sistema / Oscuro en Preferencias ofrece feedback visual instantáneo.

---

### Priority Issues

#### [P1] Fatiga de Onboarding y Pantallas Redundantes (9 Pasos)
- **Por qué importa**: Los operadores de guardia y paramédicos necesitan agilidad inmediata. Pantallas como el paso 6 ("¿Es tu primera vez?"), el paso 7 ("Guía rápida" con 3 tarjetas estáticas que repiten lo que hace el tour posterior) y el paso 8 ("Tu opinión importa") inflan artificialmente el flujo y aumentan la tasa de abandono o el uso prematuro del botón "Saltar".
- **Solución**: Destilar el flujo a **3 o 4 pasos esenciales**:
  1. *Bienvenida + Preferencias regionales* (Tema + Municipio/Estado/REDAN).
  2. *Módulos y Modo de Operación* (Escritorio vs. Móvil).
  3. *Estructura* (Preset Base vs. Extendido).
  4. *¡Estación Lista!* (Botón de acción principal directo a Iniciar Guardia o Crear Plantilla).
- **Comando sugerido**: `/impeccable distill src/pages/setup`

#### [P1] Trampa de Scroll Anidado con `StructureManager` en Contenedor Móvil
- **Por qué importa**: Los pasos 4 (`04-estructura.tsx`) y 5 (`05-jerarquia.tsx`) incrustan el componente completo `StructureManager` dentro del contenedor estrecho `max-w-lg` del wizard. Este componente tiene drag-and-drop, pestañas, modales y acordeones propios, generando dobles barras de desplazamiento y colisión táctil en pantallas móviles o tablets.
- **Solución**: Reemplazar la edición exhaustiva en el wizard por tarjetas de presets con vista previa simplificada. Añadir una llamada de atención: *"Podrás afinar cargos y departamentos individuales en cualquier momento desde Personal"*.
- **Comando sugerido**: `/impeccable layout src/pages/setup`

#### [P1] Violación de la Regla "Peak-End" (Culminación con Pantalla de Feedback)
- **Por qué importa**: El paso final (`09-done.tsx`) es una solicitud preventiva de reporte de errores (*"¡Tu opinión importa! Si encuentras algún error..."*). Terminar el setup así transmite desconfianza técnica y rompe la emoción de iniciar turno. El usuario aún no ha creado su primera minuta.
- **Solución**: Reemplazar `PasoDone` por una pantalla de **Lanzamiento y Victoria**: resumen rápido de la estación configurada, botón primario destacado *"Comenzar Turno"* y enlace secundario *"Ver Plantillas"*. Mover el feedback a la barra lateral / Configuración.
- **Comando sugerido**: `/impeccable onboard src/pages/setup`

#### [P2] Código Muerto e Inconsistencia en Contador de Pasos
- **Por qué importa**: `PasoAreaTrabajo` (`01-area-trabajo.tsx`) está importado pero nunca se ejecuta en `index.tsx` (se salta del paso 0 al 2 directamente). Asimismo, `TOTAL_PUNTOS = 8` no concuerda con la experiencia de navegación del usuario.
- **Solución**: Eliminar las referencias obsoletas a `PasoAreaTrabajo` y sincronizar dinámicamente el indicador de pasos con la longitud real del flujo.
- **Comando sugerido**: `/impeccable harden src/pages/setup`

#### [P2] Colores Hexadecimales Hardcodeados y Radios Desalineados
- **Por qué importa**: `09-done.tsx` usa `style={{ backgroundColor: '#3575dd' }}`, ignorando el color primario Tactical Cobalt (`#1d4ed8` / `bg-primary`) definido en `DESIGN.md`. Además, conviven radios dispares (`rounded-3xl` en iconos, `rounded-2xl` en tarjetas, `rounded-lg` en botones).
- **Solución**: Migrar todos los estilos inline a clases de diseño de Tailwind (`bg-primary`, `rounded-2xl` para contenedores y `rounded-md` para controles interactivos).
- **Comando sugerido**: `/impeccable polish src/pages/setup`

---

### Persona Red Flags

- **Elena (Comandante de Guardia / Supervisora)**:
  - *Frustración*: Debe configurar el sistema con prisa al iniciar la guardia de 48 horas. Al llegar al paso 4, se encuentra con una tabla completa de drag-and-drop de jerarquías dentro de una ventana angosta; no sabe qué cargos necesitará exactamente hasta que empiece a cargar personal.
  - *Riesgo*: Presiona "Saltar" y deja el sistema sin configurar o con datos inconsistentes.

- **Carlos (Operador de Despacho / Primera Vez)**:
  - *Frustración*: Pasa por el paso 6 ("¿Es tu primera vez?"), luego lee el paso 7 ("Guía rápida" estática) y al entrar al sistema se le dispara un *tercer* tour interactivo. La redundancia le resulta molesta y genera desinterés.
  - *Riesgo*: Cierra las guías sin leerlas por saturación informativa.

---

### Minor Observations
- En `00-bienvenida.tsx`, el icono de la app usa un `padding` y `shadow-2xl` excesivo sobre fondo blanco que choca visualmente en modo oscuro si el PNG tiene transparencia o fondo disonante.
- En `03-modulos.tsx`, los presets de "Escritorio" vs "Móvil" desactivan 'estadísticas' y 'plantillas' sin explicar que estos módulos siguen siendo accesibles si se necesitan.

---

### Questions to Consider
1. *¿Realmente un usuario necesita configurar la jerarquía de cargos en el onboarding inicial, o basta con que elija su tipo de unidad (Bomberos, Protección Civil, Ambulancias) y lo ajuste después?*
2. *¿Por qué pedir feedback antes de que el usuario haya interactuado con su primera guardia?*
3. *¿Qué pasaría si el setup se redujera a solo 60 segundos de configuración (Estilo Tactical Terminal)?*
