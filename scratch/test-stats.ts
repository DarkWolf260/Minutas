
import { obtenerCategoriasReporte } from '@/lib/estadisticas-utils';

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
const categories = obtenerCategoriasReporte(mockReport as any, mockTemplate as any, mockConfig as any);
console.log('Resulting categories:', categories);
