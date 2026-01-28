import { getDataPoint } from './fixed-data-repository';
import { getMapping } from './semantic-dictionary';
import { DataPoint, SemanticMapping } from '../types/semantic';

export interface ResolutionResult {
  value: any;
  trace: {
    concept: string;
    dataId: string;
    version: number;
    source: string;
    confidence: number;
    fallbackUsed: boolean;
    transformationApplied: string;
  };
}

/**
 * Motor de Integración Semántica
 * Resuelve conceptos abstractos en datos reales con soporte para transformaciones y fallbacks.
 */
export function resolveSemanticConcept(concept: string): ResolutionResult {
  const mapping = getMapping(concept);

  // 1. Verificar si el concepto existe en el diccionario
  if (!mapping) {
    return {
      value: `{{SEMANTIC_ERROR: Concepto '${concept}' no mapeado}}`,
      trace: {
        concept,
        dataId: 'N/A',
        version: 0,
        source: 'None',
        confidence: 0,
        fallbackUsed: false,
        transformationApplied: 'none',
      },
    };
  }

  // 2. Intentar obtener el dato del repositorio fijo
  let data = getDataPoint(mapping.targetDataId);
  let fallbackUsed = false;

  // 3. Manejo de fallbacks si el dato no existe
  if (!data && mapping.fallback) {
    const fallbackResult = resolveSemanticConcept(mapping.fallback);
    return {
      ...fallbackResult,
      trace: {
        ...fallbackResult.trace,
        fallbackUsed: true,
      },
    };
  }

  // 4. Si no hay dato ni fallback, retornar error de datos
  if (!data) {
    return {
      value: `{{DATA_ERROR: Sin datos para '${mapping.targetDataId}'}}`,
      trace: {
        concept,
        dataId: mapping.targetDataId,
        version: 0,
        source: 'None',
        confidence: 0,
        fallbackUsed: false,
        transformationApplied: 'none',
      },
    };
  }

  // 5. Aplicar transformaciones si están configuradas
  let finalValue = data.value;
  const transformation = mapping.transformation || 'none';

  switch (transformation) {
    case 'percentage':
      if (typeof finalValue === 'number') {
        finalValue = `${(finalValue * 100).toFixed(2)}%`;
      }
      break;
    case 'trend':
      // Simulación de tendencia (aumentar ligeramente para demo)
      if (typeof finalValue === 'number') {
        finalValue = `~${(finalValue * 1.05).toFixed(0)}`;
      }
      break;
    case 'growth':
      finalValue = `↑ ${(Math.random() * 5).toFixed(1)}%`;
      break;
  }

  return {
    value: finalValue,
    trace: {
      concept,
      dataId: data.id,
      version: data.version,
      source: data.metadata.source,
      confidence: data.metadata.confidence,
      fallbackUsed,
      transformationApplied: transformation,
    },
  };
}

/**
 * Procesa una cadena de texto buscando tags semánticos y reemplazándolos.
 * Ej: "La población actual es {poblacion_la_guaira:semantic}"
 */
export function processSemanticTags(content: string): {
  rendered: string;
  audit: ResolutionResult[];
} {
  const audit: ResolutionResult[] = [];
  const semanticRegex = /\{([\s\S]+?):semantic\}/g;

  const rendered = content.replace(semanticRegex, (_, concept) => {
    const result = resolveSemanticConcept(concept.trim());
    audit.push(result);
    return String(result.value);
  });

  return { rendered, audit };
}
