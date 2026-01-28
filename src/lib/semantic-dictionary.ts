import { SemanticMapping } from '../types/semantic';

/**
 * Diccionario de Equivalencias Semánticas
 * Centraliza cómo los conceptos abstractos se mapean a datos específicos.
 */
const SEMANTIC_DICTIONARY: Record<string, SemanticMapping> = {
  poblacion_la_guaira: {
    concept: 'poblacion_la_guaira',
    targetDataId: 'pob_vargas_2025',
    transformation: 'none',
  },
  superficie_territorial: {
    concept: 'superficie_territorial',
    targetDataId: 'area_vargas_km2',
    transformation: 'none',
  },
  personal_disponible: {
    concept: 'personal_disponible',
    targetDataId: 'fuerza_operativa_pc',
    transformation: 'none',
  },
  densidad_habitacional: {
    concept: 'densidad_habitacional',
    targetDataId: 'pob_vargas_2025',
    transformation: 'trend', // Ejemplo de transformación
    fallback: 'poblacion_la_guaira',
  },
};

/**
 * Busca un mapeo semántico para un concepto dado.
 */
export function getMapping(concept: string): SemanticMapping | null {
  return SEMANTIC_DICTIONARY[concept.toLowerCase()] || null;
}

/**
 * Retorna todos los conceptos mapeados.
 */
export function getAllMappings(): SemanticMapping[] {
  return Object.values(SEMANTIC_DICTIONARY);
}

/**
 * Registra o actualiza un mapeo semántico.
 */
export function registerMapping(mapping: SemanticMapping): void {
  SEMANTIC_DICTIONARY[mapping.concept.toLowerCase()] = mapping;
}
