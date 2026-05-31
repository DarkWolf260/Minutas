# Historial de Cambios - Minutas

## [1.8.1] - 2026-05-31

### Añadido
- **Selector Rápido de Chats de WhatsApp**: Se agregó un botón interactivo y premium justo encima del icono de la campana en la barra de navegación (lateral y móvil) que permite elegir y sincronizar rápidamente los chats y grupos destinatarios de los reportes.
- **Modificador "hidden" en Plantillas**: Implementación del modificador `hidden` (`{campo:hidden}`) para evitar que las etiquetas se rendericen en el reporte final mientras conservan toda su funcionalidad interactiva dentro del formulario de novedades.

---

## [1.8.0] - 2026-05-29

### Añadido
- **Soporte Inicial de Imágenes en Reportes**: Primera implementación del sistema de fotos y evidencias fotográficas. Las imágenes adjuntas se guardan localmente de forma instantánea y se sincronizan automáticamente con la nube.
- **Editor de Imágenes Integrado**: Cada foto adjunta puede editarse directamente en la aplicación sin herramientas externas. Incluye:
  - **Pincel de anotación**: Dibuja sobre la imagen con colores personalizados para resaltar detalles importantes.
  - **Pixelado de privacidad**: Cubre áreas de la imagen con un mosaico para ocultar rostros o datos sensibles.
  - **Deshacer cambios**: Revierte los últimos pasos de edición uno a uno.
  - **Zoom y desplazamiento**: Amplía con la rueda del mouse o los botones y mueve la imagen con la herramienta de mano para editar con precisión.
  - **Recorte**: Selecciona el área de interés con guías visuales y aplica el recorte al instante.
- **Envío de Fotos por WhatsApp**: Las imágenes adjuntas se envían automáticamente junto con la minuta, tanto en envíos inmediatos como en mensajes programados.
- **Activación de Fotos por Plantilla**: Las plantillas pueden incluir la etiqueta `{photos}` para habilitar la sección de carga de imágenes en las novedades que lo requieran. Si una plantilla no la incluye, el formulario permanece sin la sección de imágenes.

### Cambiado
- **Formulario de Novedades**: Cuando la plantilla lo indica con `{photos}`, aparece una sección de galería fotográfica al final del formulario.

---

## [1.7.5] - 2026-05-24

### Añadido
- **Nuevo Botón de "Apoyo Institucional" en los Reportes**: Ahora puedes marcar un reporte como apoyo directamente en el formulario con la etiqueta `{apoyo_ins}`. Esto colocará el texto "(Apoyo institucional)" de forma automática en la minuta, sumará 1 punto en las estadísticas de apoyos institucionales y aplicará las reglas de descarte seleccionadas.
- **Control Total de Estadísticas**: En el editor de plantillas ahora puedes decidir con precisión qué estadísticas apagar cuando el Apoyo Institucional esté encendido. Puedes apagar la estadística principal, subcategorías individuales ("Omitir Apoyo") o decidir regla por regla cuál ignorar ("Omitir por Apoyo").
- **Guardado y Sincronización en la Nube Mejorados**: Diseñamos un sistema inteligente que guarda tus preferencias de estadísticas de manera invisible dentro de la plantilla. Tus configuraciones se guardan al instante y se sincronizan perfectamente en todos tus dispositivos y computadoras.
- **Diseño Visual Moderno**: Renovamos el estilo visual con hermosos botones de selección (Switches) y una atractiva píldora de color naranja translúcido con animación suave en el formulario de reportes.

---

## [1.6.5] - 2026-05-18

### Añadido
- **Programación de Mensajes de WhatsApp**: Ahora se pueden programar reportes para ser enviados automáticamente a una hora específica.
- **Barra de Búsqueda de Plantillas**: Se añadió un buscador en la lista de selección de plantillas al crear una nueva novedad.
- **Botón de Estadísticas en Formulario**: El campo "Estadísticas" incluye un botón para calcular el resumen numérico del día automáticamente.

### Cambiado
- **Optimización de Rendimiento**: Se eliminó el lag al escribir en el campo de estadísticas mediante consultas imperativas.
- **Simplificación de Mensajes Programados**: Se reemplazó el calendario completo por un selector nativo y se redujo la lista a título y hora.

---

## [1.6.0] - 2026-05-17

### Añadido
- **Integración con WhatsApp**: Sistema de envío automático de reportes a través de un bot local de WhatsApp Web.
- **Soporte Multi-Chat**: Posibilidad de seleccionar hasta 5 chats o grupos destino para el envío simultáneo de reportes.
- **Control de Límites**: Diálogo de advertencia personalizado para evitar exceder el límite de 5 chats y proteger la cuenta de bloqueos.
- **Script de Inicio Rápido**: Archivo `iniciar-bot.bat` para ejecutar el bot de WhatsApp con un solo doble clic en Windows.
- **Diseño Premium**: Módulo de WhatsApp con avatares, barra de búsqueda y estados animados.
- **Botón de Enviar**: Integración del logo oficial de WhatsApp en el botón de acción.

---

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
