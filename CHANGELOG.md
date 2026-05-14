# Historial de Cambios - Minutas

## [1.5.0] - 2026-05-14

### Añadido
- **Exportación Masiva a Word**: Implementación oficial del sistema de generación de documentos (.docx) que permite consolidar todas las novedades en un solo archivo profesional y formateado.
- **Confirmación de Seguridad**: Se agregó un diálogo de confirmación antes de exportar todas las novedades para evitar descargas accidentales.
- **Soporte para Secciones**: Se habilitó la persistencia y sincronización del campo `sections` en los reportes (RxDB y Supabase).

### Cambiado
- **Sincronización Automática**: Los reportes marcados como "Finalizados" desde dispositivos secundarios se sincronizan instantáneamente con la nube.
- **Nombre de Exportación**: El archivo Word ahora utiliza una nomenclatura estandarizada: `Minutas DD.MM.AAAA`.
- **Lógica de Renderizado**: Se corrigió la precedencia de datos para asegurar que los reportes finalizados siempre muestren el estatus y anotaciones correctas en el Word.

### Corregido
- **Estabilidad de Datos**: Resueltos los problemas de desajuste de esquema (DB6) y optimizada la lectura de configuraciones globales (snake_case/camelCase).

---

## [1.4.0] - 2026-05-13

### Añadido
- **Selector de Fecha Inteligente**: Se implementó un selector de calendario en la Orden del Día que genera automáticamente el rango de guardia (DD/MM/YYYY AL DD/MM/YYYY).

### Cambiado
- **Estética del Calendario Refinada**: Nuevo diseño de selección con bordes redondeados (rounded-xl) y alineación corregida en flechas de navegación para evitar solapamientos.
- **Estandarización de Versiones**: Se centralizó el control de versión en el módulo "Acerca de", eliminando la gestión redundante desde el panel de administración.
- **Visibilidad de Sistema**: El indicador de versión en la esquina inferior ahora es más legible con fondo desenfocado y mayor contraste en modo claro.

---

## [1.3.2] - 2026-05-11

### Cambiado
- **Migración de Datos Estabilizada**: Se corrigieron los errores de desajuste de esquema en la base de datos local para una persistencia más confiable.
- **Motor de Plantillas Refinado**: Mejoras significativas en el renderizado de secciones anidadas y lógica condicional para reportes más complejos.

### Corregido
- **Setup Wizard**: Corregido el error de pantalla en blanco al finalizar o saltar la configuración inicial, asegurando el acceso inmediato a la app.
- **Estabilidad del Código**: Resolución de conflictos de tipado y errores en la suite de pruebas tras la estandarización a snake_case.

---

## [1.3.1] - 2026-04-28

### Cambiado
- **Mayor Estabilidad del Sistema**: Reorganización interna de la lógica de la Orden del Día y el Reporte Final para una aplicación más robusta.
- **Navegación más Fluida**: Se optimizó el acceso a los datos internos, eliminando esperas innecesarias al abrir o guardar información.
- **Lectura de Reportes Mejorada**: Cuadros de texto con scroll suave y diseño uniforme para mayor comodidad.
- **Experiencia Móvil Optimizada**: Panel inferior más fácil de manejar y botones de cerrar más claros en dispositivos móviles.

### Corregido
- **Correcciones Visuales**: Solucionados errores visuales y de carga que aparecían tras realizar mejoras internas.
- **Orden Cronológico**: Las novedades en el reporte final ahora siempre aparecerán en el orden exacto en que ocurrieron.

---

## [1.3.0] - 2026-04-28

### Añadido
- **Rebranding oficial**: La aplicación ha sido renombrada a "Minutas", unificando la identidad en todas las plataformas.
- **Sincronización QR Premium**: Rediseño total del sistema de vinculación con escaneo de alta precisión y QR siempre visible.
- **Catálogo Cloud 2.0**: Descarga de plantillas de la comunidad con un solo click y etiquetas PRO.

### Cambiado
- **Refactorización Arquitectónica**: Aplicación de principios SOLID en el módulo de Novedades para mejorar la mantenibilidad.
- **Experiencia Móvil Refinada**: Los diálogos ahora se comportan como paneles inferiores (Sheets) para uso con una sola mano.
- **UI Estilizada**: Mejoras visuales en cabeceras, botones y tarjetas con un enfoque más moderno.

### Corregido
- **Escaneo QR**: Solucionado el problema de la pantalla negra al escanear QR en dispositivos móviles antiguos.

---

## [1.2.0] - 2026-04-24

### Añadido
- **Suma inteligente de cantidades**: Configuración de plantillas para sumar números específicos (ej. total de heridos) en las estadísticas.
- **Cálculo automático**: Nuevo botón que genera al instante el cuadro estadístico del día para el reporte final.
- **Módulo de Estadísticas**: El panel de métricas ya es oficial y activable desde ajustes.

### Cambiado
- **Reportes más limpios**: Estadísticas con formato de texto elegante y profesional.
- **Organización Visual**: Sub-categorías con sangría automática para facilitar la lectura.
- **Reglas Estadísticas**: Nuevas opciones de filtrado (mayor que, menor que, prefijos, sufijos).
- **Buscador de Categorías**: Selector de estadísticas más estable y fácil de usar.

### Corregido
- **Guardado de Plantillas**: Solucionados errores al guardar reglas estadísticas avanzadas.

---

## [1.1.1] - 2026-04-23

### Cambiado
- **Arquitectura de Componentes**: Mayor orden en carpetas layout, common, providers y ui/custom.
- **Animaciones ultra-rápidas**: Tiempos de respuesta de 100ms - 200ms para una navegación fluida.
- **Gestión de Capas (z-index)**: Estandarización de la profundidad de diálogos y fondos.
- **Scroll Inteligente**: Los modales adaptan su contenido y no bloquean los botones de acción.
- **Gestión de Unidades**: Tarjeta refinada con skeletons y diseño unificado.

### Corregido
- **Asistente de Configuración**: Eliminados artefactos visuales al hacer scroll.

---

## [1.1.0] - 2026-04-23

### Añadido
- **Gestión de Módulos**: Nueva página en ajustes para activar o desactivar secciones de la app.
- **Tipo de campo Cédula**: Renderizado de input con formato automático de cédula venezolana.
- **Scroll Radix**: Implementado en el dropdown del multi-input y en ajustes generales.

### Cambiado
- **Búsqueda Inteligente**: Búsqueda insensible a mayúsculas y acentos en personal y direcciones.
- **Exclusión de Personal**: Los módulos desactivados ya no incluyen su personal en los reportes automáticos.

### Corregido
- **Campos del Sistema**: Ocultos en el formulario principal (Estatus, Encargado, etc).
- **Inputs de Personal**: Corregido error que borraba valores al presionar Enter.

---

## [1.0.1] - 2026-04-22

### Añadido
- **Onboarding de 7 pasos**: Flujo de configuración inicial en pantalla completa.
- **Selector de Tema**: Soporte para Claro, Oscuro y Sistema durante el inicio.
- **Guía de Primeros Pasos**: Integrada en el onboarding y sección Acerca de.
- **Historial de Cambios**: Sección oficial para el seguimiento de versiones.

### Cambiado
- **Reporte de Cierre**: Inclusión de todos los reportes de la guardia sin filtros restrictivos de horario.
- **Preferencia de Datos**: Director y Jefe de Operaciones toman valores exclusivamente de la Orden del Día.

### Corregido
- **Errores Visuales**: Corregido z-index en dropdowns del onboarding.
- **RxDB Conflicts**: Solucionados errores al iniciar con workspaces existentes.

---

## [1.0.0] - 2026-04-07

### Añadido
- **Lanzamiento inicial de Minutas**.
- **Módulos principales**: Novedades, Orden del Día, Personal, Plantillas, Reporte Final, Estadísticas.
- **Sistema de Plantillas**: Campos condicionales y personalización total.
- **Sincronización Cloud**: Integración con Supabase Realtime para multi-dispositivo.
- **Soporte PWA**: Aplicación instalable con soporte offline.
- **Multi-Workspace**: Gestión de múltiples áreas de trabajo independientes.
