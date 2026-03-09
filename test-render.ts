import { parseTemplate } from './src/lib/template-parser';
import { renderFinalReport } from './src/lib/template-parser';
import { TemplateConfig, SectionConfig, FieldConfig } from './src/types';

const template = `
{Tipo:dropdown(Robo=Descripción de robo|Vandalismo=Descripción de vandalismo)}
{monto}
{area}

[?{Tipo}=Robo]
{monto}
[/]

[?{Tipo}=Vandalismo]
{area}
[/]
`;

const data = { Tipo: 'Robo', monto: '100', area: 'Norte' };
const parsed = parseTemplate(template);
const config = {
    fields: {},
    sections: parsed.sections,
    layout: parsed.layout
};

const rendered = renderFinalReport(template, data, config, {});
console.log('--- RENDERED ---');
console.log(rendered);
