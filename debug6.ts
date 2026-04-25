import { getReportCategories } from './src/lib/statistics-utils';

const config = {
  fields: {
    Arma: { label: 'Tipo de Arma', type: 'text' },
    Cantidad: { label: 'Cantidad', type: 'number' }
  }
};

const template = {
  statisticsRules: [
    {
      fieldId: 'Arma',
      operator: 'contains',
      condition: 'Pistola',
      category: '1.1 PISTOLAS INCAUTADAS',
      conditions: [
        {
          fieldId: 'Cantidad',
          operator: 'extract_value',
          condition: ''
        }
      ]
    },
    {
      fieldId: 'Cantidad',
      operator: 'extract_value',
      condition: '',
      category: 'TOTAL ARMAS'
    }
  ]
};

const report = {
  formData: {
    Novedades: [
      { Arma: 'Pistola', Cantidad: '3' },
      { Arma: 'Escopeta', Cantidad: '1' },
      { Arma: 'Pistola', Cantidad: '5' }
    ]
  }
};

console.log(getReportCategories(report as any, template as any, config as any));
