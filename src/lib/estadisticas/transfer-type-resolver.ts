import type { Address } from '@/lib/types';
import { normalizeString } from '@/lib/utils';

/**
 * Genera el string formateado de una dirección (mismo formato que address-input.tsx)
 */
function formatAddressToString(address: Address): string {
  const parts = [`Municipio ${address.municipality}`, `parroquia ${address.parish}`];
  if (address.sector) parts.push(`sector ${address.sector}`);
  const calle = [address.street, address.houseNumber].filter(Boolean).join(' ');
  if (calle) parts.push(`calle ${calle}`);
  parts.push(address.name);
  parts.push(`Cuadrante de Paz ${address.peaceQuadrant}`);
  return parts.join(', ');
}

/**
 * Mapa de combinaciones origen→destino a sus categorías estadísticas.
 * Solo se definen las combinaciones que tienen código oficial.
 */
const TRANSFER_TYPE_MAP: Record<string, Record<string, string>> = {
  centro_asistencial: {
    centro_asistencial: '6.3 DE CENTROS ASISTENCIALES A CENTROS ASISTENCIALES',
    residencia: '6.4 DE CENTROS ASISTENCIALES A RESIDENCIAS',
  },
  residencia: {
    centro_asistencial: '6.5 DE RESIDENCIAS A CENTROS ASISTENCIALES',
    residencia: '6.9 DE RESIDENCIAS A RESIDENCIAS',
  },
  lugar_publico: {
    centro_asistencial: '6.6 DE VÍA A CENTROS ASISTENCIALES',
    residencia: '6.10 DE LUGAR PÚBLICO / VÍA A RESIDENCIAS',
  },
  sede: {
    centro_asistencial: '6.7 DE SEDE A CENTROS ASISTENCIALES',
  },
  institucion_comercio: {
    centro_asistencial: '6.8 DE INSTITUCION / COMERCIO A CENTROS ASISTENCIALES',
  },
};

/**
 * Busca en la lista de addresses cuál coincide con el string de dirección dado.
 * Usa comparación exacta normalizada del string formateado completo.
 */
function resolverTipoDesdeDirectorio(
  addressStr: string,
  addresses: Address[]
): string | undefined {
  if (!addressStr) return undefined;
  const normalized = normalizeString(addressStr);
  const found = addresses.find(
    (addr) => normalizeString(formatAddressToString(addr)) === normalized
  );
  return found?.locationType;
}

/**
 * Resuelve el tipo de traslado para un tramo origen→destino.
 * Primero intenta match en el directorio; si no hay, usa el tipo manual provisto.
 *
 * @param origenStr - Texto del campo de origen
 * @param destinoStr - Texto del campo de destino
 * @param origenManualType - Tipo de lugar de origen (manual, ej: "residencia")
 * @param destinoManualType - Tipo de lugar de destino (manual, ej: "centro_asistencial")
 * @param addresses - Lista de direcciones del directorio
 * @returns Categoría "6.X DESCRIPCION" o null si no se puede inferir
 */
export function resolverCategoriaTraslado(
  origenStr: string,
  destinoStr: string,
  origenManualType: string | undefined,
  destinoManualType: string | undefined,
  addresses: Address[]
): string | null {
  // Resolver tipo de origen
  const origenType =
    resolverTipoDesdeDirectorio(origenStr, addresses) || origenManualType;

  // Resolver tipo de destino
  const destinoType =
    resolverTipoDesdeDirectorio(destinoStr, addresses) || destinoManualType;

  if (!origenType || !destinoType) return null;

  return TRANSFER_TYPE_MAP[origenType]?.[destinoType] ?? null;
}
