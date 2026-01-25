
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

export default function UserGuidePage() {
    const appVersion = "0.9.0";

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Guía de Usuario del Sistema</CardTitle>
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
                        <DocSection
                            title="3. Gestión de Personal y Datos"
                            description="Herramientas avanzadas para mantener actualizada tu base de datos de personal."
                        >
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Control de Duplicados (Cédula)</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Para mantener la integridad de los datos, el sistema utiliza la <strong>Cédula</strong> como identificador único. Si intentas añadir a una persona cuya cédula ya existe (ya sea manualmente o vía CSV), el sistema te avisará. En el caso de las importaciones masivas, los duplicados se omiten automáticamente y se genera un reporte del número de personas añadidas vs. omitidas.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Acciones Masivas y Selección</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    La tabla de personal permite seleccionar múltiples filas usando las casillas a la izquierda. Esto habilita el botón de <strong>"Borrar seleccionados"</strong>, que permite realizar limpiezas rápidas de la base de datos tras una confirmación de seguridad.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Importación de CSV Robusta</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    El importador ha sido mejorado para ser compatible con una amplia gama de configuraciones regionales y editores (Excel, Notepad, Google Sheets). Soporta:
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                                    <li>Delimitadores automáticos (Coma <code>,</code> o Punto y Coma <code>;</code>).</li>
                                    <li>Codificación UTF-8 con o sin BOM.</li>
                                    <li>Diferentes finales de línea (Windows y Unix).</li>
                                </ul>
                            </div>
                        </DocSection>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
