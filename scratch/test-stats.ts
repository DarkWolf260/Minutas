
import { normalizeCategory, getReportCategories, normalizeForComp } from './src/lib/statistics-utils';

const mockReport = {
  id: 'r1',
  templateId: 't1',
  formData: {
    'Tipo de APH': ['Residencia', 'Vía pública'], // Multi-select or array of values
    'pacientes': [
      { 'Destino': 'Barcelona' },
      { 'Destino': 'Guanta' }
    ]
  },
  sections: [
    { title: 'Atenciones', content: '...' }
  ]
};

const mockTemplate = {
  id: 't1',
  statisticsRules: [
    { fieldId: 'Tipo de APH', operator: '=', condition: 'Residencia', category: '5.3 EN RESIDENCIA' },
    { fieldId: 'Tipo de APH', operator: '=', condition: 'Vía pública', category: '5.5 EN VÍA / LUGAR PÚBLICO' },
    { fieldId: 'Destino', operator: '!=', condition: 'Guanta', category: '6.2 TRASLADOS EXTRAURBANOS' }
  ]
};

const mockConfig = {
  fields: {
    'Tipo de APH': { label: 'Tipo de APH', type: 'dropdown' }
  },
  sections: [
    { id: 'Atenciones', label: 'Atenciones', statisticsCategory: '5.1 ATENCIONES PREHOSPITALARIAS' }
  ]
};

console.log('Testing categories extraction...');
const categories = getReportCategories(mockReport as any, mockTemplate as any, mockConfig as any);
console.log('Resulting categories:', categories);

// Expected for 'Tipo de APH': both 5.3 and 5.5 should appear.
// Current logic (known bug): only 5.3 will appear because it only takes the first item of the array ['Residencia', 'Vía pública'].

// Expected for 'Destino': only 'Barcelona' matches '!= Guanta'.
// Current logic: findAllValues finds both 'Barcelona' and 'Guanta' in the array 'pacientes'.
// Loop runs for each. Match for Barcelona. Correct.
