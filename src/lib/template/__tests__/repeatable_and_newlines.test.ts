import { describe, it, expect } from 'vitest';
import { parseTemplate, renderFinalReport } from '../index';

describe('Template Renderer - Repeatable Fields and Newline Preservation', () => {
    it('does not prepend stray section title for virtual repeatable fields like Destino*', () => {
        const template = `<<:::INFORMACIÓN GEOGRÁFICA:::
- *UBICACIÓN:* {Ubicación:textarea:req}
{Destino:textarea:req}*:::>>

::: DETALLES :::
- *DETALLE:* {Detalle}
:::

- *CIERRE:* {Cierre}`;

        const parsed = parseTemplate(template);
        const destinoSection = parsed.sections.find((s) => s.field_ids.includes('Destino') && s.is_repeatable);
        expect(destinoSection).toBeDefined();

        // 1 item test
        const reportSingle = renderFinalReport(
            template,
            {
                Ubicación: 'Av. Principal',
                [destinoSection!.id]: [{ Destino: 'Hospital Central' }],
                Detalle: 'Todo en orden',
                Cierre: 'Fin de guardia',
            },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {},
            false
        );

        // Must NOT contain stray "- *Destino*" header
        expect(reportSingle).not.toMatch(/- \*Destino\*\s*\n- \*DESTINO/);
        expect(reportSingle).toContain('- *DESTINO:* Hospital Central');

        // Multiple items test
        const reportMultiple = renderFinalReport(
            template,
            {
                Ubicación: 'Calle 10',
                [destinoSection!.id]: [
                    { Destino: 'Hospital 1' },
                    { Destino: 'Hospital 2' },
                ],
                Detalle: 'Sin novedad',
                Cierre: 'Fin de guardia',
            },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {},
            false
        );

        expect(reportMultiple).not.toMatch(/- \*Destino\*\s*\n- \*DESTINO #01/);
        expect(reportMultiple).toContain('- *DESTINO #01:* Hospital 1\n- *DESTINO #02:* Hospital 2');
    });

    it('preserves line breaks between sections closed by ::: and around << >>', () => {
        const template = `::: SECCION 1 :::
- *LINEA 1:* {L1}
:::

::: SECCION 2 :::
- *LINEA 2:* {L2}
:::

- *CIERRE:* {Cierre}`;

        const parsed = parseTemplate(template);
        const report = renderFinalReport(
            template,
            { L1: 'Valor 1', L2: 'Valor 2', Cierre: 'Fin' },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {}
        );

        // Sections separated by empty lines must preserve the empty line separation
        expect(report).toBe('- *LINEA 1:* Valor 1\n\n- *LINEA 2:* Valor 2\n\n- *CIERRE:* Fin');
    });

    it('preserves line breaks for sections immediately followed by text lines without eating newlines', () => {
        const template = `::: SECCION 1 :::
- *LINEA 1:* {L1}
:::
- *LINEA 2:* {L2}`;

        const parsed = parseTemplate(template);
        const report = renderFinalReport(
            template,
            { L1: 'Valor 1', L2: 'Valor 2' },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {}
        );

        expect(report).toBe('- *LINEA 1:* Valor 1\n- *LINEA 2:* Valor 2');
    });

    it('correctly extracts summary when summaryOnly is true with inline <<::: and :::>>', () => {
        const template = `<<:::INFORMACIÓN GEOGRÁFICA:::
- *UBICACIÓN:* {Ubicación:textarea:req}
{Destino:textarea:req}*:::>>

::: DETALLES :::
- *DETALLE:* {Detalle}
:::`;

        const parsed = parseTemplate(template);
        const destinoSection = parsed.sections.find((s) => s.field_ids.includes('Destino') && s.is_repeatable);

        const summary = renderFinalReport(
            template,
            {
                Ubicación: 'Calle 10',
                [destinoSection!.id]: [
                    { Destino: 'Hospital 1' },
                    { Destino: 'Hospital 2' },
                ],
                Detalle: 'Sin novedad',
            },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {},
            true
        );

        expect(summary).toBe('- *UBICACIÓN:* Calle 10\n- *DESTINO #01:* Hospital 1\n- *DESTINO #02:* Hospital 2');
    });
});
