import { describe, it, expect } from 'vitest';
import {
  compileFieldToken,
  compileFormToTemplateString,
  compileSectionBlock,
  syncSectionsInTemplateText,
  extractSectionsFromTemplateText,
  parseTemplateToFields,
  sanitizeFieldId,
  isFieldTagInText,
  updateFieldTagInText,
  removeFieldTagFromText,
  getMissingFieldTags,
  appendFieldTagToText,
  reorderFieldsInTemplateText,
  FormCreatorModel,
  FormCreatorField,
} from '../template-compiler';
import { parseTemplate } from '@/lib/template-parser';
import { validateTemplateSyntax } from '@/lib/validators';

describe('template-compiler', () => {
  it('sanitizes field ids properly', () => {
    expect(sanitizeFieldId('Nombre:*')).toBe('Nombre');
    expect(sanitizeFieldId('{Edad}')).toBe('Edad');
    expect(sanitizeFieldId('[Observación]')).toBe('Observación');
  });

  it('compiles field tokens with various modifiers', () => {
    expect(
      compileFieldToken({
        id: '1',
        label: 'Nombre y Apellido',
        type: 'text',
        required: true,
        modifier: 'title',
      })
    ).toBe('{Nombre y Apellido:req|title}');

    expect(
      compileFieldToken({
        id: '2',
        label: 'Hora',
        type: 'time-hlv',
        required: true,
      })
    ).toBe('{Hora:time-hlv:req}');

    expect(
      compileFieldToken({
        id: '3',
        label: 'Detalles',
        type: 'textarea',
        isFullWidth: true,
      })
    ).toBe('{Detalles:textarea:full}');

    expect(
      compileFieldToken({
        id: '4',
        label: 'Estado',
        type: 'dropdown',
        options: ['Activo', 'Inactivo', 'Pendiente'],
      })
    ).toBe('{Estado:dropdown(Activo=Activo|Inactivo=Inactivo|Pendiente=Pendiente)}');
  });

  it('compiles a complete form model into valid Minutas template syntax', () => {
    const model: FormCreatorModel = {
      name: 'Reporte de Inspección',
      type: 'normal',
      headerTitle: 'INSPECCIÓN OPERATIVA',
      fields: [
        {
          id: 'f1',
          label: 'Fecha',
          type: 'date',
          required: true,
        },
        {
          id: 'f2',
          label: 'Inspector',
          type: 'text',
          required: true,
          modifier: 'title',
        },
        {
          id: 'f3',
          label: 'Observaciones',
          type: 'textarea',
          isFullWidth: true,
        },
      ],
      sections: [
        {
          id: 's1',
          title: 'Vehículos',
          singularTitle: 'VEHICULO',
          pluralTitle: 'VEHICULOS',
          subLabel: 'VEHICULO',
          fields: [
            {
              id: 'f4',
              label: 'Placa',
              type: 'text',
              modifier: 'upper',
            },
            {
              id: 'f5',
              label: 'Modelo',
              type: 'text',
            },
          ],
        },
      ],
    };

    const compiled = compileFormToTemplateString(model);
    expect(compiled).toContain('*INSPECCIÓN OPERATIVA*');
    expect(compiled).toContain('- *FECHA:* {Fecha:date:req}');
    expect(compiled).toContain('- *INSPECTOR:* {Inspector:req|title}');
    expect(compiled).toContain('- *OBSERVACIONES:* {Observaciones:textarea:full}');
    expect(compiled).toContain('[singular="VEHICULO" plural="VEHICULOS" sub="VEHICULO"');
    expect(compiled).toContain('- *PLACA:* {Placa|upper}');
    expect(compiled).toContain('- *MODELO:* {Modelo}');

    const validation = validateTemplateSyntax(compiled);
    expect(validation.valid).toBe(true);

    const parsed = parseTemplate(compiled);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.fieldNames.has('Fecha')).toBe(true);
    expect(parsed.fieldNames.has('Inspector')).toBe(true);
    expect(parsed.fieldNames.has('Observaciones')).toBe(true);
    expect(parsed.sections).toHaveLength(1);
  });

  it('detects, updates, and protects field tags in template text', () => {
    const field1: FormCreatorField = { id: '1', label: 'Nombre', type: 'text', required: true };
    const field2: FormCreatorField = { id: '2', label: 'Fecha', type: 'date' };
    const field3: FormCreatorField = { id: '3', label: 'Lugar', type: 'text' };

    let text = '*REPORTE*\nEn la fecha {Fecha:date} se atendió a {Nombre:req}.';

    expect(isFieldTagInText(text, field1)).toBe(true);
    expect(isFieldTagInText(text, field2)).toBe(true);
    expect(isFieldTagInText(text, field3)).toBe(false);

    const missing = getMissingFieldTags(text, [field1, field2, field3]);
    expect(missing).toHaveLength(1);
    expect(missing[0]?.id).toBe('3');

    // Appending field
    text = appendFieldTagToText(text, field3);
    expect(isFieldTagInText(text, field3)).toBe(true);

    // Updating field tag when label changes
    const updatedField1: FormCreatorField = { ...field1, label: 'Nombre Completo' };
    text = updateFieldTagInText(text, 'Nombre', updatedField1);
    expect(text).toContain('{Nombre Completo:req}');
    expect(isFieldTagInText(text, updatedField1)).toBe(true);

    // Removing field tag
    text = removeFieldTagFromText(text, field2);
    expect(isFieldTagInText(text, field2)).toBe(false);
  });

  it('compiles and handles separator fields correctly', () => {
    const sepSimple: FormCreatorField = { id: 'sep1', label: 'Separador', type: 'separator' };
    const sepTitled: FormCreatorField = { id: 'sep2', label: 'DATOS DE TRASLADO', type: 'separator' };

    expect(compileFieldToken(sepSimple)).toBe('[""]');
    expect(compileFieldToken(sepTitled)).toBe('["DATOS DE TRASLADO"]');

    const model: FormCreatorModel = {
      name: 'Formulario',
      type: 'normal',
      fields: [
        { id: 'f1', label: 'Origen', type: 'text' },
        sepSimple,
        { id: 'f2', label: 'Destino', type: 'text' },
        sepTitled,
        { id: 'f3', label: 'Paciente', type: 'text' },
      ],
      sections: [],
    };

    const compiled = compileFormToTemplateString(model);
    expect(compiled).toContain('[""]');
    expect(compiled).toContain('["DATOS DE TRASLADO"]');

    const parsed = parseTemplate(compiled);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.sections.some((s) => s.is_separator)).toBe(true);
    expect(parsed.sections.some((s) => s.label === 'DATOS DE TRASLADO')).toBe(true);
  });

  it('compiles, syncs, removes, and extracts repeatable sections', () => {
    const sec1 = {
      id: 's1',
      title: 'Acompañantes',
      singularTitle: 'ACOMPAÑANTE',
      pluralTitle: 'ACOMPAÑANTES',
      subLabel: 'ACOMPAÑANTE',
      fields: [
        { id: 'f1', label: 'Nombre', type: 'text' as const, required: true },
        { id: 'f2', label: 'Cédula', type: 'cedula' as const },
      ],
    };

    const compiledBlock = compileSectionBlock(sec1);
    expect(compiledBlock).toContain('[singular="ACOMPAÑANTE" plural="ACOMPAÑANTES" sub="ACOMPAÑANTE"');
    expect(compiledBlock).toContain('- *NOMBRE:* {Nombre:req}');
    expect(compiledBlock).toContain('- *CÉDULA:* {Cédula:cedula}');
    expect(compiledBlock).toContain(']');

    let template = '*REPORTE DE PATRULLAJE*\n\n- *OFICIAL:* {Oficial}\n';
    template = syncSectionsInTemplateText(template, [sec1]);
    expect(template).toContain('*REPORTE DE PATRULLAJE*');
    expect(template).toContain('{Oficial}');
    expect(template).toContain('[singular="ACOMPAÑANTE"');

    // Extracting sections back from template text
    const extracted = extractSectionsFromTemplateText(template);
    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.singularTitle).toBe('ACOMPAÑANTE');
    expect(extracted[0]?.fields).toHaveLength(2);
    expect(extracted[0]?.fields[0]?.label).toBe('Nombre');
    expect(extracted[0]?.fields[0]?.required).toBe(true);

    // Updating section in text
    const sec1Updated = {
      ...sec1,
      fields: [
        ...sec1.fields,
        { id: 'f3', label: 'Parentesco', type: 'text' as const },
      ],
    };
    template = syncSectionsInTemplateText(template, [sec1Updated]);
    expect(template).toContain('- *PARENTESCO:* {Parentesco}');

    // Removing section from text
    template = syncSectionsInTemplateText(template, []);
    expect(template).not.toContain('ACOMPAÑANTE');
    expect(template).toContain('{Oficial}');
  });

  it('handles repeatable sections inline between fields and parses them in exact order', () => {
    const model: FormCreatorModel = {
      name: 'Inspección',
      type: 'normal',
      fields: [
        { id: 'f1', label: 'Fecha', type: 'date' },
        {
          id: 'sec1',
          label: 'Vehículos',
          type: 'section',
          singularTitle: 'VEHICULO',
          pluralTitle: 'VEHICULOS',
          subLabel: 'VEHICULO',
          fields: [
            { id: 'f_sub1', label: 'Placa', type: 'text', modifier: 'upper' },
            { id: 'f_sub2', label: 'Modelo', type: 'text' },
          ],
        },
        { id: 'f2', label: 'Observaciones', type: 'textarea' },
      ],
    };

    const compiled = compileFormToTemplateString(model);
    expect(compiled).toContain('- *FECHA:* {Fecha:date}');
    expect(compiled).toContain('[singular="VEHICULO" plural="VEHICULOS" sub="VEHICULO"');
    expect(compiled).toContain('- *PLACA:* {Placa|upper}');
    expect(compiled).toContain('- *OBSERVACIONES:* {Observaciones:textarea}');

    // Verify sequential order in compiled text
    const idxFecha = compiled.indexOf('FECHA');
    const idxSec = compiled.indexOf('singular="VEHICULO"');
    const idxObs = compiled.indexOf('OBSERVACIONES');
    expect(idxFecha).toBeLessThan(idxSec);
    expect(idxSec).toBeLessThan(idxObs);

    // Verify parsing back to fields in exact order
    const fieldsParsed = parseTemplateToFields(compiled);
    expect(fieldsParsed).toHaveLength(3);
    expect(fieldsParsed[0]?.label).toBe('Fecha');
    expect(fieldsParsed[1]?.type).toBe('section');
    expect(fieldsParsed[1]?.label).toBe('VEHICULO');
    expect(fieldsParsed[1]?.fields).toHaveLength(2);
    expect(fieldsParsed[1]?.fields?.[0]?.label).toBe('Placa');
    expect(fieldsParsed[2]?.label).toBe('Observaciones');

    // Verify reordering fields puts section first
    const reorderedFields = [model.fields[1]!, model.fields[0]!, model.fields[2]!];
    const reorderedText = reorderFieldsInTemplateText(compiled, reorderedFields);
    const newIdxSec = reorderedText.indexOf('singular="VEHICULO"');
    const newIdxFecha = reorderedText.indexOf('FECHA');
    expect(newIdxSec).toBeLessThan(newIdxFecha);
  });

  it('correctly loads and round-trips existing real-world templates for form editing', () => {
    const existingTemplateContent = `*MINUTA DE NOVEDADES*

- *FECHA:* {Fecha:date:req}
- *HORA:* {Hora:time:req}
- *TURNO:* {Turno:dropdown(Mañana=Mañana|Tarde=Tarde|Noche=Noche)}

["PERSONAL DE GUARDIA"]

[singular="FUNCIONARIO" plural="FUNCIONARIOS" sub="FUNCIONARIO"
- *NOMBRE:* {Nombre:req}
- *RANGO:* {Rango}
- *CÉDULA:* {Cédula:cedula}
]

---

- *RESUMEN DE NOVEDADES:* {Novedades:textarea:full}
`;

    const parsedFields = parseTemplateToFields(existingTemplateContent);
    expect(parsedFields.length).toBeGreaterThanOrEqual(6);

    // Verify fields order and types
    expect(parsedFields[0]?.label).toBe('Fecha');
    expect(parsedFields[0]?.type).toBe('date');
    expect(parsedFields[0]?.required).toBe(true);

    expect(parsedFields[1]?.label).toBe('Hora');
    expect(parsedFields[1]?.type).toBe('time-hlv');

    expect(parsedFields[2]?.label).toBe('Turno');
    expect(parsedFields[2]?.type).toBe('dropdown');
    expect(parsedFields[2]?.options).toEqual(['Mañana', 'Tarde', 'Noche']);

    // Separator with custom title
    const separatorField = parsedFields.find((f) => f.type === 'separator');
    expect(separatorField).toBeDefined();

    // Section
    const sectionField = parsedFields.find((f) => f.type === 'section');
    expect(sectionField).toBeDefined();
    expect(sectionField?.fields?.length).toBe(3);
    expect(sectionField?.fields?.[0]?.label).toBe('Nombre');
    expect(sectionField?.fields?.[0]?.required).toBe(true);
    expect(sectionField?.fields?.[2]?.type).toBe('cedula');

    // Textarea field
    const textareaField = parsedFields.find((f) => f.label === 'Novedades');
    expect(textareaField).toBeDefined();
    expect(textareaField?.type).toBe('textarea');
    expect(textareaField?.isFullWidth).toBe(true);
  });

  it('supports standard (non-repeatable) sections compilation, parsing, and tag manipulation', () => {
    // 1. Compilation of standard section
    const standardSection: FormCreatorField = {
      id: 'sec_std_1',
      label: 'DATOS GENERALES',
      type: 'section',
      isRepeatable: false,
      fields: [
        { id: 'f1', label: 'Nombre', type: 'text', required: true },
        { id: 'f2', label: 'Edad', type: 'text' },
      ],
    };

    const compiledBlock = compileSectionBlock(standardSection);
    expect(compiledBlock).toContain('[DATOS GENERALES]');
    expect(compiledBlock).toContain('- *NOMBRE:* {Nombre:req}');
    expect(compiledBlock).toContain('- *EDAD:* {Edad}');
    expect(compiledBlock).toContain('[/]');
    expect(compiledBlock).not.toContain('singular=');

    // 2. Compilation of full model with standard section
    const model: FormCreatorModel = {
      name: 'Formulario Mixto',
      type: 'normal',
      headerTitle: 'REPORTE GENERAL',
      fields: [
        { id: 'root_1', label: 'Fecha', type: 'date' },
        standardSection,
        {
          id: 'sec_rep_1',
          label: 'Vehículos',
          type: 'section',
          isRepeatable: true,
          singularTitle: 'VEHICULO',
          pluralTitle: 'VEHICULOS',
          subLabel: 'VEHICULO',
          fields: [{ id: 'f3', label: 'Placa', type: 'text' }],
        },
      ],
    };

    const compiledTemplate = compileFormToTemplateString(model);
    expect(compiledTemplate).toContain('*REPORTE GENERAL*');
    expect(compiledTemplate).toContain('- *FECHA:* {Fecha:date}');
    expect(compiledTemplate).toContain('[DATOS GENERALES]');
    expect(compiledTemplate).toContain('[/]');
    expect(compiledTemplate).toContain('[singular="VEHICULO"');

    // 3. Parsing standard section back into FormCreatorField
    const parsed = parseTemplateToFields(compiledTemplate);
    const parsedStd = parsed.find((f) => f.label === 'DATOS GENERALES');
    expect(parsedStd).toBeDefined();
    expect(parsedStd?.type).toBe('section');
    expect(parsedStd?.isRepeatable).toBe(false);
    expect(parsedStd?.fields?.length).toBe(2);
    expect(parsedStd?.fields?.[0]?.label).toBe('Nombre');
    expect(parsedStd?.fields?.[0]?.required).toBe(true);
    expect(parsedStd?.fields?.[1]?.label).toBe('Edad');

    // Repeatable section is also parsed
    const parsedRep = parsed.find((f) => f.type === 'section' && f.isRepeatable);
    expect(parsedRep).toBeDefined();
    expect(parsedRep?.fields?.length).toBe(1);
    expect(parsedRep?.fields?.[0]?.label).toBe('Placa');

    // 4. isFieldTagInText, updateFieldTagInText, and removeFieldTagFromText for standard section
    expect(isFieldTagInText(compiledTemplate, standardSection)).toBe(true);

    const updatedSection: FormCreatorField = {
      ...standardSection,
      label: 'INFORMACIÓN PERSONAL',
    };
    const updatedTemplate = updateFieldTagInText(compiledTemplate, standardSection.label, updatedSection);
    expect(updatedTemplate).toContain('[INFORMACIÓN PERSONAL]');
    expect(updatedTemplate).not.toContain('[DATOS GENERALES]');

    const removedTemplate = removeFieldTagFromText(updatedTemplate, updatedSection);
    expect(removedTemplate).not.toContain('[INFORMACIÓN PERSONAL]');
    expect(removedTemplate).toContain('- *FECHA:* {Fecha:date}');
  });
});

