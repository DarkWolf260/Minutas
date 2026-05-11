
import { parseTemplate } from '../src/lib/template-parser';

const template = 'NOVEDADES:\n{novedad}*';
const result = parseTemplate(template);

console.log('Sections:', JSON.stringify(result.sections, null, 2));
console.log('Layout:', JSON.stringify(result.layout, null, 2));
console.log('FieldNames:', Array.from(result.fieldNames));
