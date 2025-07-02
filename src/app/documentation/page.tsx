
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground">
        {children}
    </code>
);

const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
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

export default function DocumentationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Documentación del Sistema</CardTitle>
          <CardDescription>
            Una guía detallada sobre cómo funcionan el guardado de datos y el renderizado de reportes en la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 pt-6">

          <Section
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
                            Si un campo en tu reporte está vacío (porque es un reporte nuevo, o porque nunca lo rellenaste), la aplicación intentará rellenarlo con el valor que hayas configurado en <Badge variant="outline">Configuración {'>'} Etiquetas Globales</Badge>. Este es el valor "por defecto".
                        </p>
                    </li>
                    <li>
                        <span className="font-semibold text-card-foreground">Campo Vacío</span>
                         <p className="pl-6 mt-1">
                            Si no hay un valor guardado en el reporte para ese campo, ni tampoco un valor global predefinido, el campo simplemente se mostrará vacío, listo para que lo rellenes.
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
          </Section>

          <Section
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
          </Section>

        </CardContent>
      </Card>
    </div>
  );
}
