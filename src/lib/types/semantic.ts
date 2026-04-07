export interface DataPoint {
  id: string; // "pob_ven_2025"
  value: number | string;
  unit?: string;
  timestamp: string;
  version: number;
  metadata: {
    description: string;
    source: string;
    confidence: number;
  };
}

export interface SemanticMapping {
  concept: string; // "poblacion_total"
  targetDataId: string; // "pob_ven_2025"
  transformation?: 'none' | 'percentage' | 'trend' | 'growth';
  fallback?: string; // Concept to use if this one fails
}

export interface AuditRecord {
  reportId: string;
  timestamp: string;
  mappings: {
    concept: string;
    dataId: string;
    version: number;
    appliedValue: string | number;
    confidence: number;
  }[];
}

export interface FixedDataCatalog {
  lastUpdated: string;
  categories: {
    name: string;
    indicators: string[]; // List of DataPoint IDs
  }[];
}
