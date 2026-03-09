import util from 'util';
import { tokenize } from './src/lib/template/lexer';
import { parse } from './src/lib/template/parser';

const template = `["Descripción de los hechos"
- *DESCRIPCIÓN DE LA NOVEDAD:* {Vía de información} por parte del {Nombre de quien informó} solicitando atención pre-hospitalaria para {¿Quien?} en regulares condiciones de salud.]

[?{Vía de información}=LLamada]{Nombre de quien informó}[/]
[?{Vía de información}=Transmisión vía radio]{Nombre de quien informó}[/]
[?{Vía de información}=Se apersona]{Nombre de quien informó}[/]
`;

const tokens = tokenize(template);
const parsed = parse(tokens);

console.log("Global Layout:")
console.log(parsed.layout);

const targetSec = parsed.sections.find(s => s.id === 'sec_descripci_n_de_los_hechos');
console.log("\nModified Layout inside sec_descripci_n_de_los_hechos:");
console.log(targetSec?.layout);
