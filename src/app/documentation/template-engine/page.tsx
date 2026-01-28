'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wrench, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

const Code = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <code
    className={cn(
      'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground',
      className
    )}
  >
    {children}
  </code>
);

const DocSection = ({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  id: string;
}) => (
  <section className="space-y-4 scroll-mt-20" id={id}>
    <div className="border-l-4 border-primary pl-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
    <div className="space-y-6 pl-5 border-l-4 border-transparent">{children}</div>
  </section>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="mt-2 p-4 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap overflow-x-auto">
    <code>{children}</code>
  </pre>
);

export default function TemplateEnginePage() {
  const navLinks = [
    { id: 'introduction', title: 'Introducción' },
    { id: 'core-concepts', title: 'Conceptos Clave' },
    { id: 'main-functions', title: 'Funciones Principales' },
    { id: 'internal-functions', title: 'Funciones Internas' },
    { id: 'syntax', title: 'Sintaxis de Plantilla' },
    { id: 'advanced-features', title: 'Funcionalidades Avanzadas' },
    { id: 'examples', title: 'Ejemplos Prácticos' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:sticky lg:top-6 h-fit hidden lg:block">
          <nav>
            <h3 className="font-semibold mb-2">En esta página</h3>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Wrench className="h-8 w-8 text-primary" />
                Documentación del Motor de Plantillas
              </CardTitle>
              <CardDescription>
                Un análisis técnico detallado de la arquitectura modular en <Code>src/lib/template/</Code>,
                el núcleo del sistema de generación de reportes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-12 pt-6">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>¡Funcionalidades Nuevas!</AlertTitle>
                <AlertDescription>
                  El motor de plantillas ahora soporta operadores lógicos avanzados, modificadores
                  de texto encadenados y formatos personalizados. Consulta la sección de{' '}
                  <a href="#advanced-features" className="text-primary underline">
                    Funcionalidades Avanzadas
                  </a>
                  .
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle>Audiencia</AlertTitle>
                <AlertDescription>
                  Este documento está dirigido a desarrolladores. Para guías de uso, consulta la{' '}
                  <a href="/documentation/user-guide" className="text-primary underline">
                    Guía de Usuario
                  </a>
                  .
                </AlertDescription>
              </Alert>

              <DocSection
                id="introduction"
                title="Introducción"
                description="Visión general del propósito y funcionamiento del motor de plantillas."
              >
                <p className="text-muted-foreground leading-relaxed">
                  El motor de plantillas, ubicado en <Code>src/lib/template/</Code>,
                  es un componente modular de la aplicación. Su responsabilidad principal es tomar
                  una plantilla de texto plano (<Code>.txt</Code>) con una sintaxis específica,
                  analizarla para entender su estructura, y combinarla con los datos ingresados por
                  el usuario para producir un reporte final estructurado.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Tras su reciente refactorización, el motor ha pasado de ser un solo archivo a una
                  serie de módulos especializados (Lexer, Parser, Validator, Evaluator, Renderer)
                  que garantizan mayor estabilidad, facilidad de testeo y extensibilidad.
                </p>
              </DocSection>

              <DocSection
                id="core-concepts"
                title="Conceptos Clave"
                description="La arquitectura modular del sistema."
              >
                <div>
                  <h3 className="font-semibold text-lg mb-2">Flujo de Procesamiento</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    El sistema procesa las plantillas en etapas secuenciales:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground pl-4">
                    <li>
                      <strong>Lexer</strong> (<Code>lexer.ts</Code>): Tokeniza el texto crudo,
                      identificando campos y bloques de sección.
                    </li>
                    <li>
                      <strong>Parser</strong> (<Code>parser.ts</Code>): Construye el AST (Árbol de
                      Sintaxis Abstracta) y la configuración de campos.
                    </li>
                    <li>
                      <strong>Validator</strong> (<Code>validator.ts</Code>): Verifica la integridad
                      gramatical y semántica de la plantilla.
                    </li>
                    <li>
                      <strong>Evaluator</strong> (<Code>evaluator.ts</Code>): Lógica pura para evaluar
                      condiciones y aplicar modificadores de texto.
                    </li>
                    <li>
                      <strong>Renderer</strong> (<Code>renderer.ts</Code>): Orquesta la inyección de
                      datos y genera el resultado final.
                    </li>
                  </ul>
                </div>
              </DocSection>

              <DocSection
                id="main-functions"
                title="Funciones Principales (Exportadas)"
                description="Explicación de las funciones que componen la interfaz pública del módulo."
              >
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>parseTemplate(templateContent: string)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Esta es la función principal de análisis. Es la primera que se llama cuando se
                    sube o se edita una plantilla.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Propósito:</strong> Analizar un string de plantilla y extraer su
                      estructura lógica.
                    </li>
                    <li>
                      <strong>Parámetros:</strong>
                      <ul className="list-disc list-inside pl-6">
                        <li>
                          <Code>templateContent</Code>: El contenido de texto del archivo{' '}
                          <Code>.txt</Code>.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Retorna:</strong> Un objeto <Code>TemplateParserResult</Code> con la
                      siguiente estructura:
                      <CodeBlock>
                        {`{
  sections: SectionConfig[],
  layout: string[],
  fieldNames: Set<string>,
  fieldTypes: Map<string, FieldType>,
  templateOptions: Map<string, SnippetOption[]>,
  fieldModifiers: Map<string, string>,
  errors: string[]
}`}
                      </CodeBlock>
                    </li>
                    <li>
                      <strong>Validaciones:</strong> Detecta automáticamente:
                      <ul className="list-disc list-inside pl-6">
                        <li>
                          Llaves <Code>{`{}`}</Code> desbalanceadas
                        </li>
                        <li>
                          Corchetes <Code>[]</Code> desbalanceados
                        </li>
                        <li>
                          Condicionales sin cerrar <Code>[?...] sin [/]</Code>
                        </li>
                        <li>Campos inexistentes en condicionales</li>
                        <li>Índices fuera de rango en dropdowns</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>renderFinalReport(template, data, config, ...)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Esta función es el punto de entrada para generar el texto de un reporte.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Propósito:</strong> Orquestar el proceso de renderizado, manejando la
                      lógica de resumen y llamando a la función de renderizado principal.
                    </li>
                    <li>
                      <strong>Parámetros Principales:</strong>
                      <ul className="list-disc list-inside pl-6">
                        <li>
                          <Code>template</Code>: El string de la plantilla original.
                        </li>
                        <li>
                          <Code>data</Code>: El objeto con los datos del formulario.
                        </li>
                        <li>
                          <Code>config</Code>: La <Code>TemplateConfig</Code> generada por{' '}
                          <Code>parseTemplate</Code>.
                        </li>
                        <li>
                          <Code>predefinedValues</Code>: Valores predefinidos del sistema.
                        </li>
                        <li>
                          <Code>summaryOnly</Code>: Un booleano que, si es <Code>true</Code>, solo
                          renderiza el contenido dentro de marcadores{' '}
                          <Code>
                            {'<<'}...{'>>'}
                          </Code>
                          .
                        </li>
                        <li>
                          <Code>dynamicPredefinedValues</Code>: Valores que tienen prioridad sobre
                          cualquier otro, como el ID de la guardia activa.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Retorna:</strong> Un <Code>string</Code> con el reporte final, limpio
                      y formateado.
                    </li>
                    <li>
                      <strong>Lógica Clave:</strong>
                      <ol className="list-decimal list-inside pl-6 mt-2">
                        <li>
                          Primero, llama a <Code>renderContentWithSections</Code> para obtener el
                          reporte completamente renderizado.
                        </li>
                        <li>
                          Si <Code>summaryOnly</Code> es <Code>true</Code>, extrae el contenido
                          entre{' '}
                          <Code>
                            {'<<'}...{'>>'}
                          </Code>{' '}
                          del resultado anterior.
                        </li>
                        <li>
                          Aplica modificadores de texto (upper, lower, title, format, default).
                        </li>
                        <li>
                          Realiza una limpieza final del texto (eliminar marcadores, saltos de línea
                          excesivos).
                        </li>
                      </ol>
                    </li>
                  </ul>
                </div>
              </DocSection>
              <DocSection
                id="internal-functions"
                title="Funciones Internas (No Exportadas)"
                description="Un vistazo a las funciones que hacen el trabajo pesado detrás de escena."
              >
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>parseContentRecursive(content, ...)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    El corazón del analizador. Esta función recursiva permite procesar estructuras
                    anidadas como las secciones condicionales.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Propósito:</strong> Recorrer un string y identificar bloques
                      (secciones condicionales, secciones estándar, campos) en el nivel actual.
                    </li>
                    <li>
                      <strong>Lógica Clave:</strong>
                      <ol className="list-decimal list-inside pl-6 mt-2">
                        <li>
                          Utiliza una expresión regular (<Code>blockRegex</Code>) compleja para
                          encontrar el siguiente bloque de interés. Esta regex busca, en orden de
                          prioridad:
                          <ul className="list-disc list-inside pl-6">
                            <li>
                              Bloques condicionales avanzados:{' '}
                              <Code>[?{'{...}'} op valor]...[/]</Code> donde <Code>op</Code> puede
                              ser <Code>=</Code>, <Code>!=</Code>, <Code>{'>'}</Code>,{' '}
                              <Code>{'<'}</Code>, <Code>{'>='}</Code>, <Code>{'<='}</Code>
                            </li>
                            <li>
                              Bloques de sección estándar: <Code>[...]</Code> o <Code>[...]*</Code>
                            </li>
                            <li>
                              Etiquetas de campo: <Code>{'{...}'}</Code>
                            </li>
                          </ul>
                        </li>
                        <li>
                          Para cada bloque encontrado, determina su tipo y extrae la información
                          relevante (ej. el campo, operador y valor de una condición).
                        </li>
                        <li>
                          Si encuentra un bloque condicional, se llama a sí misma (
                          <Code>parseContentRecursive</Code>) para analizar el contenido de ese
                          bloque, permitiendo el anidamiento.
                        </li>
                        <li>
                          Devuelve las secciones, el layout y los nombres de campo encontrados en su
                          nivel de profundidad.
                        </li>
                      </ol>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>evaluateCondition(fieldValue, operator, targetValue)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Evalúa una condición usando el operador especificado. Soporta comparaciones
                    numéricas y de strings.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Operadores Soportados:</strong> <Code>=</Code>, <Code>!=</Code>,{' '}
                      <Code>{'>'}</Code>, <Code>{'<'}</Code>, <Code>{'>='}</Code>,{' '}
                      <Code>{'<='}</Code>
                    </li>
                    <li>
                      <strong>Lógica:</strong> Si ambos valores son numéricos, compara como números.
                      De lo contrario, compara como strings.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>applyTextModifier(value, modifier)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Aplica modificadores de texto de forma encadenada a un valor.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Modificadores Soportados:</strong>
                      <ul className="list-disc list-inside pl-6">
                        <li>
                          <Code>upper</Code>: Convierte a MAYÚSCULAS
                        </li>
                        <li>
                          <Code>lower</Code>: Convierte a minúsculas
                        </li>
                        <li>
                          <Code>title</Code>: Convierte A Título (Primera Letra Mayúscula)
                        </li>
                        <li>
                          <Code>format("formatString")</Code>: Formatea fechas usando el patrón
                          especificado
                        </li>
                        <li>
                          <Code>default("valor")</Code>: Proporciona un valor por defecto si el
                          campo está vacío
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Encadenamiento:</strong> Los modificadores pueden encadenarse usando{' '}
                      <Code>|</Code>, por ejemplo: <Code>{'{Campo|upper|default("N/A")}'}</Code>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    <Code>renderContent(template, data, ...)</Code>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Esta es la función principal de renderizado que realiza los reemplazos.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                    <li>
                      <strong>Propósito:</strong> Reemplazar todas las etiquetas y secciones de la
                      plantilla con los datos correspondientes.
                    </li>
                    <li>
                      <strong>Lógica Clave:</strong>
                      <ol className="list-decimal list-inside pl-6 mt-2">
                        <li>
                          Primero, procesa los bloques estructurales (secciones) usando una
                          expresión regular.
                        </li>
                        <li>
                          **Para secciones condicionales:** Funcionalidad en desarrollo.
                          Actualmente, evalúa la condición; si no se cumple, elimina el bloque; si
                          se cumple, llama a <Code>renderContent</Code> recursivamente.
                        </li>
                        <li>
                          **Para secciones repetibles:** Itera sobre los datos del array
                          correspondiente. Para cada elemento, clona el contenido de la sección y lo
                          rellena con los datos de ese elemento en particular. Une los resultados.
                        </li>
                        <li>
                          **Para secciones simples:** Reemplaza las etiquetas internas con sus
                          valores. Si ningún campo tiene valor, elimina toda la sección.
                        </li>
                        <li>
                          Después de procesar las secciones, realiza un segundo paso para reemplazar
                          todas las etiquetas de campo restantes que estuvieran fuera de cualquier
                          sección.
                        </li>
                      </ol>
                    </li>
                  </ul>
                </div>
              </DocSection>

              <DocSection
                id="syntax"
                title="Sintaxis de Plantilla Soportada"
                description="Un resumen de las reglas que el parser entiende."
              >
                <ul className="list-disc list-inside mt-3 space-y-4 text-muted-foreground pl-4">
                  <li>
                    <strong>Campos Simples:</strong> <Code>{'{NombreCampo}'}</Code>
                  </li>
                  <li>
                    <strong>Campos con Tipo:</strong> <Code>{'{Descripcion:textarea}'}</Code>
                  </li>
                  <li>
                    <strong>Campos con Modificadores:</strong> <Code>{'{Nombre|upper}'}</Code>,{' '}
                    <Code>{'{Fecha|format("dd-MM-yyyy")}'}</Code>
                  </li>
                  <li>
                    <strong>Modificadores Encadenados:</strong>{' '}
                    <Code>{'{Campo|lower|default("sin datos")}'}</Code>
                  </li>
                  <li>
                    <strong>Dropdowns en línea:</strong>{' '}
                    <Code>{'{Opcion:dropdown(Opt1=Val1|Opt2=Val2)}'}</Code>
                  </li>
                  <li>
                    <strong>Secciones Simples:</strong> <Code>["Título" {'{Campo1}'}]</Code>
                  </li>
                  <li>
                    <strong>Secciones Repetibles (Básico):</strong>{' '}
                    <Code>["Título"]* {'{Campo}'}</Code>
                  </li>
                  <li>
                    <strong>Secciones Repetibles (Avanzado):</strong>{' '}
                    <Code>[singular="..." plural="..." sub="..."]* ...</Code>
                  </li>
                  <li>
                    <strong>Condicionales Simples:</strong>{' '}
                    <Code>[?{'{CampoDropdown}'}=0] ... [/]</Code>
                  </li>
                  <li>
                    <strong>Condicionales Avanzados:</strong>
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>
                        <Code>[?{`{Campo} != valor`}] ... [/]</Code> (Diferente de)
                      </li>
                      <li>
                        <Code>[?{`{Numero} > 10`}] ... [/]</Code> (Mayor que)
                      </li>
                      <li>
                        <Code>[?{`{Numero} < 100`}] ... [/]</Code> (Menor que)
                      </li>
                      <li>
                        <Code>[?{`{Edad} >= 18`}] ... [/]</Code> (Mayor o igual)
                      </li>
                      <li>
                        <Code>[?{`{Cantidad} <= 5`}] ... [/]</Code> (Menor o igual)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Secciones de Resumen:</strong>{' '}
                    <Code>
                      {'<<'} ... {'>>'}
                    </Code>
                  </li>
                </ul>
              </DocSection>

              <DocSection
                id="advanced-features"
                title="Funcionalidades Avanzadas"
                description="Nuevas capacidades del motor de plantillas para casos de uso complejos."
              >
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Operadores Lógicos en Condicionales
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Los condicionales ahora soportan operadores avanzados para comparaciones más
                    complejas:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground pl-4">
                    <li>
                      <Code>=</Code> : Igual a (por defecto, retrocompatible)
                    </li>
                    <li>
                      <Code>!=</Code> : Diferente de
                    </li>
                    <li>
                      <Code>{'>'}</Code> : Mayor que (numérico o lexicográfico)
                    </li>
                    <li>
                      <Code>{'<'}</Code> : Menor que (numérico o lexicográfico)
                    </li>
                    <li>
                      <Code>{'>='}</Code> : Mayor o igual que
                    </li>
                    <li>
                      <Code>{'<='}</Code> : Menor o igual que
                    </li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>Nota:</strong> Si ambos valores pueden interpretarse como números, la
                    comparación es numérica. De lo contrario, es lexicográfica (alfabética).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Modificadores de Texto Encadenados
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Puedes aplicar múltiples transformaciones a un campo usando el operador{' '}
                    <Code>|</Code>:
                  </p>
                  <CodeBlock>
                    {`{NombreCompleto|title}           → Juan Pérez
{Descripcion|upper}               → DESCRIPCIÓN EN MAYÚSCULAS
{Codigo|lower}                    → abc123
{Campo|upper|default("NINGUNO")}  → Si está vacío: NINGUNO`}
                  </CodeBlock>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Formatos de Fecha Personalizados
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Usa el modificador <Code>format("patrón")</Code> para personalizar cómo se
                    muestran las fechas:
                  </p>
                  <CodeBlock>
                    {`{Fecha|format("dd-MM-yyyy")}         → 28-12-2025
{Fecha|format("dd/MMMM/yyyy")}       → 28/diciembre/2025
{Fecha|format("EEEE, dd 'de' MMMM")} → sábado, 28 de diciembre
{FechaHora|format("dd/MM/yyyy HH:mm")} → 28/12/2025 14:30`}
                  </CodeBlock>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    La función utiliza la librería <Code>date-fns</Code> con locale español.
                    Consulta la{' '}
                    <a
                      href="https://date-fns.org/docs/format"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      documentación de date-fns
                    </a>{' '}
                    para más patrones.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Valores por Defecto
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Usa <Code>default("valor")</Code> para mostrar un texto alternativo cuando un
                    campo está vacío:
                  </p>
                  <CodeBlock>
                    {`{Observaciones|default("Sin observaciones")}
{Email|default("No proporcionado")}
{Comentarios|default("N/A")|upper}  → N/A si está vacío`}
                  </CodeBlock>
                </div>
              </DocSection>

              <DocSection
                id="examples"
                title="Ejemplos Prácticos"
                description="Casos de uso reales que combinan las funcionalidades avanzadas."
              >
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Ejemplo 1: Reporte de Incidentes con Prioridad
                  </h3>
                  <CodeBlock>
                    {`Fecha: {Fecha|format("dd/MM/yyyy")}
Tipo: {TipoIncidente:dropdown(Menor=1|Moderado=2|Grave=3)}

[?{TipoIncidente}>=2]
  ⚠️ ALERTA: Este incidente requiere atención prioritaria.
  Responsable asignado: {ResponsableEmergencia|default("Sin asignar")|title}
[/]

[?{TipoIncidente}=0]
  ℹ️ Incidente menor registrado para seguimiento.
[/]

Descripción: {Descripcion|default("Sin descripción proporcionada")}`}
                  </CodeBlock>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Ejemplo 2: Control de Asistencia</h3>
                  <CodeBlock>
                    {`REGISTRO DE ASISTENCIA - {Fecha|format("EEEE, dd 'de' MMMM 'de' yyyy")|upper}

Estado: {Estado:dropdown(Presente=P|Ausente=A|Tardanza=T)}

[?{Estado}!=P]
  [?{Estado}=A]
    ❌ AUSENCIA REGISTRADA
    Motivo: {MotivoAusencia|default("No especificado")}
  [/]
  
  [?{Estado}=T]
    ⏰ TARDANZA REGISTRADA
    Hora de llegada: {HoraLlegada}
    Justificación: {Justificacion|default("Sin justificar")}
  [/]
[/]

[?{Estado}=P]
  ✓ Asistencia confirmada
[/]`}
                  </CodeBlock>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Ejemplo 3: Secciones Repetibles con Formato
                  </h3>
                  <CodeBlock>
                    {`[singular="VEHÍCULO REGISTRADO" plural="VEHÍCULOS REGISTRADOS" sub="Vehículo"]*
Placa: {Placa|upper}
Marca/Modelo: {Marca|title} {Modelo|title}
Fecha de ingreso: {FechaIngreso|format("dd/MM/yyyy HH:mm")}
Observaciones: {Observaciones|default("Ninguna")}
[/]`}
                  </CodeBlock>
                </div>
              </DocSection>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
