
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckSquare, Square, Mountain, GitCommit } from "lucide-react";
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground">
        {children}
    </code>
);

const DocSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <section className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="space-y-6 pl-5 border-l-4 border-transparent">
            {children}
        </div>
    </section>
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

export default function InfoPage() {
    const appVersion = "0.9.0";

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Tabs defaultValue="documentation" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="documentation">Documentación</TabsTrigger>
                    <TabsTrigger value="roadmap">Hoja de Ruta</TabsTrigger>
                    <TabsTrigger value="changelog">Historial de Cambios</TabsTrigger>
                    <TabsTrigger value="about">Acerca de</TabsTrigger>
                </TabsList>

                {/* Documentation Tab */}
                <TabsContent value="documentation">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Documentación del Sistema</CardTitle>
                            <CardDescription>
                                Una guía detallada sobre cómo funcionan el guardado de datos y el renderizado de reportes en la aplicación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-12 pt-6">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Aviso: Documentación en Revisión</AlertTitle>
                                <AlertDescription>
                                    Esta documentación fue generada por una inteligencia artificial para proporcionar una guía inicial. Actualmente está siendo revisada y validada por el desarrollador.
                                </AlertDescription>
                            </Alert>
                            <DocSection
                                title="1. Sistema de Guardado y Prioridad de Datos"
                                description="Entender cómo y cuándo se guardan los datos es clave para sacar el máximo provecho a la aplicación."
                            >
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">¿Qué se guarda realmente?</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Cuando creas o editas una novedad, la aplicación no guarda simplemente el texto final del reporte. En su lugar, guarda un objeto con los <strong>datos estructurados</strong> que rellenaste en el formulario. Por ejemplo, si tu formulario tiene los campos <Code>{'{Hora}'}</Code> y <Code>{'{Lugar}'}</Code>, lo que se almacena es algo así:
                                    </p>
                                    <pre className="mt-3 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
                                        {`{
  "Hora": "14:30 HLV",
  "Lugar": "Plaza Bolívar"
}`}
                                    </pre>
                                    <p className="text-muted-foreground leading-relaxed mt-3">
                                        El texto del reporte se regenera dinámicamente a partir de estos datos y la plantilla cada vez que lo visualizas. Esto asegura que si actualizas una plantilla, los reportes antiguos se adaptarán (siempre que los campos coincidan).
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">La Regla de Prioridad de los Datos</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        El sistema sigue un orden estricto de prioridades para decidir qué valor mostrar en un campo del formulario. Esto es fundamental para entender por qué un campo predefinido a veces se puede editar y otras no:
                                    </p>
                                    <ol className="list-decimal list-inside mt-4 space-y-4 text-muted-foreground">
                                        <li>
                                            <span className="font-semibold text-card-foreground">El Valor Guardado en el Reporte (Máxima Prioridad)</span>
                                            <p className="pl-6 mt-1">
                                                Si introduces manualmente un valor en un campo (incluso en uno predefinido como <Code>{'{Municipio}'}</Code>) y guardas el reporte, <strong>ESE valor tiene la máxima prioridad</strong>. Siempre se mostrará la próxima vez que abras ese reporte específico, sin importar si cambias el valor en la configuración global.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">El Valor Global Predefinido</span>
                                            <p className="pl-6 mt-1">
                                                Si un campo en tu reporte está vacío (porque es un reporte nuevo, o porque nunca lo rellenaste), la aplicación intentará rellenarlo con el valor que hayas configurado en <Badge variant="outline">Plantillas {'>'} Etiquetas Globales</Badge>. Este es el valor "por defecto".
                                            </p>
                                        </li>
                                         <li>
                                            <span className="font-semibold text-card-foreground">El Valor Dinámico (Configuración)</span>
                                            <p className="pl-6 mt-1">
                                                Algunas etiquetas, como <Code>{'{Reporta}'}</Code> y <Code>{'{Analista}'}</Code>, no se rellenan manualmente ni tienen un valor fijo. Su contenido se genera automáticamente basado en la guardia activa y el cargo que hayas seleccionado en <Badge variant="outline">Configuración {'>'} Configuración de Etiquetas</Badge>. Esta lógica se aplica si el campo no tiene un valor guardado en el reporte.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Campo Vacío</span>
                                            <p className="pl-6 mt-1">
                                                Si no hay un valor guardado en el reporte para ese campo, ni tampoco un valor global o dinámico, el campo simplemente se mostrará vacío, listo para que lo rellenes.
                                            </p>
                                        </li>
                                    </ol>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">¿Cuándo se guardan los datos? El Sistema Híbrido</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Para ofrecer flexibilidad y seguridad, la aplicación utiliza un sistema de guardado híbrido que combina el control manual con un respaldo automático:
                                    </p>
                                    <ol className="list-decimal list-inside mt-4 space-y-4 text-muted-foreground">
                                        <li>
                                            <span className="font-semibold text-card-foreground">Autoguardado (Tu Red de Seguridad)</span>
                                            <p className="pl-6 mt-1">
                                                El sistema realiza un guardado automático <strong>30 segundos después</strong> de que dejas de escribir. Esto funciona tanto al crear una novedad como al editar una existente. Piensa en ello como una red de seguridad que protege tu trabajo de interrupciones o cierres accidentales.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Guardado Manual (Tu Control)</span>
                                            <p className="pl-6 mt-1">
                                                Para cambios importantes o para asegurarte de que todo está registrado antes de salir, puedes usar el botón <Badge variant="secondary">Guardar Cambios</Badge>. Esto guarda tus cambios de forma inmediata.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Guardado al Navegar (Protección Total)</span>
                                            <p className="pl-6 mt-1">
                                                Para evitar cualquier pérdida de datos, la aplicación fuerza un guardado de todos los cambios pendientes en el instante en que cambias a otro reporte o navegas a una página diferente (como "Plantillas" o "Configuración"). Esto garantiza que tu último cambio, sin importar cuán reciente sea, siempre quede registrado.
                                            </p>
                                        </li>
                                    </ol>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">El Beneficio: Flexibilidad y Confianza</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Este sistema combinado te da lo mejor de ambos mundos: puedes definir valores globales para agilizar el trabajo diario, pero mantienes la flexibilidad de sobrescribir esos valores para un reporte específico. Al mismo tiempo, el sistema de guardado híbrido te da la confianza de que tu trabajo está seguro sin necesidad de estar guardando manualmente a cada instante.
                                    </p>
                                </div>
                            </DocSection>
                            <DocSection
                                title="2. Lógica de Renderizado de Reportes"
                                description="El texto final de un reporte se genera combinando tu plantilla con los datos del formulario. Así funciona el proceso."
                            >
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">El Concepto Base: Plantilla + Datos = Reporte</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        El motor de renderizado toma el texto de tu plantilla <Code>.txt</Code> y lo recorre buscando "etiquetas" o "secciones" especiales para reemplazarlas con los datos correspondientes que has guardado.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Reemplazo de Etiquetas Simples</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Cualquier texto encerrado entre llaves, como <Code>{'{Hora}'}</Code>, se busca en los datos guardados. Si se encuentra un valor para "Hora", la etiqueta completa se reemplaza por ese valor. Si el valor es una fecha (YYYY-MM-DD), se formatea automáticamente a <Code>DD/Mes/AAAA</Code>. Si no se encuentra ningún valor, la etiqueta se reemplaza por una cadena vacía, limpiando el reporte final.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed mt-2">
                                        <strong>Nombres de campo especiales:</strong> si nombras un campo exactamente <Code>{'{Cédula}'}</Code>, se convertirá en un campo de texto con formato automático para cédulas venezolanas. Si lo nombras <Code>{'{Unidad}'}</Code>, se convertirá en un selector con las unidades que hayas registrado en Configuración.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Sintaxis Avanzada de Etiquetas (Tipos y Dropdowns)</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Además del reemplazo simple, puedes dotar a tus etiquetas de mayor inteligencia especificando el tipo de campo que deben generar en el formulario. Esto te da más control directamente desde el archivo <code>.txt</code>.
                                    </p>
                                    <ul className="list-disc list-inside mt-4 space-y-4 text-muted-foreground">
                                        <li>
                                            <span className="font-semibold text-card-foreground">Especificar Tipo de Campo</span>
                                            <p className="pl-6 mt-1">
                                                Usa dos puntos (<code>:</code>) después del nombre del campo para asignar un tipo: <Code>{'{NombreCampo:tipo}'}</Code>. Esto cambia cómo se muestra el campo en el formulario.
                                            </p>
                                            <ul className="list-disc list-inside pl-12 mt-2 space-y-1">
                                                <li><Code>{'{Descripción:textarea}'}</Code>: Crea un área de texto grande.</li>
                                                <li><Code>{'{Fecha de Suceso:date}'}</Code>: Muestra un selector de calendario.</li>
                                                <li><Code>{'{Hora de Llamada:time-hlv}'}</Code>: Usa el campo especial para Hora Legal Venezolana.</li>
                                                <li><Code>{'{Tipo de Novedad:dropdown}'}</Code>: Convierte el campo en un selector de opciones.</li>
                                            </ul>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Definir Opciones para Dropdown</span>
                                            <p className="pl-6 mt-1">
                                                Para un campo de tipo <code>dropdown</code>, puedes definir sus opciones y el texto que insertarán directamente en la plantilla.
                                            </p>
                                            <pre className="mt-3 ml-6 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
                                                {`{Motivo:dropdown(Llamada Radio=Se recibe llamada vía radio.|Llamada Telefónica=Se recibe llamada telefónica.)}`}
                                            </pre>
                                            <p className="pl-6 mt-3 leading-relaxed">
                                                La sintaxis es <code>(Opción 1=Texto a insertar 1|Opción 2=Texto a insertar 2)</code>. Al seleccionar "Llamada Radio" en el formulario, el texto "Se recibe llamada vía radio." se usará en el reporte. Si el dropdown está configurado para rellenar otro campo, este texto se insertará en el campo de destino especificado.
                                            </p>
                                        </li>
                                    </ul>
                                    <p className="text-muted-foreground leading-relaxed mt-4">
                                        <strong>Importante:</strong> Si defines el tipo o las opciones de un campo en la plantilla, estas configuraciones tendrán prioridad y deshabilitarán las opciones correspondientes en el editor visual de la página de "Plantillas", evitando así conflictos.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Procesamiento de Secciones</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Las secciones, definidas por corchetes <Code>[ ]</Code>, se manejan de manera más inteligente.
                                    </p>
                                    <ul className="list-disc list-inside mt-4 space-y-4 text-muted-foreground">
                                        <li>
                                            <span className="font-semibold text-card-foreground">Secciones Simples: <Code>{'["Título" {Campo1}]'}</Code></span>
                                            <p className="pl-6 mt-1">
                                                El sistema primero elimina el título (<Code>"Título"</Code>) y luego reemplaza cada campo (<Code>{'{Campo1}'}</Code>) con su valor correspondiente. Si <strong>ninguno</strong> de los campos dentro de la sección tiene un valor, toda la sección (incluyendo el texto que la rodea dentro de los corchetes) se elimina del reporte final para no dejar líneas vacías.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Secciones Repetibles: <Code>[singular="..." plural="..." ...]</Code></span>
                                            <p className="pl-6 mt-1">
                                                Para estas secciones, el sistema verifica si hay una lista de elementos guardada. Si la lista está vacía, toda la sección se omite. Si hay elementos:
                                            </p>
                                            <ol className="list-decimal list-inside pl-12 mt-2 space-y-1">
                                                <li>Se añade el título principal (<Code>singular</Code> para 1 elemento, <Code>plural</Code> para más de 1).</li>
                                                <li>Se itera sobre cada elemento de la lista.</li>
                                                <li>Por cada elemento, se genera una copia del contenido de la sección y se reemplazan las etiquetas con los datos de ese elemento en particular.</li>
                                                <li>El resultado de cada elemento se une, creando la lista final en el reporte.</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <span className="font-semibold text-card-foreground">Secciones Especiales</span>
                                            <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                                <li><Code>[""]</Code>: Se interpreta como un separador y simplemente se elimina, creando un salto de línea en el reporte final.</li>
                                                <li><Code>["Título Informativo"]</Code>: Si una sección solo tiene un título y ningún campo, se renderiza como un encabezado: <Code>{'- *Título Informativo*'}</Code>.</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </DocSection>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roadmap Tab */}
                <TabsContent value="roadmap">
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
                </TabsContent>
                
                 {/* Changelog Tab */}
                <TabsContent value="changelog">
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
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about">
                    <Card className="shadow-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary rounded-full h-16 w-16 flex items-center justify-center mb-4">
                                <Mountain className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-3xl">Generador de Reportes</CardTitle>
                            <CardDescription>Versión {appVersion}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-center">
                            <div className="text-muted-foreground space-y-4 leading-relaxed">
                                <p>
                                    Esta aplicación fue diseñada y desarrollada con el objetivo de simplificar y agilizar
                                    la creación de reportes operativos. La meta es proporcionar una herramienta robusta,
                                    flexible y fácil de usar que se adapte a las necesidades del trabajo diario.
                                </p>
                                <p>
                                    Toda la información que ingresas se almacena de forma segura y privada en tu
                                    propio navegador, garantizando que tus datos permanezcan bajo tu control.
                                </p>
                                <p className="font-semibold text-card-foreground">
                                    ¡Gracias por usar la aplicación y por tu valioso feedback para seguir mejorando!
                                </p>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-card-foreground">Unas palabras del desarrollador:</h3>
                                <blockquote className="border-l-4 pl-4 italic text-muted-foreground text-left">
                                    <p>
                                        "Esta aplicación fue hecha con la flojera que me daba seguir editando en Word las minutas, un esclavo de IA y bastante paciencia para explicarle al esclavo toda la lógica que me saqué del forro para que funcione esta aplicación en un lenguaje en el que ni me molesté en revisar su sintaxis. Todo esto usando el tiempo en el que debí estar haciendo mi tesis. Gracias Git, por permitirme volver atrás cada que rompía el código"
                                    </p>
                                </blockquote>
                                <p className="text-sm italic text-muted-foreground text-center pt-2">
                                    PD: "Ahora tengo que ver como convierto esta vaina en una PWA"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
