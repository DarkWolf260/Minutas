
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wrench } from "lucide-react";
import { cn } from '@/lib/utils';
import React from 'react';

const Code = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <code className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-card-foreground", className)}>
        {children}
    </code>
);

const DocSection = ({ title, description, children, id }: { title: string; description: string; children: React.ReactNode, id: string }) => (
    <section className="space-y-4 scroll-mt-20" id={id}>
        <div className="border-l-4 border-primary pl-4">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="space-y-6 pl-5 border-l-4 border-transparent">
            {children}
        </div>
    </section>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="mt-2 p-4 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap overflow-x-auto">
        <code>{children}</code>
    </pre>
);

export default function TemplateEnginePage() {
    const navLinks = [
        { id: "introduction", title: "Introducción" },
        { id: "core-concepts", title: "Conceptos Clave" },
        { id: "main-functions", title: "Funciones Principales" },
        { id: "internal-functions", title: "Funciones Internas" },
        { id: "syntax", title: "Sintaxis de Plantilla" },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:sticky lg:top-6 h-fit hidden lg:block">
                    <nav>
                        <h3 className="font-semibold mb-2">En esta página</h3>
                        <ul className="space-y-2 text-sm">
                            {navLinks.map(link => (
                                <li key={link.id}>
                                    <a href={`#${link.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
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
                                Un análisis técnico detallado del archivo <Code>src/lib/template-parser.ts</Code>, el corazón del sistema de generación de reportes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-12 pt-6">
                            <Alert>
                                <AlertTitle>Audiencia</AlertTitle>
                                <AlertDescription>
                                    Este documento está dirigido a desarrolladores. Para guías de uso, consulta la <a href="/documentation/user-guide" className="text-primary underline">Guía de Usuario</a>.
                                </AlertDescription>
                            </Alert>

                            <DocSection
                                id="introduction"
                                title="Introducción"
                                description="Visión general del propósito y funcionamiento del motor de plantillas."
                            >
                                <p className="text-muted-foreground leading-relaxed">
                                    El motor de plantillas, encapsulado en el archivo <Code>template-parser.ts</Code>, es un componente crucial de la aplicación. Su responsabilidad principal es tomar una plantilla de texto plano (<Code>.txt</Code>) con una sintaxis específica, analizarla para entender su estructura, y combinarla con los datos ingresados por el usuario en un formulario para producir un reporte final con formato.
                                </p>
                                <p className="text-muted-foreground leading-relaxed mt-2">
                                    Este sistema permite una alta flexibilidad, ya que los usuarios pueden definir no solo los campos de un reporte, sino también la estructura del formulario (secciones, campos repetibles, lógica condicional) directamente desde un archivo de texto simple.
                                </p>
                            </DocSection>

                            <DocSection
                                id="core-concepts"
                                title="Conceptos Clave"
                                description="Los principios fundamentales sobre los que se construye el motor."
                            >
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">1. Análisis (Parsing)</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        El primer paso es el análisis. La función <Code>parseTemplate</Code> lee el contenido de la plantilla y lo descompone en una estructura de datos que la aplicación puede entender. Esta estructura se conoce como <Code>TemplateConfig</Code> y contiene:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground pl-4">
                                        <li><Code>fields</Code>: Un objeto que describe cada campo (etiqueta) encontrado.</li>
                                        <li><Code>sections</Code>: Un array que define cada sección estructural de la plantilla.</li>
                                        <li><Code>layout</Code>: Un array que mantiene el orden original de todos los elementos (campos y secciones).</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">2. Renderizado (Rendering)</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        El segundo paso es el renderizado. La función <Code>renderFinalReport</Code> toma la plantilla original, la <Code>TemplateConfig</Code> generada en el paso anterior y los datos del formulario del usuario. Recorre la plantilla, reemplazando las etiquetas y procesando las secciones según las reglas definidas para generar el texto del reporte final.
                                    </p>
                                </div>
                            </DocSection>

                            <DocSection
                                id="main-functions"
                                title="Funciones Principales (Exportadas)"
                                description="Explicación de las funciones que componen la interfaz pública del módulo."
                            >
                                <div>
                                    <h3 className="font-semibold text-lg mb-2"><Code>parseTemplate(templateContent: string)</Code></h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Esta es la función principal de análisis. Es la primera que se llama cuando se sube o se edita una plantilla.
                                    </p>
                                    <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                                        <li><strong>Propósito:</strong> Analizar un string de plantilla y extraer su estructura lógica.</li>
                                        <li><strong>Parámetros:</strong>
                                            <ul className="list-disc list-inside pl-6">
                                                <li><Code>templateContent</Code>: El contenido de texto del archivo <Code>.txt</Code>.</li>
                                            </ul>
                                        </li>
                                        <li><strong>Retorna:</strong> Un objeto con la siguiente estructura:
                                            <CodeBlock>
{`{
  sections: SectionConfig[],      // Array de objetos de sección.
  layout: string[],               // Array de IDs de sección/campo en orden.
  fieldNames: Set<string>,        // Un Set con todos los nombres de campo únicos.
  fieldTypes: Map<string, FieldType>, // Mapa de campos con tipo explícito (ej: {'{Nombre:textarea}'}).
  templateOptions: Map<string, SnippetOption[]> // Mapa de campos dropdown con opciones definidas en la plantilla.
}`}
                                            </CodeBlock>
                                        </li>
                                        <li><strong>Lógica Clave:</strong> Utiliza la función interna <Code>parseContentRecursive</Code> para realizar el análisis.</li>
                                    </ul>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-lg mb-2"><Code>renderFinalReport(template, data, config, ...)</Code></h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Esta función es el punto de entrada para generar el texto de un reporte.
                                    </p>
                                     <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                                        <li><strong>Propósito:</strong> Orquestar el proceso de renderizado, manejando la lógica de resumen y llamando a la función de renderizado principal.</li>
                                        <li><strong>Parámetros Principales:</strong>
                                            <ul className="list-disc list-inside pl-6">
                                                <li><Code>template</Code>: El string de la plantilla original.</li>
                                                <li><Code>data</Code>: El objeto con los datos del formulario.</li>
                                                <li><Code>config</Code>: La <Code>TemplateConfig</Code> generada por <Code>parseTemplate</Code>.</li>
                                                <li><Code>summaryOnly</Code>: Un booleano que, si es <Code>true</Code>, solo renderiza el contenido dentro de marcadores <Code>&lt;&lt;...&gt;&gt;</Code>.</li>
                                                <li><Code>dynamicPredefinedValues</Code>: Valores que tienen prioridad sobre cualquier otro, como el ID de la guardia activa.</li>
                                            </ul>
                                        </li>
                                        <li><strong>Retorna:</strong> Un <Code>string</Code> con el reporte final, limpio y formateado.</li>
                                        <li><strong>Lógica Clave:</strong>
                                            <ol className="list-decimal list-inside pl-6 mt-2">
                                                <li>Primero, llama a <Code>renderContent</Code> para obtener el reporte completamente renderizado.</li>
                                                <li>Si <Code>summaryOnly</Code> es <Code>true</Code>, extrae el contenido entre <Code>&lt;&lt;...&gt;&gt;</Code> del resultado anterior.</li>
                                                <li>Realiza una limpieza final del texto (eliminar marcadores, saltos de línea excesivos).</li>
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
                                    <h3 className="font-semibold text-lg mb-2"><Code>parseContentRecursive(content, ...)</Code></h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        El corazón del analizador. Esta función recursiva permite procesar estructuras anidadas como las secciones condicionales.
                                    </p>
                                      <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                                        <li><strong>Propósito:</strong> Recorrer un string y identificar bloques (secciones condicionales, secciones estándar, campos) en el nivel actual.</li>
                                        <li><strong>Lógica Clave:</strong>
                                             <ol className="list-decimal list-inside pl-6 mt-2">
                                                 <li>Utiliza una expresión regular (<Code>blockRegex</Code>) compleja para encontrar el siguiente bloque de interés. Esta regex busca, en orden de prioridad:
                                                    <ul className="list-disc list-inside pl-6">
                                                        <li>Bloques condicionales: <Code>[?{'{...}'}=...]...[/]</Code></li>
                                                        <li>Bloques de sección estándar: <Code>[...]</Code> o <Code>[...]*</Code></li>
                                                        <li>Etiquetas de campo: <Code>{'{...}'}</Code></li>
                                                    </ul>
                                                </li>
                                                 <li>Para cada bloque encontrado, determina su tipo y extrae la información relevante (ej. el campo y valor de una condición).</li>
                                                 <li>Si encuentra un bloque condicional, se llama a sí misma (<Code>parseContentRecursive</Code>) para analizar el contenido de ese bloque, permitiendo el anidamiento.</li>
                                                <li>Devuelve las secciones, el layout y los nombres de campo encontrados en su nivel de profundidad.</li>
                                            </ol>
                                        </li>
                                    </ul>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-lg mb-2"><Code>renderContent(template, data, ...)</Code></h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Esta es la función principal de renderizado que realiza los reemplazos.
                                    </p>
                                     <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground pl-4">
                                        <li><strong>Propósito:</strong> Reemplazar todas las etiquetas y secciones de la plantilla con los datos correspondientes.</li>
                                        <li><strong>Lógica Clave:</strong>
                                            <ol className="list-decimal list-inside pl-6 mt-2">
                                                <li>Primero, procesa los bloques estructurales (secciones) usando una expresión regular.</li>
                                                <li>**Para secciones condicionales:** Funcionalidad en desarrollo. Actualmente, evalúa la condición; si no se cumple, elimina el bloque; si se cumple, llama a <Code>renderContent</Code> recursivamente.</li>
                                                <li>**Para secciones repetibles:** Itera sobre los datos del array correspondiente. Para cada elemento, clona el contenido de la sección y lo rellena con los datos de ese elemento en particular. Une los resultados.</li>
                                                <li>**Para secciones simples:** Reemplaza las etiquetas internas con sus valores. Si ningún campo tiene valor, elimina toda la sección.</li>
                                                <li>Después de procesar las secciones, realiza un segundo paso para reemplazar todas las etiquetas de campo restantes que estuvieran fuera de cualquier sección.</li>
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
                                    <li><strong>Campos Simples:</strong> <Code>{'{NombreCampo}'}</Code></li>
                                    <li><strong>Campos con Tipo:</strong> <Code>{'{Descripcion:textarea}'}</Code></li>
                                    <li><strong>Dropdowns en línea:</strong> <Code>{'{Opcion:dropdown(Opt1=Val1|Opt2=Val2)}'}</Code></li>
                                    <li><strong>Secciones Simples:</strong> <Code>["Título" {'{Campo1}'}]</Code></li>
                                    <li><strong>Secciones Repetibles (Básico):</strong> <Code>["Título"]* {'{Campo}'}</Code></li>
                                    <li><strong>Secciones Repetibles (Avanzado):</strong> <Code>[singular="..." plural="..." sub="..."]* ...</Code></li>
                                    <li><strong>Secciones Condicionales:</strong> <Code>[?{'{CampoDropdown}'}=0] ... [/]</Code> <Badge variant="destructive">En Desarrollo</Badge></li>
                                    <li><strong>Secciones de Resumen:</strong> <Code>&lt;&lt; ... &gt;&gt;</Code></li>
                                </ul>
                            </DocSection>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
