import { describe, it, expect, vi } from 'vitest';
import { renderFinalReport } from '../renderer';
import { parseTemplate } from '../../template-parser';
import type { SectionConfig, FieldConfig } from '../types';

describe('Nested Sections in Conditional Blocks', () => {
    it('should correctly handle the user reported case', () => {
        const template = `
[?Estatus=Finalizado:show]
["Section1" {Field1}]
[/]`;
        const data = {
            sec_section1: {
                Field1: 'Value1'
            }
        };
        const renderConfig = { 
            fields: { 
                Field1: { id: 'Field1', type: 'text' } as FieldConfig 
            }, 
            sections: [] as SectionConfig[], 
            layout: [] as string[] 
        };

        const result = renderFinalReport(template, data, renderConfig, { Estatus: 'Finalizado' }, false, {}, parseTemplate, () => {});

        expect(result).toContain('Value1');
        expect(result).not.toContain('[?Estatus');
    });

    it('should resolve dropdown labels in conditions', () => {
        const template = '[?Status=Done]Ok[/]';
        const data = { Status: '1' }; // Value is internal ID
        const renderConfig = {
            fields: {
                Status: {
                    id: 'Status',
                    type: 'dropdown',
                    templateOptions: [
                        { value: '1', label: 'Done' }
                    ]
                } as FieldConfig
            },
            sections: [],
            layout: []
        };

        const result = renderFinalReport(template, data, renderConfig, {}, false, {}, parseTemplate, () => {});
        expect(result).toContain('Ok');
    });
});
