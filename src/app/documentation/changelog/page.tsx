'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground">
    {children}
  </code>
);

export default function ChangelogPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Historial de Cambios</CardTitle>
            <CardDescription>
              Un registro de las nuevas funcionalidades, mejoras y correcciones de errores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">
                Versión 1.7.0 <Badge variant="outline">Actual</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Lanzada hoy, {new Date().toLocaleDateString('es-ES')}.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Mapeo Inteligente (Clave=Valor):</span> Los bloques <Code>{'[?{Campo}] Key=Value [/]'}</Code> ahora definen opciones de menú donde la Clave es para la UI y el Valor es el texto largo que se imprime en el reporte.
                </li>
                <li>
                  <span className="font-semibold">Traducción Automática:</span> Las etiquetas <Code>{'{Campo}'}</Code> ahora usan automáticamente el texto mapeado si existe una coincidencia, permitiendo reportes más limpios y profesionales.
                </li>
                <li>
                  <span className="font-semibold">Bloques "Silenciosos":</span> Se rediseñó el motor para que los bloques de definición de mapeo sean invisibles en el reporte final, eliminando cualquier duplicidad de texto.
                </li>
                <li>
                  <span className="font-semibold">Deduplicación Global:</span> Los campos del formulario ahora se unifican automáticamente a través de múltiples secciones, evitando entradas redundantes y errores de claves duplicadas.
                </li>
                <li>
                  <span className="font-semibold">Separadores Visuales:</span> Soporte para secciones de separación <Code>{'[""]'}</Code> que permiten organizar mejor los formularios extensos.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">
                Versión 1.6.0
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Lanzada el 28/01/2026.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Configuración Multi-rol:</span> Ahora se pueden
                  seleccionar y priorizar múltiples cargos para la etiqueta <Code>{'{Reporta}'}</Code>{' '}
                  en los reportes, permitiendo una inyección de personal más flexible y dinámica.
                </li>
                <li>
                  <span className="font-semibold">Migración RxDB v1:</span> Actualización automática
                  del esquema de configuración para soportar el nuevo sistema multi-rol sin pérdida
                  de datos para el usuario.
                </li>
                <li>
                  <span className="font-semibold">Alineación de Validaciones:</span> Se ajustaron las
                  reglas de validación para los campos de Hora (formato HLV y rangos) y Cédula
                  (formato venezolano), alineando los esquemas Zod con la salida real de los
                  componentes de UI.
                </li>
                <li>
                  <span className="font-semibold">Estabilidad de Renderizado:</span> Se corrigió un
                  error crítico de mutación de datos en el motor de plantillas que impedía previsualizar
                  o generar reportes finales.
                </li>
                <li>
                  <span className="font-semibold">Restauración de "Analista":</span> El campo Analista
                  ha dejado de estar deprecado y vuelve a estar disponible para su uso dinámico en
                  cualquier plantilla.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">Versión 1.5.0</h2>
              <p className="text-sm text-muted-foreground mb-4">Lanzada el 27/01/2026.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Soporte PWA:</span> La aplicación ahora es una
                  Progressive Web App instalable en móviles y escritorio con un icono profesional.
                </li>
                <li>
                  <span className="font-semibold">Persistencia con RxDB:</span> Migración completa
                  de localStorage a RxDB (IndexedDB), permitiendo manejar grandes volúmenes de datos
                  con mayor seguridad y reactividad.
                </li>
                <li>
                  <span className="font-semibold">Modo Offline:</span> Implementación de Service
                  Workers para permitir que la aplicación cargue sin conexión a internet.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">Versión 1.1.0</h2>
              <p className="text-sm text-muted-foreground mb-4">Lanzada el 25/01/2026.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Adaptación Móvil:</span> Refactorización completa
                  de la interfaz para teléfonos y tabletas, incluyendo un nuevo menú lateral y
                  navegación optimizada.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Rediseño del Constructor de
                  Plantillas con doble panel y vista previa interactiva en móviles.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Optimización de tipografía y
                  espaciado global para una interfaz más compacta en dispositivos pequeños.
                </li>
                <li>
                  <span className="font-semibold">Estabilidad:</span> Corrección de errores de
                  ejecución (`TooltipProvider`) y reforzamiento de tipos en toda la aplicación.
                </li>
                <li>
                  <span className="font-semibold">Corrección:</span> Ajuste de diseño en diálogos y
                  tablas para evitar desbordamientos en pantallas estrechas.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">Versión 1.0.0</h2>
              <p className="text-sm text-muted-foreground mb-4">Lanzada el 24/01/2026.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Nueva Funcionalidad:</span> Control de duplicados
                  en personal basado en la Cédula (manual e importación).
                </li>
                <li>
                  <span className="font-semibold">Nueva Funcionalidad:</span> Selección múltiple y
                  borrado masivo de personal con confirmación.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Importador de CSV reforzado
                  (auto-detección de delimitadores, soporte para UTF-8 BOM y diferentes finales de
                  línea).
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Refactorización del almacenamiento
                  local para mayor consistencia y rendimiento.
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Se corrigieron
                  inconsistencias en el guardado rápido de datos de personal.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">Versión 0.9.0</h2>
              <p className="text-sm text-muted-foreground mb-4">Lanzada el 20/01/2026.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Nueva Funcionalidad:</span> Añadida la opción de
                  Cédula opcional para el personal.
                </li>
                <li>
                  <span className="font-semibold">Nueva Funcionalidad:</span> Añadida la pestaña de
                  "Historial de Cambios" a la página de Información.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Se unificó la configuración de las
                  etiquetas <Code>{'{Reporta}'}</Code> y <Code>{'{Analista}'}</Code> en un solo
                  selector en Configuración.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> Las cédulas del personal ahora solo
                  se muestran en las etiquetas <Code>{'{Reporta}'}</Code> y{' '}
                  <Code>{'{Analista}'}</Code> para mantener limpias otras listas.
                </li>
                <li>
                  <span className="font-semibold">Mejora:</span> El sistema ahora es insensible a
                  mayúsculas/minúsculas al reconocer campos de personal en las plantillas (ej.{' '}
                  <Code>{'{Jefe de los servicios}'}</Code>).
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Se solucionó un
                  problema que mostraba `[object Object]` en campos de personal si no se reconocían
                  correctamente.
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> El campo "Jefe de los
                  Servicios" ahora se autocompleta correctamente al crear un nuevo reporte.
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Los menús desplegables
                  (dropdowns) ahora se deshabilitan correctamente cuando un reporte se marca como
                  "Finalizado".
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Se arregló un
                  "parpadeo" que ocurría en los campos de selección de Dirección y Personal al
                  abrirlos.
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Se solucionó un error
                  que impedía que los datos del personal se cargaran correctamente en la pestaña de
                  "Gestión de Personal".
                </li>
                <li>
                  <span className="font-semibold">Corrección de Error:</span> Se corrigió un error
                  de sintaxis en la página de Documentación.
                </li>
              </ul>
            </section>
            <Separator />
            <section>
              <h2 className="text-xl font-semibold mb-3">Versión 0.8.0</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Lanzamiento inicial y desarrollo temprano.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Generador de Novedades a
                  partir de plantillas de texto.
                </li>
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Gestión de Plantillas con
                  editor de configuración.
                </li>
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Generador de Orden del Día y
                  Reporte Final de Guardia.
                </li>
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Configuración de guardias,
                  personal, departamentos y unidades.
                </li>
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Módulo de gestión de
                  Direcciones con mapa interactivo.
                </li>
                <li>
                  <span className="font-semibold">Funcionalidad:</span> Persistencia de todos los
                  datos en el almacenamiento local del navegador.
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
