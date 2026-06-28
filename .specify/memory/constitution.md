# Constitución de Minutas

## Core Principles

### I. Arquitectura Local-First
Minutas es una aplicación local-first por diseño. Todos los datos operativos (novedades, personal, guardias, plantillas) se guardan y procesan en el cliente utilizando bases de datos locales (RxDB / SQLite local). La sincronización con la nube (Supabase) es opcional y debe fallar de forma elegante sin interrumpir el flujo operativo de los funcionarios en condiciones de baja o nula conectividad.

### II. Claridad de Interfaz, Ergonomía y Contraste
La UI debe diseñarse para ser clara, funcional y sin distracciones decorativas. Se prioriza una alta densidad de información, contraste riguroso que cumpla o supere las normas WCAG AAA (para lectura rápida bajo luz solar directa o en cabinas de vehículos de emergencias) y controles ergonómicos aptos para dispositivos móviles de gama media/baja sobre el terreno. Se prohíbe el uso de emojis decorativos, degradados superfluos y estilos complejos que afecten la legibilidad.

### III. Privacidad por Defecto (Privacidad Visible)
Los datos personales e institucionales son sensibles. La interfaz debe comunicar claramente el estado del almacenamiento local y la sincronización. Los datos confidenciales de los incidentes nunca se enviarán a servidores externos a menos que el usuario esté explícitamente autenticado en el entorno de la nube configurado por un administrador.

### IV. Rendimiento en Dispositivos de Gama Baja
La aplicación debe ejecutarse con fluidez en dispositivos móviles antiguos. Se limitarán las animaciones complejas y se respetará de forma estricta la directiva `prefers-reduced-motion`. Las transiciones deben ser instantáneas o no superar los 150ms.

### V. Plantillas de Marcado Dinámico
El sistema de generación de minutas debe basarse en plantillas de marcado simple y extensible, permitiendo estructurar formularios dinámicamente en el cliente y exportar reportes de incidentes de manera estandarizada.

### VI. Principios de Diseño SOLID
Toda la arquitectura del código, la creación de componentes y la lógica del negocio deben seguir estrictamente los principios SOLID para garantizar mantenibilidad, extensibilidad y facilidad de testing:
- **S**ingle Responsibility (Responsabilidad Única): Cada módulo, clase o componente de React debe tener una única responsabilidad.
- **O**pen/Closed (Abierto/Cerrado): El sistema debe estar abierto para la extensión (ej. agregar nuevos tipos de módulos o plantillas) pero cerrado para la modificación de su núcleo.
- **L**iskov Substitution (Sustitución de Liskov): Los tipos y componentes derivados deben poder sustituir a sus bases sin alterar el comportamiento esperado de la app.
- **I**nterface Segregation (Segregación de Interfaces): Se prefieren interfaces o tipos específicos y enfocados (props pequeñas y descriptivas) sobre interfaces monolíticas.
- **D**ependency Inversion (Inversión de Dependencias): Depender de abstracciones (ej. repositorios, proveedores de contexto y hooks abstractos) en lugar de implementaciones concretas para facilitar el testing offline.

---

## Contexto Operativo y Estándares de Protección Civil Venezuela

Toda terminología y formato de reporte debe alinearse con la nomenclatura oficial de Protección Civil y los cuerpos de bomberos/rescatistas en Venezuela (ej. "Minuta de Novedades de Guardia", "Orden del Día", "Reporte Final", "Servicio Ambulatorio", "Efectivos de Guardia"). Los reportes deben estar optimizados para exportación rápida a formatos legibles y compartibles (como formato Word y texto simple optimizado para WhatsApp).

---

## Calidad y Pruebas (Gates de Calidad)

- **Desarrollo Guiado por Especificaciones (SDD):** No se escribirá código sin antes definir la Especificación (`spec.md`), el Plan de Implementación (`plan.md`) y el desglose de tareas (`tasks.md`).
- **Pruebas Unitarias e Integración:** Todo nuevo módulo o cambio en el esquema de base de datos debe ser probado unitariamente. Las pruebas se ejecutan de forma local antes de proponer cambios.
- **Validación de Accesibilidad:** Cada nueva vista de la interfaz debe ser validada para cumplir con el contraste WCAG AA como mínimo absoluto.

---

## Gobernanza

La presente Constitución rige todas las decisiones de diseño y código del proyecto. Cualquier desviación o cambio estructural debe documentarse y ser ratificado modificando este archivo con una nueva versión y justificación detallada.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
