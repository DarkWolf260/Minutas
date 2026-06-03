# Product

## Register

product

## Users
Funcionarios policiales, personal de seguridad y administradores de guardia en Venezuela. Su contexto habitual incluye turnos nocturnos, ambientes con iluminación variable, uso en dispositivos móviles de gama media/baja sobre el terreno, y la necesidad de redactar reportes oficiales (minutas) de manera rápida y sin errores bajo situaciones de alto estrés o fatiga.

## Product Purpose
Proporcionar una herramienta local, privada y robusta para la generación de minutas y reportes de novedades. Permite la estructuración dinámica de formularios mediante un motor de plantillas de marcado simple, facilitando la exportación de reportes uniformes y la visualización de estadísticas locales (por ejemplo, geolocalización de incidentes en mapas y conteo de tipos de novedades) sin enviar información sensible a servidores externos.

## Brand Personality
Profesional, sobrio, confiable y utilitario. Un tono de "herramienta de trabajo táctica" (táctico, minimalista y directo) que busca inspirar calma, orden, seguridad y máxima eficiencia operativa.

## Anti-references
- Dashboards SaaS modernos con colores pastel, animaciones de rebote excesivas o bordes con degradados decorativos.
- Tarjetas anidadas dentro de tarjetas ("cards inside cards") que reducen la densidad de información.
- Terminología ambigua ("supercharge", "empower") o copias enfocadas en marketing digital en lugar de terminología policial técnica/operativa.
- Flujos de configuración en la nube complejos que distraen del objetivo inmediato de redactar y exportar el reporte.

## Design Principles
1. **Densidad y Claridad Inmediata**: La información operativa (novedades de guardia, personal disponible, estadísticas) debe visualizarse de un vistazo rápido sin scrolled innecesario.
2. **Operación Local-First**: Diseñar asumiendo que la conectividad a internet es intermitente o nula; la UI debe reflejar de forma transparente el estado del almacenamiento local y la sincronización.
3. **Optimización de Entrada**: Los formularios autogenerados a partir de plantillas deben priorizar objetivos de toque (touch targets) claros y selectores rápidos, reduciendo la fatiga del operario.
4. **Privacidad Visible**: Transmitir de forma gráfica y evidente que los datos sensibles no salen del navegador (local storage/base de datos local).

## Accessibility & Inclusion
- Contraste WCAG AA como mínimo absoluto (relación de contraste >= 4.5:1), especialmente crítico para la legibilidad en pantallas con reflejos de luz solar o brillo bajo en patrullas nocturnas.
- Modo oscuro OLED profundo de alto contraste, junto con el "Modo Facebook" (gris neutro no OLED) para mayor adaptabilidad.
- Respetar la preferencia del sistema de movimiento reducido (`prefers-reduced-motion`).
