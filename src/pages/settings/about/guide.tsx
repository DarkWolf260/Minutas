import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, BookOpen, FileCode2, Type, ToggleLeft, Repeat, GitBranch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS } from './data';

// ─── Inline Code component ───────────────────────────────────────────────────
function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold',
        'bg-muted border border-muted-foreground/15 text-foreground/90',
        className
      )}
    >
      {children}
    </code>
  );
}

// ─── Code block component ─────────────────────────────────────────────────────
function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="rounded-xl border overflow-hidden text-xs font-mono">
      {label && (
        <div className="px-3 py-1.5 bg-muted/60 border-b text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="p-3 bg-muted/20 overflow-x-auto whitespace-pre-wrap leading-relaxed text-foreground/85">
        {children.trim()}
      </pre>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  color,
  title,
  description,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Row: name + example + description ───────────────────────────────────────
function TagRow({
  tag,
  description,
  badge,
  badgeVariant,
}: {
  tag: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 py-2 border-b last:border-0">
      <div className="flex items-center gap-2 shrink-0 min-w-0 sm:min-w-[180px]">
        <Code>{tag}</Code>
        {badge && (
          <Badge variant={badgeVariant ?? 'secondary'} className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-wide">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function AboutGuidePage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings/about" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guía de uso</h1>
            <p className="text-muted-foreground text-sm">Primeros pasos y referencia completa de plantillas.</p>
          </div>
        </div>

        {/* ── Flujo de trabajo ─────────────────────────────────────────── */}
        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Flujo de Trabajo
            </CardTitle>
            <CardDescription>
              Sigue estos pasos en orden para poner en marcha tu primera guardia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {WORKFLOW_STEPS.map(({ icon: Icon, color, title, desc, link, linkLabel }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1 flex-1">
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  <Link to={link}>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary mt-1">
                      {linkLabel} →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
              💡 <strong className="text-foreground">Consejo:</strong> Si quieres volver a ver el asistente de configuración inicial,
              borra los datos de la app desde{' '}
              <Link to="/settings/borrar-datos" className="text-primary underline underline-offset-2">
                Configuración → Borrar datos
              </Link>.
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* GUÍA DE PLANTILLAS                                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-violet-600" />
              Cómo hacer Plantillas
            </CardTitle>
            <CardDescription>
              Referencia completa de la sintaxis del motor de plantillas de Minutas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* ── Introducción ─────────────────────────────────────────── */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              Las plantillas se crean usando texto libre mezclado con <strong className="text-foreground">etiquetas especiales</strong> entre llaves{' '}
              <Code>{'{}'}</Code> y corchetes <Code>{'[]'}</Code>. El motor las transforma en formularios interactivos y en el texto
              final del reporte.
            </p>

            {/* ── 1. Campos básicos ─────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={Type}
                color="bg-blue-500/10 text-blue-600"
                title="1. Campos básicos"
                description="Un campo se define con {NombreDelCampo}. El nombre es libre y se convierte en la etiqueta del input."
              />

              <CodeBlock label="Ejemplo de plantilla">
                {`El día {Fecha} se atendió la novedad en {Dirección}.
Descripción: {Descripción:textarea:full}
Responsable: {Nombre:text:req|upper}`}
              </CodeBlock>

              <div className="space-y-0 divide-y rounded-xl border overflow-hidden">
                <TagRow tag="{Campo}" description="Campo de texto simple (una línea)." />
                <TagRow tag="{Campo:textarea}" description="Área de texto multilínea." />
                <TagRow tag="{Campo:date}" description="Selector de fecha. Si el nombre es 'Fecha', se aplica automáticamente." />
                <TagRow tag="{Campo:time-hlv}" description="Selector de hora (HH:MM). Si el nombre es 'Hora', se aplica automáticamente." />
                <TagRow tag="{Campo:cedula}" description="Input con formato de cédula venezolana (V-/E- automático)." />
                <TagRow tag="{Campo:multi-text}" description="Campo que acepta múltiples valores separados por comas." />
                <TagRow tag="{Campo:semantic}" description="Campo con autocompletado semántico (busca entre los datos guardados)." />
                <TagRow
                  tag="{Campo:dropdown(A=Valor1|B=Valor2)}"
                  description="Menú desplegable con opciones fijas. La parte antes del = es lo que ve el usuario; la parte después es lo que va al reporte."
                />
              </div>
            </div>

            {/* ── 2. Modificadores ──────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={Sparkles}
                color="bg-amber-500/10 text-amber-600"
                title="2. Modificadores de campo"
                description="Se añaden con : o | después del tipo para cambiar el comportamiento del campo."
              />

              <CodeBlock label="Sintaxis">
                {`{Campo:tipo:modificador1:modificador2|modificadorTexto}
{Nombre:text:req:full|upper}
{Dirección:textarea:full:def=(Sin dirección especificada)}`}
              </CodeBlock>

              <div className="space-y-0 divide-y rounded-xl border overflow-hidden">
                <TagRow tag=":req" description="Campo obligatorio. No se puede guardar el reporte sin llenarlo." badge="Requerido" badgeVariant="default" />
                <TagRow tag=":full" description="El campo ocupa el ancho completo del formulario (2 columnas)." />
                <TagRow tag=":def=(valor)" description="Valor predeterminado que aparece al abrir el formulario. Ej: :def=(Sin datos)." />
                <TagRow tag="|upper" description="Transforma el texto a MAYÚSCULAS en el reporte final." />
                <TagRow tag="|lower" description="Transforma el texto a minúsculas." />
                <TagRow tag="|title" description="Transforma el texto a Formato Título (primera letra de cada palabra en mayúscula)." />
                <TagRow tag="|hidden" description="El campo aparece en el formulario pero NO se incluye en el texto del reporte final." />
                <TagRow tag="|single" description="En campos multi-texto, fuerza un solo valor." />
              </div>
            </div>

            {/* ── 3. Campos de sistema ──────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={Sparkles}
                color="bg-emerald-500/10 text-emerald-600"
                title="3. Campos del sistema"
                description="Estos campos se rellenan automáticamente con los datos de la guardia activa. No generan un input en el formulario."
              />

              <div className="space-y-0 divide-y rounded-xl border overflow-hidden">
                <TagRow tag="{Enc}" description="Nombre del jefe encargado (tomado de la Orden del Día)." badge="Auto" />

                <TagRow tag="{Estatus}" description="Estatus del reporte (En proceso / Finalizado)." badge="Auto" />
                <TagRow tag="{photos}" description="Habilita la sección de carga de imágenes en este reporte." badge="Especial" badgeVariant="default" />
              </div>
            </div>

            {/* ── 4. Secciones ──────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={ToggleLeft}
                color="bg-indigo-500/10 text-indigo-600"
                title="4. Secciones"
                description="Agrupan campos relacionados bajo un título visual en el formulario."
              />

              <CodeBlock label="Sección estándar">
                {`[Datos del Paciente]
{Nombre:text:req}
{Edad}
{Sexo:dropdown(M=Masculino|F=Femenino)}
[/]`}
              </CodeBlock>

              <CodeBlock label="Sección auto-contenida (sin [/])">
                {`["Título de la sección" {Campo1} {Campo2}]`}
              </CodeBlock>

              <CodeBlock label="Separador visual">
                {`[""]`}
              </CodeBlock>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
                <p>
                  📌 <strong className="text-foreground">Sección estándar:</strong> <Code>[Título]</Code> … <Code>[/]</Code> — el
                  título aparece como encabezado y agrupa los campos visualmente.
                </p>
                <p>
                  📌 <strong className="text-foreground">Auto-contenida:</strong> <Code>{"[\"Título\" {campo}]"}</Code> — todo en una
                  sola línea, sin necesidad de <Code>[/]</Code>.
                </p>
                <p>
                  📌 <strong className="text-foreground">Separador:</strong> <Code>{"[\"\"]"}</Code> — inserta una línea divisoria
                  visual entre grupos de campos.
                </p>
              </div>
            </div>

            {/* ── 5. Secciones repetibles ───────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={Repeat}
                color="bg-rose-500/10 text-rose-600"
                title="5. Secciones repetibles"
                description='Permiten que el usuario añada múltiples instancias de un mismo bloque (ej. varios traslados, varios heridos).'
              />

              <CodeBlock label="Sección repetible con [Título]*">
                {`[Traslado]*
  {Origen:text:req}
  {Destino:text:req}
  {Km}
[/]`}
              </CodeBlock>

              <CodeBlock label="Con etiquetas personalizadas (singular/plural/sub)">
                {`[singular="Herido" plural="Heridos" sub="HERIDO"]*
  {Nombre:text:req}
  {Lesión:textarea}
[/]`}
              </CodeBlock>

              <CodeBlock label="Campo repetible simple (shorthand)">
                {`{Actividad}*`}
              </CodeBlock>

              <div className="space-y-0 divide-y rounded-xl border overflow-hidden">
                <TagRow tag="[Título]*" description="Sección que puede añadirse múltiples veces con el botón '+ Agregar'." />
                <TagRow tag='singular="X"' description="Texto singular del ítem (ej. 'Herido'). Implica que la sección es repetible." />
                <TagRow tag='plural="X"' description="Texto plural del ítem (ej. 'Heridos')." />
                <TagRow tag='sub="X"' description="Etiqueta interna de cada ítem añadido (ej. 'HERIDO 1', 'HERIDO 2')." />
                <TagRow tag="{Campo}*" description="Atajo: crea una sección repetible de un solo campo." />
              </div>
            </div>

            {/* ── 6. Condicionales ──────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={GitBranch}
                color="bg-orange-500/10 text-orange-600"
                title="6. Secciones condicionales"
                description="Muestran u ocultan campos según el valor de otro campo en tiempo real."
              />

              <CodeBlock label="Mostrar si campo tiene valor">
                {`{Tipo:dropdown(Traslado=Traslado|Guardia=Guardia)}

[?Tipo=Traslado]
  {Destino:text:req}
  {Km}
[/]

[?Tipo=Guardia]
  {Observaciones:textarea}
[/]`}
              </CodeBlock>

              <CodeBlock label="Operadores disponibles">
                {`[?Campo=Valor]    → se muestra si Campo IGUAL a Valor
[?Campo!=Valor]   → se muestra si Campo DISTINTO de Valor
[?Campo>5]        → se muestra si Campo mayor que 5
[?Campo<5]        → se muestra si Campo menor que 5
[?Campo>=5]       → se muestra si Campo mayor o igual que 5
[?Campo<=5]       → se muestra si Campo menor o igual que 5`}
              </CodeBlock>

              <CodeBlock label="Modo :show — siempre visible en formulario">
                {`[?Tiene_Heridos=Sí:show]
  {Cantidad_Heridos}
[/]`}
              </CodeBlock>

              <CodeBlock label="Condicional de mapeo — define opciones de dropdown">
                {`[?Motivo]
  Preventiva=Atención de guardia preventiva sin novedades relevantes
  Correctiva=Se realizó intervención correctiva por falla detectada
[/]`}
              </CodeBlock>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
                <p>
                  ⚠️ <strong className="text-foreground">Condicional de mapeo:</strong> cuando usas <Code>[?Campo]</Code> sin
                  operador ni valor, el motor crea automáticamente un menú desplegable con las opciones definidas en el bloque (formato{' '}
                  <Code>Clave=Texto largo</Code>). El usuario selecciona la clave y el reporte usa el texto largo.
                </p>
              </div>
            </div>

            {/* ── 7. Ejemplo completo ───────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader
                icon={FileCode2}
                color="bg-violet-500/10 text-violet-600"
                title="7. Ejemplo completo"
                description="Una plantilla real de atención prehospitalaria con varios tipos de campo."
              />

              <CodeBlock label="Plantilla: Atención Prehospitalaria">
                {`Fecha: {Fecha} — Hora: {Hora}
Dirección: {Dirección:text:req:full}

[Datos del Paciente]
Nombre: {Nombre_Paciente:text:req|title}
Cédula: {Cédula:cedula}
Edad: {Edad}
Sexo: {Sexo:dropdown(M=Masculino|F=Femenino)}
[/]

[""]

[?Sexo=Femenino]
  ¿Embarazada? {Embarazo:dropdown(Sí=Sí|No=No|Desconocido=Desconocido)}
[/]

[Motivo de llamada]
  {Motivo:textarea:full:req}
[/]

[Procedimientos]*
  {Procedimiento:text:req}
  {Resultado}
[/]

{Apoyo:dropdown(Sí=Sí|No=No)|hidden}
Enc: {Enc}`}
              </CodeBlock>
            </div>

            {/* ── Tip final ─────────────────────────────────────────────── */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
              🛠️ <strong className="text-foreground">Editor de plantillas:</strong> Puedes crear y editar plantillas directamente
              desde{' '}
              <Link to="/plantillas" className="text-primary underline underline-offset-2">
                Plantillas
              </Link>
              . El editor incluye vista previa en tiempo real del formulario que se generará.
            </div>

          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
