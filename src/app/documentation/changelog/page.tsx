
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
                            <h2 className="text-xl font-semibold mb-3">Versión 0.9.0 <Badge variant="outline">Actual</Badge></h2>
                            <p className="text-sm text-muted-foreground mb-4">Lanzada el DD/MM/AAAA.</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><span className="font-semibold">Nueva Funcionalidad:</span> Añadida la opción de Cédula opcional para el personal.</li>
                                <li><span className="font-semibold">Nueva Funcionalidad:</span> Añadida la pestaña de "Historial de Cambios" a la página de Información.</li>
                                <li><span className="font-semibold">Mejora:</span> Se unificó la configuración de las etiquetas <Code>{'{Reporta}'}</Code> y <Code>{'{Analista}'}</Code> en un solo selector en Configuración.</li>
                                <li><span className="font-semibold">Mejora:</span> Las cédulas del personal ahora solo se muestran en las etiquetas <Code>{'{Reporta}'}</Code> y <Code>{'{Analista}'}</Code> para mantener limpias otras listas.</li>
                                <li><span className="font-semibold">Mejora:</span> El sistema ahora es insensible a mayúsculas/minúsculas al reconocer campos de personal en las plantillas (ej. <Code>{'{Jefe de los servicios}'}</Code>).</li>
                                <li><span className="font-semibold">Corrección de Error:</span> Se solucionó un problema que mostraba `[object Object]` en campos de personal si no se reconocían correctamente.</li>
                                <li><span className="font-semibold">Corrección de Error:</span> El campo "Jefe de los Servicios" ahora se autocompleta correctamente al crear un nuevo reporte.</li>
                                <li><span className="font-semibold">Corrección de Error:</span> Los menús desplegables (dropdowns) ahora se deshabilitan correctamente cuando un reporte se marca como "Finalizado".</li>
                                <li><span className="font-semibold">Corrección de Error:</span> Se arregló un "parpadeo" que ocurría en los campos de selección de Dirección y Personal al abrirlos.</li>
                                <li><span className="font-semibold">Corrección de Error:</span> Se solucionó un error que impedía que los datos del personal se cargaran correctamente en la pestaña de "Gestión de Personal".</li>
                                <li><span className="font-semibold">Corrección de Error:</span> Se corrigió un error de sintaxis en la página de Documentación.</li>
                            </ul>
                        </section>
                        <Separator />
                        <section>
                            <h2 className="text-xl font-semibold mb-3">Versión 0.8.0</h2>
                            <p className="text-sm text-muted-foreground mb-4">Lanzamiento inicial y desarrollo temprano.</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><span className="font-semibold">Funcionalidad:</span> Generador de Novedades a partir de plantillas de texto.</li>
                                <li><span className="font-semibold">Funcionalidad:</span> Gestión de Plantillas con editor de configuración.</li>
                                <li><span className="font-semibold">Funcionalidad:</span> Generador de Orden del Día y Reporte Final de Guardia.</li>
                                <li><span className="font-semibold">Funcionalidad:</span> Configuración de guardias, personal, departamentos y unidades.</li>
                                <li><span className="font-semibold">Funcionalidad:</span> Módulo de gestión de Direcciones con mapa interactivo.</li>
                                <li><span className="font-semibold">Funcionalidad:</span> Persistencia de todos los datos en el almacenamiento local del navegador.</li>
                            </ul>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

