import util from 'util';
import { tokenize } from './src/lib/template/lexer';
import { parse } from './src/lib/template/parser';
import { renderFinalReport } from './src/lib/template/renderer';

const template = `["Descripción de los hechos"
- *DESCRIPCIÓN DE LA NOVEDAD:* {Vía de información} por parte del {¿Quien informó?} {persona que realizó la llamada} solicitando atención pre-hospitalaria para {¿Quien?} en regulares condiciones de salud, la cual se encuentra ubicada en la dirección antes mencionada, por lo cual se despacha {acción} operativo en atención de la novedad. Al llegar al sitio el personal técnico procedió a realizar evaluación y atención de la paciente, arrojando el diagnóstico antes mencionado, cabe destacar que la misma no ameritó ser trasladada a un centro asistencial.]

[?{Vía de información}]
LLamada=Se recibe llamada vía telefónica
Transmisión vía radio=Se recibe transmisión vía radio
Se apersona=Se apersona a la institución
[/]

[?{¿Quien?}]
Paciente=paciente
Familiar=familiar
[/]

[?{acción}]
Despacho=despacha
Movilización=moviliza
[/]

[?{Vía de información}=LLamada]
{¿Quien informó?}
[/]
 
[?{¿Quien informó?}=personal]
{persona que realizó la llamada}{¿Quien?}
[/]`;

const tokens = tokenize(template);
const parsed = parse(tokens);

const mockFields = {
    'Vía de información': { type: 'dropdown', label: 'Vía' },
    '¿Quien informó?': { type: 'dropdown', label: 'Quien Informo' },
    'persona que realizó la llamada': { type: 'text', label: 'Persona' },
    '¿Quien?': { type: 'dropdown', label: 'Quien' },
    'acción': { type: 'dropdown', label: 'Accion' },
} as any;

const mockData = {
    // This is what `report-form.tsx` default initialization creates
    'sec_descripci_n_de_los_hechos': {
        'Vía de información': '',
        '¿Quien informó?': '',
        'persona que realizó la llamada': '',
        '¿Quien?': '',
        'acción': '',
    },
    // This is what typing in the form creates because Controller has no prefix!
    'Vía de información': 'LLamada',
    '¿Quien informó?': 'personal',
    'persona que realizó la llamada': 'Juan Perez',
    '¿Quien?': 'Paciente',
    'acción': 'Despacho',
};

const rendered = renderFinalReport(
    template,
    mockData,
    { fields: mockFields, sections: parsed.sections, layout: parsed.layout },
    {}, // predefined
    false,
    {}, // dynamic predefined
    (tmpl) => parse(tokenize(tmpl)),
    () => { } // audit recorder
);

console.log("RENDERED OUTPUT:\n");
console.log(rendered);
