import { describe, it, expect } from 'vitest';
import { parseTemplate, renderFinalReport } from '../index';

describe('Template Parser - Resilience', () => {
    it('handles templates without crashing and renders available fields', () => {
        const template = `::: section Novedad :::
- *DESCRIPCIÓN:* {Descripcion:textarea:default("Sin novedad")}
:::
- *TECNICO:* {Tecnico:req}
- *REPORTA:* {Reporta}`;

        const parsed = parseTemplate(template);
        expect(parsed.errors).toHaveLength(0);

        const report = renderFinalReport(
            template,
            {
                Descripcion: 'Atención realizada',
                Tecnico: 'Perez',
                Reporta: 'Juan',
            },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {}
        );

        expect(report).toContain('Atención realizada');
        expect(report).toContain('Perez');
        expect(report).toContain('Juan');
    });
});
