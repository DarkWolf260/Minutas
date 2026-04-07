import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { tokenize } from '../lexer';

describe('Locking Issue Reproduction', () => {
    it('should generate stable IDs for the user\'s section', () => {
        const template = `[singular="DATOS DEL PACIENTE" plural="DATOS DE LOS PACIENTE" sub="PACIENTE"
- *NOMBRE Y APELLIDO:* {Nombre y apellido:title:req}
- *EDAD:* {Edad:req}
- *IDX:* {IDX:req}
- *DIRECCIÓN:* {Dirección}]`;

        const result1 = parse(tokenize(template));
        const result2 = parse(tokenize(template));

        expect(result1.sections[0]!.id).toBe(result2.sections[0]!.id);
        expect(result1.sections[0]!.id).toBe('sec_datos_del_paciente');
        
        // Check field IDs
        expect(result1.sections[0]!.fieldIds).toContain('Nombre y apellido');
        expect(result1.sections[0]!.fieldIds).toContain('Edad');
        expect(result1.sections[0]!.fieldIds).toContain('IDX');
    });
});
