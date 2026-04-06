/**
 * Test: secciones auto-contenidas dentro de bloque condicional :show se renderizan correctamente
 */
import { parseTemplate, renderFinalReport } from '../../template-parser';

const TEMPLATE = `[?Estatus=Finalizado:show]
["Comisiones en sitio"- *COMISIONES EN SITIO:*
{Comisiones:textarea}]

- *DATOS OPERACIONALES:*["Datos operacionales"
- *UNIDAD:* {Unidad}
- *TÉCNICO:* {Técnico}
- *CONDUCTOR:* {Conductor}]*
[/]
- *ESTATUS:* {Estatus}`;

test('self-contained nested sections inside :show conditional render when condition is met', () => {
    const config = parseTemplate(TEMPLATE);
    expect(config.errors).toHaveLength(0);

    const data = {
        Estatus: 'Finalizado',
        Comisiones: 'PC GUANTA al mando de John Doe',
        'sec_datos_operacionales': [
            { Unidad: 'VH-01', Técnico: 'Pedro', Conductor: 'Juan' }
        ],
    };

    const rendered = renderFinalReport(TEMPLATE, data as never, {
        sections: config.sections,
        layout: config.layout,
        fields: {},
    }, {});

    console.log('Rendered:\n', rendered);

    // The conditional block content should appear since Estatus = 'Finalizado'
    expect(rendered).toContain('COMISIONES EN SITIO');
    expect(rendered).toContain('PC GUANTA al mando de John Doe');
    expect(rendered).toContain('DATOS OPERACIONALES');
    expect(rendered).toContain('VH-01');
    expect(rendered).toContain('Pedro');
    // Estatus field should always show
    expect(rendered).toContain('- *ESTATUS:* Finalizado');
});

test('self-contained nested sections inside a :show conditional are hidden from report when condition NOT met', () => {
    const config = parseTemplate(TEMPLATE);

    const data = {
        Estatus: 'En proceso',
        Comisiones: 'PC GUANTA al mando de John Doe',
        'sec_datos_operacionales': [
            { Unidad: 'VH-01', Técnico: 'Pedro', Conductor: 'Juan' }
        ],
    };

    const rendered = renderFinalReport(TEMPLATE, data as never, {
        sections: config.sections,
        layout: config.layout,
        fields: {},
    }, {});

    console.log('Rendered (condition NOT met):\n', rendered);

    // Conditional block should NOT appear since Estatus != 'Finalizado'
    expect(rendered).not.toContain('COMISIONES EN SITIO');
    expect(rendered).not.toContain('PC GUANTA');
    // Estatus field should still show
    expect(rendered).toContain('- *ESTATUS:* En proceso');
});
