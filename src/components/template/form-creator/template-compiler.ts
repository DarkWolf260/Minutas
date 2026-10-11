import type { FieldType } from '@/lib/types';
import { parseTemplate } from '@/lib/template-parser';

export type FormCreatorFieldType = FieldType | 'separator' | 'section';

export interface FormCreatorField {
  id: string;
  label: string;
  type: FormCreatorFieldType;
  required?: boolean;
  isFullWidth?: boolean;
  modifier?: 'none' | 'upper' | 'title' | 'lower';
  options?: string[];
  defaultValue?: string;
  // Section properties (when type === 'section'):
  isRepeatable?: boolean;
  singularTitle?: string;
  pluralTitle?: string;
  subLabel?: string;
  fields?: FormCreatorField[];
}

export interface FormCreatorSection {
  id: string;
  title: string;
  isRepeatable?: boolean;
  singularTitle: string;
  pluralTitle: string;
  subLabel: string;
  fields: FormCreatorField[];
}

export interface FormCreatorModel {
  name: string;
  type: 'normal' | 'relevante';
  headerTitle?: string;
  fields: FormCreatorField[];
  sections?: FormCreatorSection[];
}

/**
 * Reserved system tags that are dynamically injected at runtime by the system
 * and must NEVER be treated as interactive form fields in the template creator.
 */
export const SYSTEM_TAGS = new Set(['enc', 'pie', 'usuario', 'estatus', 'photos']);

/**
 * Checks whether a tag, field ID, or label represents a system-controlled special tag
 * (e.g. Enc, Pie, Usuario, Estatus, photos) or a dot-notation property (e.g. Director.sex).
 */
export function isSystemFieldTag(tagOrLabel: string): boolean {
  if (!tagOrLabel) return false;
  const rawId = tagOrLabel.replace(/[{}[\]]/g, '').trim().split(/[:|=]/)[0]?.trim() || '';
  if (!rawId) return false;
  const clean = sanitizeFieldId(rawId).toLowerCase();
  if (SYSTEM_TAGS.has(clean)) return true;
  if (clean.includes('.')) return true;
  return false;
}

/**
 * Normalizes a field label to be used inside placeholder tokens {Label:...}
 * Cleans colons, braces, brackets, and extra spaces.
 */
export function sanitizeFieldId(label: string): string {
  const clean = label.replace(/[{}[\]:|=*]/g, '').trim();
  return clean || 'Campo';
}

/**
 * Generates the token string for a single field or separator.
 * Example field: `{Nombre:text:full:req|upper}`
 * Example separator: `[""]` or `["DATOS DE CONTACTO"]`
 */
export function compileFieldToken(field: FormCreatorField): string {
  if (field.type === 'section') {
    return '';
  }

  if (field.type === 'separator') {
    return '::: --- :::';
  }

  const id = sanitizeFieldId(field.label);
  const parts: string[] = [];

  // Dropdown with options
  if (field.type === 'dropdown' && field.options && field.options.length > 0) {
    const validOpts = field.options.map((o) => o.trim()).filter(Boolean);
    if (validOpts.length > 0) {
      const optsString = validOpts.map((opt) => `${opt}=${opt}`).join('|');
      parts.push(`dropdown(${optsString})`);
    } else {
      parts.push('dropdown');
    }
  } else if (field.type && field.type !== 'text') {
    parts.push(field.type);
  }

  // Full width modifier
  if (field.isFullWidth) {
    parts.push('full');
  }

  // Required modifier
  if (field.required) {
    parts.push('req');
  }

  // Default value
  if (field.defaultValue && field.defaultValue.trim()) {
    const cleanDef = field.defaultValue.replace(/[{}]/g, '').trim();
    if (cleanDef) {
      parts.push(`default(${cleanDef})`);
    }
  }

  // Text case modifier
  let tagBody = [id, ...parts].join(':');
  if (field.modifier && field.modifier !== 'none') {
    tagBody += `|${field.modifier}`;
  }

  return `{${tagBody}}`;
}

/**
 * Compiles a single section (standard or repeatable) into its template block string.
 */
export function compileSectionBlock(section: FormCreatorSection | FormCreatorField): string {
  const labelOrTitle = 'label' in section ? section.label : section.title;
  const isRep = 'isRepeatable' in section ? section.isRepeatable !== false : true;

  if (!isRep) {
    const title = (labelOrTitle || 'SECCIÓN').toUpperCase().trim();
    const lines: string[] = [];
    lines.push(`::: ${title} :::`);
    (section.fields || []).forEach((field) => {
      const token = compileFieldToken(field);
      const labelUpper = sanitizeFieldId(field.label).toUpperCase();
      lines.push(`- *${labelUpper}:* ${token}`);
    });
    lines.push(':::');
    return lines.join('\n');
  }

  const singular = (section.singularTitle || labelOrTitle || 'ITEM').toUpperCase().trim();
  const plural = (section.pluralTitle || `${singular}S`).toUpperCase().trim();
  const sub = (section.subLabel || singular).toUpperCase().trim();

  const lines: string[] = [];
  let header: string;
  if (singular && singular !== plural && sub && sub !== singular && sub !== 'ITEM') {
    header = `::: section ${plural} | ${singular} | ${sub}* :::`;
  } else if (plural !== sub && sub !== 'ITEM') {
    header = `::: section ${plural} | ${sub}* :::`;
  } else if (singular && singular !== plural) {
    header = `::: section ${plural} | ${singular}* :::`;
  } else {
    header = `::: section ${plural}* :::`;
  }
  lines.push(header);
  (section.fields || []).forEach((field) => {
    const token = compileFieldToken(field);
    const labelUpper = sanitizeFieldId(field.label).toUpperCase();
    lines.push(`- *${labelUpper}:* ${token}`);
  });
  lines.push(':::');
  return lines.join('\n');
}

/**
 * Removes all section blocks (standard and repeatable) from the template text, leaving headers and root fields.
 */
function removeAllSectionsFromText(text: string): string {
  if (!text) return '';
  const pattern = /:::\s*(?:section\s+[\s\S]*?|[^:\r\n]+)\s*:::[\s\S]*?:::/gi;
  return text.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Synchronizes repeatable section blocks in the template text.
 * Replaces any existing repeatable sections with the compiled blocks of the provided sections.
 */
export function syncSectionsInTemplateText(
  text: string,
  sections: (FormCreatorSection | FormCreatorField)[]
): string {
  const baseText = removeAllSectionsFromText(text);
  if (sections.length === 0) {
    return baseText;
  }
  const compiledSections = sections.map((s) => compileSectionBlock(s as FormCreatorSection)).join('\n\n');
  return baseText ? `${baseText}\n\n${compiledSections}` : compiledSections;
}

/**
 * Extracts repeatable sections from a template text string using the template parser.
 */
export function extractSectionsFromTemplateText(text: string): FormCreatorSection[] {
  if (!text || !text.trim()) return [];
  const parsed = parseTemplate(text);
  const repeatableSections = parsed.sections.filter((s) => s.is_repeatable && !s.is_virtual);

  return repeatableSections.map((sec, idx) => {
    const singular = sec.singular_title || sec.label || `ITEM ${idx + 1}`;
    const plural = sec.plural_title || `${singular}S`;
    const sub = sec.repeatable_item_label || singular;

    const fields: FormCreatorField[] = (sec.field_ids || [])
      .filter((fieldId) => !isSystemFieldTag(fieldId))
      .map((fieldId, fIdx) => {
        const fieldType = parsed.fieldTypes.get(fieldId) || 'text';
        const options = parsed.templateOptions.get(fieldId)?.map((o) => o.value);
        const isReq = parsed.requiredFields.get(fieldId) || false;
        const isFull = parsed.fieldWidths.get(fieldId) || false;
        const modifier = (parsed.fieldModifiers.get(fieldId)?.[0] as FormCreatorField['modifier']) || 'none';
        const defaultValue = parsed.defaultValues.get(fieldId);

        return {
          id: `sec_f_${idx}_${fIdx}_${Date.now()}`,
          label: fieldId,
          type: fieldType as FormCreatorFieldType,
          required: isReq,
          isFullWidth: isFull,
          modifier: modifier,
          options: options && options.length > 0 ? options : (fieldType === 'dropdown' ? ['Opción 1', 'Opción 2'] : undefined),
          defaultValue: defaultValue,
        };
      });

    return {
      id: `sec_${idx}_${Date.now()}`,
      title: sec.label || singular,
      singularTitle: singular,
      pluralTitle: plural,
      subLabel: sub,
      fields,
    };
  });
}

/**
 * Flattens all fields, including those inside repeatable sections.
 */
export function getAllFieldsFlat(fields: FormCreatorField[]): FormCreatorField[] {
  const result: FormCreatorField[] = [];
  fields.forEach((f) => {
    result.push(f);
    if (f.type === 'section' && f.fields) {
      f.fields.forEach((inner) => result.push(inner));
    }
  });
  return result;
}

/**
 * Parses a template text string into an array of FormCreatorField,
 * preserving the exact sequential order of root fields, separators, and repeatable sections.
 * Automatically excludes special system tags ({Enc}, {pie}, {usuario}, {estatus}, {photos}, etc.)
 * and derived property tags ({Director.sex}) so they never appear as interactive form fields.
 */
export function parseTemplateToFields(text: string): FormCreatorField[] {
  if (!text || !text.trim()) return [];
  const parsed = parseTemplate(text);

  const sectionsMap = new Map<string, any>();
  parsed.sections.forEach((sec) => {
    sectionsMap.set(sec.id, sec);
    if (sec.label) sectionsMap.set(sec.label.toLowerCase(), sec);
    if (sec.singular_title) sectionsMap.set(sec.singular_title.toLowerCase(), sec);
  });

  const fields: FormCreatorField[] = [];
  const processedFieldIds = new Set<string>();

  // Process items in layout order
  parsed.layout.forEach((itemId, idx) => {
    // Special system tags (Enc, Pie, Usuario, Estatus, photos) and dot-notation property tags
    // must NOT be turned into user questions/fields in the form creator
    if (isSystemFieldTag(itemId)) {
      return;
    }

    const matchedSection = sectionsMap.get(itemId) || sectionsMap.get(itemId.toLowerCase());

    if (matchedSection) {
      if (matchedSection.is_separator) {
        fields.push({
          id: `sep_${idx}_${Date.now()}`,
          label: matchedSection.label || 'Separador',
          type: 'separator',
        });
        return;
      }

      const isRep = !!matchedSection.is_repeatable;
      const singular = matchedSection.singular_title || matchedSection.label || `ITEM ${idx + 1}`;
      const plural = matchedSection.plural_title || `${singular}S`;
      const sub = matchedSection.repeatable_item_label || singular;

      const innerFields: FormCreatorField[] = (matchedSection.field_ids || [])
        .filter((innerId: string) => !isSystemFieldTag(innerId))
        .map((innerId: string, fIdx: number) => {
          processedFieldIds.add(innerId);
          const rawId = innerId.split('|')[0]?.split(':')[0] || innerId;
          const cleanLabel = sanitizeFieldId(rawId);
          const fieldType = parsed.fieldTypes.get(innerId) || parsed.fieldTypes.get(cleanLabel) || 'text';
          const options = (parsed.templateOptions.get(innerId) || parsed.templateOptions.get(cleanLabel))?.map((o) => o.value);
          const isReq = parsed.requiredFields.get(innerId) || parsed.requiredFields.get(cleanLabel) || false;
          const isFull = parsed.fieldWidths.get(innerId) || parsed.fieldWidths.get(cleanLabel) || false;
          const modifier = ((parsed.fieldModifiers.get(innerId) || parsed.fieldModifiers.get(cleanLabel))?.[0] as FormCreatorField['modifier']) || (innerId.includes('|') ? (innerId.split('|')[1] as any) : 'none');
          const defaultValue = parsed.defaultValues.get(innerId) || parsed.defaultValues.get(cleanLabel);

          return {
            id: `f_inner_${idx}_${fIdx}_${Date.now()}`,
            label: cleanLabel,
            type: fieldType as FormCreatorFieldType,
            required: isReq,
            isFullWidth: isFull,
            modifier: modifier || 'none',
            options: options && options.length > 0 ? options : (fieldType === 'dropdown' ? ['Opción 1', 'Opción 2'] : undefined),
            defaultValue,
          };
        });

      fields.push({
        id: `sec_${idx}_${Date.now()}`,
        label: matchedSection.label || (isRep ? singular : `Sección ${idx + 1}`),
        type: 'section',
        isRepeatable: isRep,
        singularTitle: isRep ? singular : undefined,
        pluralTitle: isRep ? plural : undefined,
        subLabel: isRep ? sub : undefined,
        fields: innerFields,
      });
      return;
    }

    // It's a root field
    processedFieldIds.add(itemId);
    const fieldType = parsed.fieldTypes.get(itemId) || 'text';
    const options = parsed.templateOptions.get(itemId)?.map((o) => o.value);
    const isReq = parsed.requiredFields.get(itemId) || false;
    const isFull = parsed.fieldWidths.get(itemId) || false;
    const modifier = (parsed.fieldModifiers.get(itemId)?.[0] as FormCreatorField['modifier']) || 'none';
    const defaultValue = parsed.defaultValues.get(itemId);

    fields.push({
      id: `f_${idx}_${Date.now()}`,
      label: itemId,
      type: fieldType as FormCreatorFieldType,
      required: isReq,
      isFullWidth: isFull,
      modifier,
      options: options && options.length > 0 ? options : (fieldType === 'dropdown' ? ['Opción 1', 'Opción 2'] : undefined),
      defaultValue,
    });
  });

  // Check any orphaned fields that were not in parsed.layout
  parsed.fieldNames.forEach((fieldName, fIdx) => {
    if (isSystemFieldTag(fieldName)) {
      return;
    }
    if (!processedFieldIds.has(fieldName)) {
      const fieldType = parsed.fieldTypes.get(fieldName) || 'text';
      const defaultValue = parsed.defaultValues.get(fieldName);
      fields.push({
        id: `f_orphan_${fIdx}_${Date.now()}`,
        label: fieldName,
        type: fieldType as FormCreatorFieldType,
        defaultValue,
      });
    }
  });

  return fields;
}

/**
 * Compiles an entire FormCreatorModel into a clean, valid Minutas template string.
 * Preserves the exact sequential order of root fields, separators, and repeatable sections.
 */
export function compileFormToTemplateString(model: FormCreatorModel): string {
  const lines: string[] = [];

  // Optional Header Title
  if (model.headerTitle && model.headerTitle.trim()) {
    lines.push(`*${model.headerTitle.trim().toUpperCase()}*`);
    lines.push('');
  }

  // Root fields, separators, and sections in exact order
  model.fields.forEach((field) => {
    if (field.type === 'separator') {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push('::: --- :::');
      lines.push('');
    } else if (field.type === 'section') {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push(compileSectionBlock(field));
      lines.push('');
    } else {
      const token = compileFieldToken(field);
      const labelUpper = sanitizeFieldId(field.label).toUpperCase();
      lines.push(`- *${labelUpper}:* ${token}`);
    }
  });

  // Also support legacy model.sections if provided separately
  if (model.sections && model.sections.length > 0) {
    model.sections.forEach((section) => {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push(compileSectionBlock(section));
    });
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Checks if a field's token tag (or separator or section) is present in the template text.
 */
export function isFieldTagInText(text: string, field: FormCreatorField): boolean {
  if (isSystemFieldTag(field.label)) {
    return false;
  }

  if (field.type === 'section') {
    const isRep = field.isRepeatable !== false;
    if (!isRep) {
      const title = (field.label || 'SECCIÓN').toUpperCase().trim();
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`:::\\s*(?:section\\s+)?${escaped}\\s*:::`, 'i').test(text);
    }
    const singular = (field.singularTitle || field.label || 'ITEM').toUpperCase().trim();
    const plural = (field.pluralTitle || `${singular}S`).toUpperCase().trim();
    const sub = (field.subLabel || singular).toUpperCase().trim();
    const escapedPlural = plural.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSingular = singular.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSub = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`:::\\s*section\\s+(?:${escapedPlural}|${escapedSingular}|${escapedSub})(?:\\s*\\|[^:*]+)*\\*?\\s*:::`, 'i').test(text);
  }

  if (field.type === 'separator') {
    return /:::\s*---\s*:::/i.test(text);
  }

  const id = sanitizeFieldId(field.label);
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}`, 'i');
  return regex.test(text);
}

/**
 * Updates a field tag or separator in the template text when its label or properties change.
 */
export function updateFieldTagInText(
  text: string,
  oldLabel: string,
  newField: FormCreatorField
): string {
  if (newField.type === 'section') {
    const newBlock = compileSectionBlock(newField);
    const oldName = sanitizeFieldId(oldLabel).toUpperCase();
    const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`:::\\s*(?:section\\s+)?${escapedOld}(?:\\s*\\|[^:*]+)*\\*?\\s*:::[\\s\\S]*?:::`, 'gi');
    if (pattern.test(text)) {
      return text.replace(pattern, newBlock);
    }
    return syncSectionsInTemplateText(text, [newField]);
  }

  if (newField.type === 'separator') {
    const oldPattern = /:::\s*(?:separator(?::[^:]*)?|---)\s*:::/gi;
    return text.replace(oldPattern, '::: --- :::');
  }

  const oldId = sanitizeFieldId(oldLabel);
  const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const newToken = compileFieldToken(newField);
  const newLabelUpper = sanitizeFieldId(newField.label).toUpperCase();

  // 1. Try updating a full bullet line "- *OLD:* {Old...}" so the bullet label is also refreshed
  const lineRegex = new RegExp(
    `^[ \\t]*-[ \\t]*\\*[^*\\r\\n]+?\\*[ \\t]*:?[ \\t]*\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}[^\\r\\n]*$`,
    'mi'
  );
  if (lineRegex.test(text)) {
    return text.replace(lineRegex, `- *${newLabelUpper}:* ${newToken}`);
  }

  // 2. Otherwise replace the token itself without crossing line boundaries
  const tokenRegex = new RegExp(`\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}`, 'gi');
  return text.replace(tokenRegex, newToken);
}

/**
 * Removes a field's tag or separator from the template text when deleted.
 */
export function removeFieldTagFromText(text: string, field: FormCreatorField): string {
  if (field.type === 'section') {
    const isRep = field.isRepeatable !== false;
    const name = (isRep ? (field.pluralTitle || field.singularTitle || field.label) : (field.label || 'SECCIÓN')) || 'ITEM';
    const escaped = name.toUpperCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const secPattern = new RegExp(`\\r?\\n*:::\\s*(?:section\\s+)?${escaped}(?:\\s*\\|[^:*]+)*\\*?\\s*:::[\\s\\S]*?:::\\r?\\n*`, 'gi');
    return text.replace(secPattern, '\n\n').trim();
  }

  if (field.type === 'separator') {
    const sepPattern = /\r?\n*:::\s*(?:separator(?::[^:]*)?|---)\s*:::\r?\n*/gi;
    return text.replace(sepPattern, '\n\n').trim();
  }

  const id = sanitizeFieldId(field.label);
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lineRegex = new RegExp(`^[ \\t]*-[ \\t]*\\*[^*\\r\\n]+?\\*[ \\t]*:?[ \\t]*\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}[^\\r\\n]*\\r?\\n?`, 'gmi');
  const fallbackLineRegex = new RegExp(`^[^\r\n]*\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}[^\r\n]*\\r?\\n?`, 'gmi');
  const tokenRegex = new RegExp(`\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}`, 'gi');

  if (lineRegex.test(text)) {
    return text.replace(lineRegex, '').trimEnd();
  }
  if (fallbackLineRegex.test(text)) {
    return text.replace(fallbackLineRegex, '').trimEnd();
  }
  return text.replace(tokenRegex, '').trimEnd();
}

/**
 * Appends a field token line or separator to the template text.
 */
export function appendFieldTagToText(text: string, field: FormCreatorField): string {
  if (field.type === 'section') {
    const block = compileSectionBlock(field);
    return text.trim() ? `${text.trimEnd()}\n\n${block}\n` : block;
  }

  if (field.type === 'separator') {
    return text.trim() ? `${text.trimEnd()}\n\n::: --- :::\n` : '::: --- :::';
  }

  const token = compileFieldToken(field);
  const labelUpper = sanitizeFieldId(field.label).toUpperCase();
  const newLine = `- *${labelUpper}:* ${token}`;
  return text.trim() ? `${text.trimEnd()}\n${newLine}` : newLine;
}

/**
 * Identifies which fields from the list are missing their tag in the text.
 */
export function getMissingFieldTags(text: string, fields: FormCreatorField[]): FormCreatorField[] {
  return fields.filter((f) => !isSystemFieldTag(f.label) && !isFieldTagInText(text, f));
}

export interface ProtectedTagRange {
  start: number;
  end: number;
  label: string;
  token: string;
}

/**
 * Computes all character index ranges where protected field tags and separators are located in text.
 */
export function getProtectedTagRanges(text: string, fields: FormCreatorField[]): ProtectedTagRange[] {
  const ranges: ProtectedTagRange[] = [];

  fields.filter((f) => !isSystemFieldTag(f.label)).forEach((field) => {
    if (field.type === 'section') {
      // Tags inside the section fields are protected via getAllFieldsFlat
      return;
    }

    if (field.type === 'separator') {
      const regex = /:::\s*---\s*:::/gi;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          label: 'Separador',
          token: match[0],
        });
      }
      return;
    }

    const id = sanitizeFieldId(field.label);
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        label: field.label,
        token: match[0],
      });
    }
  });

  return ranges.sort((a, b) => a.start - b.start);
}

/**
 * Reorders the lines/blocks in template text according to the new fields order.
 * Preserves custom titles, headers, separators, and repeatable sections in exact sequential order.
 */
export function reorderFieldsInTemplateText(
  text: string,
  newFields: FormCreatorField[],
  title?: string
): string {
  if (!text.trim()) {
    return compileFormToTemplateString({
      name: title || 'Formulario',
      type: 'normal',
      headerTitle: (title || 'Formulario').toUpperCase(),
      fields: newFields,
    });
  }

  const fieldBlocks: { fieldId: string; block: string }[] = [];
  const matchedLines = new Set<string>();

  newFields.forEach((field) => {
    if (field.type === 'separator') {
      const token = compileFieldToken(field);
      fieldBlocks.push({ fieldId: field.id, block: `\n${token}\n` });
    } else if (field.type === 'section') {
      const secBlock = compileSectionBlock(field);
      fieldBlocks.push({ fieldId: field.id, block: `\n${secBlock}\n` });
    } else {
      const id = sanitizeFieldId(field.label);
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const lineRegex = new RegExp(`^[^\r\n]*\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}[^\r\n]*$`, 'mi');
      const match = text.match(lineRegex);
      if (match) {
        const tokenRegex = new RegExp(`\\{\\s*${escaped}(?:\\s*[:|][^}\\r\\n]*)?\\}`, 'i');
        const updatedBlock = match[0].replace(tokenRegex, compileFieldToken(field));
        fieldBlocks.push({ fieldId: field.id, block: updatedBlock });
        matchedLines.add(match[0]);
      } else {
        const token = compileFieldToken(field);
        const labelUpper = id.toUpperCase();
        fieldBlocks.push({ fieldId: field.id, block: `- *${labelUpper}:* ${token}` });
      }
    }
  });

  // Extract non-field headers and footers from original text
  const lines = text.split(/\r?\n/);
  const headerLines: string[] = [];
  let foundFirstField = false;
  let inSection = false;
  let lastFieldLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    const isSectionStart =
      trimmed.startsWith(':::') &&
      (trimmed.toLowerCase().includes('section ') ||
        trimmed.endsWith('* :::') ||
        trimmed.endsWith('*') ||
        (!trimmed.toLowerCase().includes('separator') &&
          !trimmed.toLowerCase().includes('if ') &&
          trimmed !== ':::'));

    if (isSectionStart) {
      inSection = true;
      foundFirstField = true;
      lastFieldLineIdx = i;
      continue;
    }
    if (inSection) {
      lastFieldLineIdx = i;
      if (trimmed === ':::') {
        inSection = false;
      }
      continue;
    }

    const isMatched = matchedLines.has(line);
    const isVisualFieldLine = isMatched || newFields.some((f) => isFieldTagInText(line, f));

    if (isVisualFieldLine) {
      foundFirstField = true;
      lastFieldLineIdx = i;
    } else if (!foundFirstField) {
      headerLines.push(line);
    }
  }

  // Trailing footer lines (lines after the last field or section line, e.g. {pie}, {photos}, closing remarks)
  const footerLines: string[] = [];
  if (lastFieldLineIdx >= 0 && lastFieldLineIdx < lines.length - 1) {
    for (let i = lastFieldLineIdx + 1; i < lines.length; i++) {
      const line = lines[i]!;
      const isMatched = matchedLines.has(line);
      const isVisualFieldLine = isMatched || newFields.some((f) => isFieldTagInText(line, f));
      if (!isVisualFieldLine) {
        footerLines.push(line);
      }
    }
  }

  const resultParts: string[] = [];
  const cleanHeader = headerLines.join('\n').trim();
  if (cleanHeader) {
    resultParts.push(cleanHeader);
    resultParts.push('');
  }

  // Add fields in the new exact sequential order
  fieldBlocks.forEach((fb) => {
    const cleanBlock = fb.block.trim();
    if (cleanBlock) {
      resultParts.push(cleanBlock);
    }
  });

  const cleanFooter = footerLines.join('\n').trim();
  if (cleanFooter) {
    resultParts.push('');
    resultParts.push(cleanFooter);
  }

  return resultParts.join('\n').replace(/\n{3,}/g, '\n\n');
}

