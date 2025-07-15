
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from "lucide-react";

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
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
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
                                    <span className="font-semibold">Generador de Novedades:</span> Creación de reportes a partir de plantillas personalizadas.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Gestión de Plantillas:</span> Subida y configuración de plantillas de texto (`.txt`) con campos dinámicos.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Editor de Formularios:</span> Personalización de tipos de campo, secciones y orden en los formularios.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Generador de Orden del Día:</span> Creación rápida del reporte de orden del día basado en el personal de guardia.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Generador de Reporte Final:</span> Consolidación de todas las novedades del día en un reporte de cierre.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Configuración General y de Personal:</span> Almacenamiento de datos del municipio, directivos y personal de cada guardia (con cédula opcional).
                                </CompletedItem>
                                 <CompletedItem>
                                    <span className="font-semibold">Etiquetas Dinámicas Configurables:</span> Selección del cargo para las etiquetas <Code>{'{Reporta}'}</Code> y <Code>{'{Analista}'}</Code> desde Configuración.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Persistencia de Datos:</span> Toda la información se guarda localmente en el navegador (`localStorage`).
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Interfaz Adaptable:</span> Diseño responsivo que se ajusta a diferentes tamaños de pantalla.
                                </CompletedItem>
                                <CompletedItem>
                                    <span className="font-semibold">Modo Oscuro:</span> Una opción de tema oscuro para la interfaz.
                                </CompletedItem>
                            </ul>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                🚀 Próximas Mejoras (En Desarrollo / Planificado)
                            </h2>
                            <ul className="space-y-3">
                                <PendingItem>
                                    <span className="font-semibold">Dashboard de Estadísticas:</span> Visualización de datos clave con gráficos (ej. número de novedades por tipo, tiempos de respuesta) y filtros avanzados.
                                    <Badge variant="secondary" className="ml-2">Estadísticas</Badge>
                                </PendingItem>
                                <PendingItem>
                                    <span className="font-semibold">Mejoras en el Editor de Plantillas:</span> Permitir más tipos de campos (listas desplegables, checkboxes) y validaciones.
                                </PendingItem>
                                <PendingItem>
                                    Certificado SUSCERTE
                                    <Badge variant="secondary" className="ml-2">Seguridad</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Hosting nacional contratado
                                    <Badge variant="secondary" className="ml-2">Infraestructura</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Cifrado AES-256 implementado
                                    <Badge variant="secondary" className="ml-2">Seguridad</Badge>
                                </PendingItem>
                                <PendingItem>
                                    2FA obligatorio para personal
                                    <Badge variant="secondary" className="ml-2">Seguridad</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Documentos legales publicados
                                    <Badge variant="secondary" className="ml-2">Legal</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Manual de seguridad aprobado
                                    <Badge variant="secondary" className="ml-2">Documentación</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Sistema de respaldos operativo
                                    <Badge variant="secondary" className="ml-2">Infraestructura</Badge>
                                </PendingItem>
                                <PendingItem>
                                    Auditoría inicial de seguridad
                                    <Badge variant="secondary" className="ml-2">Seguridad</Badge>
                                </PendingItem>
                            </ul>
                        </section>
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                💡 Ideas a Futuro
                            </h2>
                            <ul className="space-y-3">
                                <PendingItem>
                                    <div>
                                        <span className="font-semibold">Sistema de Reportes Multi-Nivel:</span> Implementar un flujo de trabajo jerárquico para la creación, revisión y consolidación de reportes.
                                        <Badge variant="secondary" className="ml-2">Arquitectura</Badge>

                                        <p className="font-semibold text-card-foreground mt-4 mb-2">Fases de Desarrollo Propuestas:</p>

                                        <ol className="list-decimal list-inside space-y-4 text-sm text-muted-foreground">
                                            <li>
                                                <span className="font-semibold text-card-foreground">Fase 1: Cimientos y Autenticación</span>
                                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                                    <li>Desarrollo del sistema de autenticación de usuarios y gestión de roles (Operador, Supervisor, Administrador).</li>
                                                    <li>Implementación de una base de datos centralizada para reemplazar `localStorage`.</li>
                                                    <li>Definición de la estructura de datos para soportar los diferentes niveles y estados de los reportes.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <span className="font-semibold text-card-foreground">Fase 2: Flujo de Trabajo del Operador (Nivel Municipal)</span>
                                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                                    <li>Adaptación de la vista de creación de reportes actual.</li>
                                                    <li>Componente para subir evidencia (imágenes, documentos).</li>
                                                    <li>Desarrollo de la vista "Mis Reportes" con sus estados (Borrador, Enviado, Aprobado, Rechazado).</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <span className="font-semibold text-card-foreground">Fase 3: Flujo de Trabajo del Supervisor (Nivel Estadal)</span>
                                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                                    <li>Creación del Dashboard del Supervisor para ver reportes pendientes de su región.</li>
                                                    <li>Desarrollo del componente visualizador de reportes para revisión, con opciones para Aprobar/Rechazar.</li>
                                                    <li>Implementación del sistema de notificaciones para comunicar el estado de los reportes al nivel municipal.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <span className="font-semibold text-card-foreground">Fase 4: Dashboard y Estadísticas (Nivel Nacional y Estadal)</span>
                                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                                    <li>Desarrollo del Dashboard Nacional con vista consolidada de todos los reportes.</li>
                                                    <li>Creación de componentes de visualización de datos (gráficos, tablas) para estadísticas.</li>
                                                    <li>Implementación de filtros avanzados (por fecha, estado, municipio) y funcionalidad de exportación de datos.</li>
                                                </ul>
                                            </li>
                                        </ol>
                                    </div>
                                </PendingItem>
                                <PendingItem>
                                    <span className="font-semibold">Exportación a PDF/A:</span> Generar documentos PDF/A profesionales a partir de los reportes.
                                </PendingItem>
                                <PendingItem>
                                    <span className="font-semibold">Notificaciones:</span> Sistema de alertas para novedades importantes o recordatorios.
                                </PendingItem>
                                <PendingItem>
                                    <span className="font-semibold">Adaptación a Dispositivos Móviles:</span> Mejorar la experiencia de usuario y la interfaz en teléfonos y tabletas.
                                    <Badge variant="secondary" className="ml-2">UI/UX</Badge>
                                </PendingItem>
                            </ul>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

