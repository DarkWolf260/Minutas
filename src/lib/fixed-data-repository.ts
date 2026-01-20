import { DataPoint, FixedDataCatalog } from '../types/semantic';

/**
 * Repositorio de Datos Fijos (Capa de Datos Inmutables)
 * En un entorno real, esto se cargaría de una base de datos o API externa.
 */
const FIXED_DATA_STORE: Record<string, DataPoint[]> = {
    "pob_vargas_2025": [
        {
            id: "pob_vargas_2025",
            value: 382000,
            unit: "habitantes",
            timestamp: "2025-01-01T00:00:00Z",
            version: 1,
            metadata: {
                description: "Población proyectada del estado La Guaira (Vargas) para 2025",
                source: "INE Proyecciones",
                confidence: 0.98
            }
        }
    ],
    "area_vargas_km2": [
        {
            id: "area_vargas_km2",
            value: 1497,
            unit: "km²",
            timestamp: "2020-01-01T00:00:00Z",
            version: 1,
            metadata: {
                description: "Superficie total del estado La Guaira",
                source: "Geografía Nacional",
                confidence: 1.0
            }
        }
    ],
    "fuerza_operativa_pc": [
        {
            id: "fuerza_operativa_pc",
            value: 150,
            unit: "efectivos",
            timestamp: "2026-01-01T00:00:00Z",
            version: 1,
            metadata: {
                description: "Personal operativo disponible en Protección Civil",
                source: "Recursos Humanos PC",
                confidence: 0.95
            }
        }
    ]
};

/**
 * Obtiene un punto de dato por su ID único.
 */
export function getDataPoint(id: string, version?: number): DataPoint | null {
    const history = FIXED_DATA_STORE[id];
    if (!history || history.length === 0) return null;

    if (version !== undefined) {
        return history.find(dp => dp.version === version) || null;
    }

    // Retornar la versión más reciente
    return [...history].sort((a, b) => b.version - a.version)[0];
}

/**
 * Retorna el catálogo completo de estadísticas disponibles.
 */
export function getCatalog(): FixedDataCatalog {
    return {
        lastUpdated: new Date().toISOString(),
        categories: [
            {
                name: "Demografía y Territorio",
                indicators: ["pob_vargas_2025", "area_vargas_km2"]
            },
            {
                name: "Recursos Institucionales",
                indicators: ["fuerza_operativa_pc"]
            }
        ]
    };
}

/**
 * Registra un nuevo dato (Simulado)
 */
export function registerDataPoint(data: DataPoint): void {
    if (!FIXED_DATA_STORE[data.id]) {
        FIXED_DATA_STORE[data.id] = [];
    }
    FIXED_DATA_STORE[data.id].push(data);
}
