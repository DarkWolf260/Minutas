import { describe, it, expect } from 'vitest';
import { parseTemplate, renderFinalReport } from '../index';
import { validateSemantics } from '../validator';

describe('Technical Debt Fixes & Engine Invariants', () => {
    it('applies default values when fields are empty in data for renderFinalReport', () => {
        const template = [
            'Estatus: {Estatus:default("Pendiente")}',
            'Nota: {Nota:def=(Sin novedad)}',
            'Comentario: {Comentario:text}',
        ].join('\n');

        const parsed = parseTemplate(template);
        expect(parsed.errors).toHaveLength(0);

        // Render with empty data object
        const result = renderFinalReport(
            template,
            {},
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {}
        );

        expect(result).toContain('Estatus: Pendiente');
        expect(result).toContain('Nota: Sin novedad');
        expect(result).not.toContain('{Comentario:text}');
    });

    it('isolates regex cache between different templates with identical section IDs', () => {
        const templateA = `::: section novedades* :::
Template A content: {campoA}
:::`;
        const templateB = `::: section novedades* :::
Template B content: {campoB}
:::`;

        const parsedA = parseTemplate(templateA);
        const parsedB = parseTemplate(templateB);

        const renderedA = renderFinalReport(
            templateA,
            { sec_novedades: [{ campoA: 'Valor Alpha' }] },
            { fields: {}, sections: parsedA.sections, layout: parsedA.layout },
            {}
        );
        const renderedB = renderFinalReport(
            templateB,
            { sec_novedades: [{ campoB: 'Valor Beta' }] },
            { fields: {}, sections: parsedB.sections, layout: parsedB.layout },
            {}
        );

        expect(renderedA).toContain('Template A content: Valor Alpha');
        expect(renderedB).toContain('Template B content: Valor Beta');
    });

    it('flags semantic error when condition references an undeclared field', () => {
        const template = `::: if CampoDesconocido == "Invalido" :::
Contenido
:::
{CampoExistente:text}`;

        const parsed = parseTemplate(template);
        expect(parsed.errors.some(e => e.includes('CampoDesconocido'))).toBe(true);
    });

    it('permits predefined system variables in conditions without declaring them as fields', () => {
        const template = `::: if Estado == "Anzoátegui" :::
Estado Valido
:::
::: if Fecha != "" :::
Fecha Valida
:::`;

        const parsed = parseTemplate(template);
        expect(parsed.errors).toHaveLength(0);
    });

    it('supports Spanish diacritics including ü and Ü in condition field identifiers', () => {
        const template = `::: if ¿Hubo ambigüedad? == "Sí" :::
Aclaración necesaria
:::
{¿Hubo ambigüedad?:dropdown(Sí=Sí|No=No)}`;

        const parsed = parseTemplate(template);
        expect(parsed.errors).toHaveLength(0);

        const result = renderFinalReport(
            template,
            { '¿Hubo ambigüedad?': 'Sí' },
            { fields: {}, sections: parsed.sections, layout: parsed.layout },
            {}
        );

        expect(result).toContain('Aclaración necesaria');
    });

    it('correctly handles escaped braces without reporting false positive brace imbalance', () => {
        const template = 'Texto con llaves escapadas \\{ y literal {{ sin cerrar';
        const parsed = parseTemplate(template);
        expect(parsed.errors).toHaveLength(0);
    });

    it('detects orphan closing ::: blocks in template syntax validation', () => {
        const template = `::: if Estatus == "Finalizado" :::
Contenido
:::
:::`;
        const parsed = parseTemplate(template);
        expect(parsed.errors.some(e => e.includes('huérfanos') || e.includes('adicionales'))).toBe(true);
    });
});
