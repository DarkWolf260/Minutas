import { parseTemplate } from './src/lib/template-parser';

const template = `
- *DESCRIPCIÓN DE LA NOVEDAD:* Se {Vía de información} {¿Quien informó?} {Cédula} solicitando atención pre-hospitalaria para ciudadana en regulares condiciones de salud, la cual se encuentra ubicada en la dirección antes mencionada, por lo cual se despacha U/PCG-02 con personal operativo en atención de la novedad. Al llegar al sitio el personal técnico procedió a realizar evaluación y atención de la paciente, arrojando el diagnóstico antes mencionado, cabe destacar que la misma no ameritó ser trasladada a un centro asistencial.

[?{Vía de información}]
Llamada=recibe llamada vía telefónica por parte del
Transmisión vía radio=recibe transmisión vía radio por parte del
Se apersona=apersona a la institución el
[/]

[?{Vía de información}=Llamada]{¿Quien informó?}[/]
[?{Vía de información}=Transmisión vía radio]{¿Quien informó?}[/]
[?{Vía de información}=Se apersona]{¿Quien informó?}[/]

[?{¿Quien informó?}]
Personal=personal
Funcionario=f
[/]

[?{¿Quien informó?}=Personal]{Cédula}[/]
`;

const result = parseTemplate(template);
console.log(JSON.stringify(result.sections, null, 2));
console.log("LAYOUT: ", JSON.stringify(result.layout));
