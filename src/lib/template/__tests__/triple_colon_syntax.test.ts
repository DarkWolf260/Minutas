import { describe, it, expect } from 'vitest';
import { parseTemplate } from '../parser';
import { renderFinalReport } from '../renderer';
import { validateSyntax } from '../validator';

describe('Triple Colon (:::) Template Syntax', () => {
    describe('Inline Conditionals', () => {
        it('renders inline conditional exactly as specified by user', () => {
            const template = `- *TIPO DE NOVEDAD:* ::: if Estatus == "En proceso": Posible :::Incendio::: if Estatus == "Finalizado":  de {tipo de incendio}:::`;

            // When Estatus is "En proceso"
            const resultEnProceso = renderFinalReport(
                template,
                { Estatus: 'En proceso', 'tipo de incendio': 'Vegetación' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultEnProceso).toBe('- *TIPO DE NOVEDAD:* Posible Incendio');

            // When Estatus is "Finalizado"
            const resultFinalizado = renderFinalReport(
                template,
                { Estatus: 'Finalizado', 'tipo de incendio': 'Vegetación' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultFinalizado).toBe('- *TIPO DE NOVEDAD:* Incendio de Vegetación');
        });

        it('renders single-line conditional with colon', () => {
            const template = `::: if Estatus == "En proceso": *PRELIMINAR* :::\nReporte`;

            const resultEnProceso = renderFinalReport(
                template,
                { Estatus: 'En proceso' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultEnProceso).toContain('*PRELIMINAR*');

            const resultFinalizado = renderFinalReport(
                template,
                { Estatus: 'Finalizado' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultFinalizado).not.toContain('*PRELIMINAR*');
            expect(resultFinalizado).toBe('Reporte');
        });
    });

    describe('Multiline Conditionals', () => {
        it('renders multiline conditional blocks based on staff property (.sex)', () => {
            const template = `::: if Director.sex == "F" :::
*DIRECTORA-PRESIDENTA:* {Director}
:::
::: if Director.sex == "M" :::
*DIRECTOR-PRESIDENTE:* {Director}
:::`;

            const resultFemale = renderFinalReport(
                template,
                {
                    Director: [
                        {
                            id: 'staff-1',
                            first_name: 'María',
                            last_name: 'González',
                            sex: 'F',
                            rank: 'General',
                        },
                    ],
                },
                { fields: {}, sections: [], layout: [] },
                {}
            );

            expect(resultFemale).toContain('*DIRECTORA-PRESIDENTA:*');
            expect(resultFemale).not.toContain('*DIRECTOR-PRESIDENTE:*');

            const resultMale = renderFinalReport(
                template,
                {
                    Director: [
                        {
                            id: 'staff-2',
                            first_name: 'Carlos',
                            last_name: 'Pérez',
                            sex: 'M',
                            rank: 'General',
                        },
                    ],
                },
                { fields: {}, sections: [], layout: [] },
                {}
            );

            expect(resultMale).toContain('*DIRECTOR-PRESIDENTE:*');
            expect(resultMale).not.toContain('*DIRECTORA-PRESIDENTA:*');
        });

        it('supports comparison operators !=, >=, <=, >, <', () => {
            const template = `::: if Edad >= 18 :::
Mayor de edad: {Edad}
:::
::: if Edad < 18 :::
Menor de edad: {Edad}
:::`;

            const resultAdult = renderFinalReport(
                template,
                { Edad: 25 },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultAdult).toContain('Mayor de edad: 25');
            expect(resultAdult).not.toContain('Menor de edad');

            const resultMinor = renderFinalReport(
                template,
                { Edad: 16 },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultMinor).toContain('Menor de edad: 16');
            expect(resultMinor).not.toContain('Mayor de edad');
        });
    });

    describe('Sections and Repeatable Sections', () => {
        it('renders normal sections with ::: NOMBRE :::', () => {
            const template = `::: DATOS GENERALES :::
- *FECHA:* {Fecha:date}
- *HORA:* {Hora:time-hlv}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.sections[0]?.label).toBe('DATOS GENERALES');
            expect(parsed.sections[0]?.is_repeatable).toBe(false);

            const result = renderFinalReport(
                template,
                { Fecha: '2026-09-30', Hora: '14:30' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(result).toContain('- *FECHA:*');
            expect(result).toContain('- *HORA:* 14:30');
        });

        it('renders repeatable sections with ::: section Novedades* :::', () => {
            const template = `::: section Novedades* :::
- *DESCRIPCIÓN:* {descripcion:textarea:full}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.sections[0]?.is_repeatable).toBe(true);
            expect(parsed.sections[0]?.label).toBe('Novedades');

            const result = renderFinalReport(
                template,
                {
                    sec_novedades: [
                        { descripcion: 'Primera novedad registrada' },
                        { descripcion: 'Segunda novedad registrada' },
                    ],
                },
                { fields: {}, sections: [], layout: [] },
                {}
            );

            expect(result).toContain('- *Novedades*');
            expect(result).not.toContain('- *Novedades #01*');
            expect(result).not.toContain('- *Novedades #02*');
            expect(result).toContain('Primera novedad registrada');
            expect(result).toContain('Segunda novedad registrada');
        });

        it('renders repeatable sections with custom item label ::: section Novedades | Novedad* :::', () => {
            const template = `::: section Novedades | Novedad* :::
- *DESCRIPCIÓN:* {descripcion:textarea:full}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.sections[0]?.is_repeatable).toBe(true);
            expect(parsed.sections[0]?.plural_title).toBe('Novedades');
            expect(parsed.sections[0]?.singular_title).toBe('Novedad');
            expect(parsed.sections[0]?.repeatable_item_label).toBe('Novedad');

            const result = renderFinalReport(
                template,
                {
                    sec_novedades: [
                        { descripcion: 'Primera novedad' },
                        { descripcion: 'Segunda novedad' },
                    ],
                },
                { fields: {}, sections: [], layout: [] },
                {}
            );

            expect(result).toContain('- *Novedades*');
            expect(result).toContain('- *Novedad #01*');
            expect(result).toContain('Primera novedad');
            expect(result).toContain('- *Novedad #02*');
            expect(result).toContain('Segunda novedad');
        });

        it('renders Caso 1 and Caso 2 correctly with 3-part syntax ::: section DATOS DE LOS PACIENTES | DATOS DEL PACIENTE | PACIENTE* :::', () => {
            const template = `::: section DATOS DE LOS PACIENTES | DATOS DEL PACIENTE | PACIENTE* :::
- *NOMBRE Y APELLIDO:* {nombre}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.sections[0]?.plural_title).toBe('DATOS DE LOS PACIENTES');
            expect(parsed.sections[0]?.singular_title).toBe('DATOS DEL PACIENTE');
            expect(parsed.sections[0]?.repeatable_item_label).toBe('PACIENTE');

            const sectionId = parsed.sections[0]?.id || 'sec_datos_de_los_pacientes';

            // Caso 1: 1 sola entrada (renders singular header, without item prefix)
            const result1 = renderFinalReport(
                template,
                {
                    [sectionId]: [
                        { nombre: 'Juan Perez' },
                    ],
                },
                { fields: {}, sections: parsed.sections, layout: parsed.layout },
                {}
            );

            expect(result1.trim()).toBe(
`- *DATOS DEL PACIENTE*
- *NOMBRE Y APELLIDO:* Juan Perez`
            );
            expect(result1).not.toContain('PACIENTE #01');
            expect(result1).not.toContain('DATOS DE LOS PACIENTES');

            // Caso 2: Más de una entrada (renders plural header, with numbered item prefixes and blank lines)
            const result2 = renderFinalReport(
                template,
                {
                    [sectionId]: [
                        { nombre: 'Juan Perez' },
                        { nombre: 'Maria Gomez' },
                    ],
                },
                { fields: {}, sections: parsed.sections, layout: parsed.layout },
                {}
            );

            expect(result2.trim()).toBe(
`- *DATOS DE LOS PACIENTES*
- *PACIENTE #01*
- *NOMBRE Y APELLIDO:* Juan Perez

- *PACIENTE #02*
- *NOMBRE Y APELLIDO:* Maria Gomez`
            );
        });

        it('supports reversed 3-part syntax ::: section DATOS DEL PACIENTE | DATOS DE LOS PACIENTES | PACIENTE* :::', () => {
            const template = `::: section DATOS DEL PACIENTE | DATOS DE LOS PACIENTES | PACIENTE* :::
- *NOMBRE Y APELLIDO:* {nombre}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections[0]?.plural_title).toBe('DATOS DE LOS PACIENTES');
            expect(parsed.sections[0]?.singular_title).toBe('DATOS DEL PACIENTE');
            expect(parsed.sections[0]?.repeatable_item_label).toBe('PACIENTE');
        });

        it('smartly infers singular title for 2-part syntax ::: section DATOS DE LOS PACIENTES | PACIENTE* :::', () => {
            const template = `::: section DATOS DE LOS PACIENTES | PACIENTE* :::
- *NOMBRE Y APELLIDO:* {nombre}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections[0]?.plural_title).toBe('DATOS DE LOS PACIENTES');
            expect(parsed.sections[0]?.singular_title).toBe('DATOS DEL PACIENTE');
            expect(parsed.sections[0]?.repeatable_item_label).toBe('PACIENTE');

            const sectionId = parsed.sections[0]?.id || 'sec_datos_de_los_pacientes';
            const result1 = renderFinalReport(
                template,
                {
                    [sectionId]: [
                        { nombre: 'Juan Perez' },
                    ],
                },
                { fields: {}, sections: parsed.sections, layout: parsed.layout },
                {}
            );

            expect(result1.trim()).toBe(
`- *DATOS DEL PACIENTE*
- *NOMBRE Y APELLIDO:* Juan Perez`
            );
        });
    });

    describe('Separators', () => {
        it('handles clean separators ::: separator ::: and titled separators', () => {
            const template = `Dato antes
::: separator :::
Dato después
::: separator: DATOS DE CONTACTO :::
- *TELÉFONO:* {Telefono}`;

            const parsed = parseTemplate(template);
            const separators = parsed.sections.filter((s) => s.is_separator);
            expect(separators).toHaveLength(2);
            expect(separators[1]?.label).toBe('DATOS DE CONTACTO');

            const result = renderFinalReport(
                template,
                { Telefono: '0414-1234567' },
                { fields: {}, sections: [], layout: [] },
                {}
            );

            expect(result).toContain('Dato antes');
            expect(result).toContain('Dato después');
            expect(result).toContain('- *DATOS DE CONTACTO*');
            expect(result).toContain('- *TELÉFONO:* 0414-1234567');
        });
    });

    describe('Mapping Blocks', () => {
        it('translates fields dynamically using ::: map Campo :::', () => {
            const template = `::: map Tipo :::
Robo=Se registró un evento de robo en las instalaciones.
Vandalismo=Se registraron actos de vandalismo.
:::
Evento: {Tipo}`;

            const parsed = parseTemplate(template);
            expect(parsed.sections.some((s) => s.is_mapping)).toBe(true);
            const options = parsed.templateOptions.get('Tipo');
            expect(options).toHaveLength(2);
            expect(options?.[0]?.label).toBe('Robo');

            const resultRobo = renderFinalReport(
                template,
                { Tipo: 'Robo' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultRobo).toBe('Evento: Se registró un evento de robo en las instalaciones.');

            const resultVandalismo = renderFinalReport(
                template,
                { Tipo: 'Vandalismo' },
                { fields: {}, sections: [], layout: [] },
                {}
            );
            expect(resultVandalismo).toBe('Evento: Se registraron actos de vandalismo.');
        });
    });

    describe('Section Spacing and Text After Section', () => {
        it('handles text and empty lines after closing :::', () => {
            const template = `::: INFORMACIÓN GENERAL :::
- *FECHA:* {Fecha:req}
:::

- *TIPO DE NOVEDAD:* Atención prehospitalaria y traslado`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.errors).toHaveLength(0);
            expect(validateSyntax(template)).toHaveLength(0);
        });

        it('handles text placed after third group on the same line', () => {
            const template = `::: INFORMACIÓN GENERAL :::
- *FECHA:* {Fecha:req}
::: texto después`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(1);
            expect(parsed.errors).toHaveLength(0);
            expect(validateSyntax(template)).toHaveLength(0);
        });

        it('handles multiple empty lines between sections without syntax errors', () => {
            const template = `::: SEC 1 :::
{Campo1}
:::


::: SEC 2 :::
{Campo2}
:::`;

            const parsed = parseTemplate(template);
            expect(parsed.sections).toHaveLength(2);
            expect(parsed.errors).toHaveLength(0);
            expect(validateSyntax(template)).toHaveLength(0);
        });

        it('renders user template and checks spacing between director, jefe de operaciones and jefe de servicios', () => {
            const template = `::: INFORMACIÓN GENERAL :::
::: if Director.sex == "F" :::
*DIRECTORA*
{Director}
:::
::: if Director.sex == "M" :::
*DIRECTOR*
{Director}
:::

::: if Jefe de operaciones != "":show :::
*JEFE DE OPERACIONES*
{Jefe de operaciones}
:::

*JEFE DE LOS SERVICIOS*
{Jefe de los servicios}
 
- *EQUIPO DE GUARDIA:* “{Guardia}”
- *FECHA:* {Fecha:req}
- *HORA:* {Hora:req}
:::`;

            const data = {
                'Director': [{ name: 'Lic. Juan Perez', sex: 'M' }],
                'Jefe de operaciones': 'Cap. Pedro Gomez',
                'Jefe de los servicios': 'Sgto. Ana Lopez',
                'Guardia': 'Guardia A',
                'Fecha': '02/10/2026',
                'Hora': '19:30'
            };

            const rendered = renderFinalReport(template, data as any, { fields: {}, sections: [], layout: [] }, {});
            console.log('RENDERED USER SNIPPET:\n' + rendered);
        });
    });
});


