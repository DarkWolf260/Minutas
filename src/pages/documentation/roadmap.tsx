'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground">
    {children}
  </code>
);

const CompletedItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <CheckSquare className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-500" />
    <span className="flex-1">{children}</span>
  </li>
);

const PendingItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <Square className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
    <span className="flex-1">{children}</span>
  </li>
);

export default function RoadmapPage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Hoja de Ruta de la Aplicación</CardTitle>
            <CardDescription>
              Un vistazo a lo que ya hemos construido y lo que está por venir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                ✅ Funcionalidades Actuales (Completado)
              </h2>
              <ul className="space-y-3">
                <CompletedItem>
                  <span className="font-semibold">Generador de Novedades:</span> Creación de
                  reportes a partir de plantillas personalizadas.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Gestión de Plantillas:</span> Subida y
                  configuración de plantillas de texto (`.txt`) con campos dinámicos.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Editor de Formularios:</span> Personalización de
                  tipos de campo, secciones y orden en los formularios.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Generador de Orden del Día:</span> Creación rápida
                  del reporte de orden del día basado en el personal de guardia.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Generador de Reporte Final:</span> Consolidación
                  de todas las novedades del día en un reporte de cierre.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Configuración General y de Personal:</span>{' '}
                  Almacenamiento de datos del municipio, directivos y personal de cada guardia (con
                  cédula opcional).
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Etiquetas Dinámicas Configurables:</span>{' '}
                  Selección del cargo para las etiquetas <Code>{'{Reporta}'}</Code> y{' '}
                  <Code>{'{Analista}'}</Code> desde Configuración.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Persistencia Avanzada con RxDB:</span> Migración
                  exitosa de localStorage a una base de datos local robusta (IndexedDB) para mayor
                  rendimiento.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Configuración de Reportes Multi-rol:</span>{' '}
                  Posibilidad de seleccionar múltiples cargos y definir su prioridad para las
                  etiquetas dinámicas.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Migración de Base de Datos (RxDB v1):</span>{' '}
                  Esquemas de datos actualizados y sistema de migración automática operativo.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Motor de Plantillas Refactorizado:</span> Nueva
                  arquitectura modular (Lexer-Parser) con sintaxis extendida para condicionales.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Soporte PWA e Instalación:</span> Aplicación
                  instalable en cualquier dispositivo con icono propio y experiencia de app nativa.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Modo Offline 100% Funcional:</span> La interfaz y
                  los datos están disponibles totalmente sin conexión a internet.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Adaptación Móvil Completa:</span> Interfaz
                  optimizada para teléfonos y tablets con menús colapsables y diseño responsivo.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Control de Duplicados y Acciones Masivas:</span>{' '}
                  Prevención de registros duplicados por Cédula y herramientas de borrado en lote.
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Importación CSV Avanzada:</span> Soporte robusto
                  para diferentes formatos de archivo y codificaciones (UTF-8 BOM).
                </CompletedItem>
                <CompletedItem>
                  <span className="font-semibold">Modo Oscuro:</span> Una opción de tema oscuro para
                  la interfaz.
                </CompletedItem>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🚀 Próximas Mejoras (En Desarrollo / Planificado)
              </h2>
              <ul className="space-y-3">
                <PendingItem>
                  <span className="font-semibold">Dashboard de Estadísticas:</span> Visualización de
                  datos clave con gráficos (ej. número de novedades por tipo, tiempos de respuesta)
                  y filtros avanzados.
                  <Badge variant="secondary" className="ml-2">
                    Estadísticas
                  </Badge>
                </PendingItem>
                <PendingItem>
                  <span className="font-semibold">Mejoras en el Editor de Plantillas:</span>{' '}
                  Permitir más tipos de campos (listas desplegables, checkboxes) y validaciones.
                </PendingItem>
                <PendingItem>
                  Cifrado AES-256 implementado
                  <Badge variant="secondary" className="ml-2">
                    Seguridad
                  </Badge>
                </PendingItem>
                <PendingItem>
                  Documentos legales publicados
                  <Badge variant="secondary" className="ml-2">
                    Legal
                  </Badge>
                </PendingItem>
                <PendingItem>
                  Manual de seguridad aprobado
                  <Badge variant="secondary" className="ml-2">
                    Documentación
                  </Badge>
                </PendingItem>
                <PendingItem>
                  Sistema de respaldos operativo
                  <Badge variant="secondary" className="ml-2">
                    Infraestructura
                  </Badge>
                </PendingItem>
                <PendingItem>
                  Auditoría inicial de seguridad
                  <Badge variant="secondary" className="ml-2">
                    Seguridad
                  </Badge>
                </PendingItem>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                💡 Ideas a Futuro
              </h2>
              <ul className="space-y-3">
                <PendingItem>
                  <span className="font-semibold">Notificaciones:</span> Sistema de alertas para
                  novedades importantes o recordatorios.
                </PendingItem>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
      </div>
    </ScrollArea>
  );
}
