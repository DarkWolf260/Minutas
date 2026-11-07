import divisionData from '@/data/division-territorial.json';
import { obtenerNombreLargoMunicipio, MUNICIPIOS_NOMBRES_LARGOS } from './venezuela';
import { normalizeString } from '@/lib/utils';

export interface SectorItem {
  nombre: string;
  circuitoComunal: string;
}

export interface ParroquiaItem {
  id: string;
  nombre: string;
  circuitosComunales: string[];
  sectores: SectorItem[];
}

export interface MunicipioItem {
  id: string;
  nombre: string;
  nombreOficial: string;
  parroquias: ParroquiaItem[];
}

export interface DivisionTerritorial {
  estado: string;
  municipios: MunicipioItem[];
}

export const DIVISION_TERRITORIAL: DivisionTerritorial = divisionData as DivisionTerritorial;

/**
 * Obtiene la lista completa de municipios disponibles en la división territorial.
 */
export function getMunicipios(): MunicipioItem[] {
  return DIVISION_TERRITORIAL.municipios;
}

/**
 * Busca un municipio por nombre o ID con coincidencia flexible (insensible a mayúsculas y acentos).
 */
export function findMunicipio(query: string): MunicipioItem | undefined {
  if (!query) return undefined;
  const normalizedQuery = normalizeString(query);
  return DIVISION_TERRITORIAL.municipios.find((m) => {
    return (
      normalizeString(m.id) === normalizedQuery ||
      normalizeString(m.nombre) === normalizedQuery ||
      normalizeString(m.nombreOficial) === normalizedQuery ||
      normalizeString(m.nombreOficial).includes(normalizedQuery) ||
      normalizedQuery.includes(normalizeString(m.nombre))
    );
  });
}

/**
 * Obtiene las parroquias de un municipio dado.
 */
export function getParroquias(municipioQuery: string): ParroquiaItem[] {
  const mun = findMunicipio(municipioQuery);
  return mun ? mun.parroquias : [];
}

/**
 * Busca una parroquia dentro de un municipio.
 */
export function findParroquia(municipioQuery: string, parroquiaQuery: string): ParroquiaItem | undefined {
  const parroquias = getParroquias(municipioQuery);
  if (!parroquiaQuery) return undefined;
  const normalizedP = normalizeString(parroquiaQuery);
  return parroquias.find((p) => {
    return (
      normalizeString(p.id) === normalizedP ||
      normalizeString(p.nombre) === normalizedP ||
      normalizeString(p.nombre).includes(normalizedP)
    );
  });
}

/**
 * Obtiene los sectores de una parroquia de un municipio.
 */
export function getSectores(municipioQuery: string, parroquiaQuery: string): SectorItem[] {
  const parr = findParroquia(municipioQuery, parroquiaQuery);
  return parr ? parr.sectores : [];
}

/**
 * Obtiene los circuitos comunales disponibles en una parroquia.
 */
export function getCircuitosComunales(municipioQuery: string, parroquiaQuery: string): string[] {
  const parr = findParroquia(municipioQuery, parroquiaQuery);
  if (!parr) return [];
  const set = new Set<string>(parr.circuitosComunales || []);
  parr.sectores.forEach((s) => {
    if (s.circuitoComunal) set.add(s.circuitoComunal);
  });
  return Array.from(set);
}

/**
 * Resuelve el circuito comunal vinculado a un sector específico.
 */
export function getCircuitoComunalParaSector(
  municipioQuery: string,
  parroquiaQuery: string,
  sectorQuery: string
): string | undefined {
  if (!sectorQuery) return undefined;
  const sectores = getSectores(municipioQuery, parroquiaQuery);
  const normalizedS = normalizeString(sectorQuery);
  const found = sectores.find((s) => normalizeString(s.nombre) === normalizedS);
  return found?.circuitoComunal;
}

export interface UbicacionParts {
  municipio?: string;
  parroquia?: string;
  sector?: string;
  calle?: string;
  lugar?: string;
  circuitoComunal?: string;
}

/**
 * Formatea una ubicación según el estándar requerido:
 * Municipio [Nombre Oficial/Largo], parroquia [Parroquia], sector [Sector], calle [Calle], [Lugar], circuito comunal [Circuito]
 */
export function formatUbicacionString(parts: UbicacionParts): string {
  const elements: string[] = [];

  // 1. Municipio
  if (parts.municipio && parts.municipio.trim()) {
    const munRaw = parts.municipio.trim();
    const munItem = findMunicipio(munRaw);
    const munOficial = munItem?.nombreOficial || obtenerNombreLargoMunicipio(munRaw);
    elements.push(munOficial);
  }

  // 2. Parroquia
  if (parts.parroquia && parts.parroquia.trim()) {
    const rawParish = parts.parroquia.trim();
    const cleanParish = rawParish.replace(/^parroquia\s+/i, '').trim();
    elements.push(`parroquia ${cleanParish}`);
  }

  // 3. Sector
  if (parts.sector && parts.sector.trim()) {
    const rawSector = parts.sector.trim();
    const cleanSector = rawSector.replace(/^sector\s+/i, '').trim();
    elements.push(`sector ${cleanSector}`);
  }

  // 4. Calle / Vía
  if (parts.calle && parts.calle.trim()) {
    const rawCalle = parts.calle.trim();
    const cleanCalle = rawCalle.replace(/^calle\s+/i, '').trim();
    if (/^(av\.|avenida|carrera|callejón|callejon|carretera|autopista|vereda)/i.test(rawCalle)) {
      elements.push(rawCalle);
    } else {
      elements.push(`calle ${cleanCalle}`);
    }
  }

  // 5. Lugar / Ubicación específica en texto libre
  if (parts.lugar && parts.lugar.trim()) {
    elements.push(parts.lugar.trim());
  }

  // 6. Circuito Comunal
  if (parts.circuitoComunal && parts.circuitoComunal.trim()) {
    const rawCircuito = parts.circuitoComunal.trim();
    const cleanCircuito = rawCircuito
      .replace(/^circuito\s+comunal\s+/i, '')
      .replace(/\s*\([^)]*\)$/, '')
      .trim();
    elements.push(`circuito comunal ${cleanCircuito}`);
  }

  return elements.join(', ');
}

/**
 * Parsea una cadena de texto formateada o semi-formateada en sus partes individuales.
 */
export function parseUbicacionString(raw: string): UbicacionParts {
  if (!raw || !raw.trim()) {
    return {};
  }

  let text = raw.trim();
  const result: UbicacionParts = {};

  // 1. Extraer circuito comunal (al final o precedido de coma)
  const circuitoMatch = text.match(/(?:,\s*)?circuito\s+comunal\s+([^,]+)$/i);
  if (circuitoMatch) {
    result.circuitoComunal = circuitoMatch[1].trim();
    text = text.substring(0, circuitoMatch.index).trim();
  }

  // 2. Extraer sector
  const sectorMatch = text.match(/(?:^|,\s*)sector\s+([^,]+)/i);
  if (sectorMatch) {
    result.sector = sectorMatch[1].trim();
    text = (text.substring(0, sectorMatch.index!) + text.substring(sectorMatch.index! + sectorMatch[0].length)).trim();
  }

  // 3. Extraer parroquia
  const parroquiaMatch = text.match(/(?:^|,\s*)parroquia\s+([^,]+)/i);
  if (parroquiaMatch) {
    result.parroquia = parroquiaMatch[1].trim();
    text = (text.substring(0, parroquiaMatch.index!) + text.substring(parroquiaMatch.index! + parroquiaMatch[0].length)).trim();
  }

  // 4. Extraer calle
  const calleMatch = text.match(/(?:^|,\s*)calle\s+([^,]+)/i);
  if (calleMatch) {
    result.calle = `calle ${calleMatch[1].trim()}`;
    text = (text.substring(0, calleMatch.index!) + text.substring(calleMatch.index! + calleMatch[0].length)).trim();
  }

  // Limpiar comas duplicadas o sobrantes
  text = text.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').trim();

  // 5. Extraer Municipio al principio
  const chunks = text.split(',').map((c) => c.trim()).filter(Boolean);
  if (chunks.length > 0) {
    const firstChunk = chunks[0];
    const munFound = findMunicipio(firstChunk);
    if (munFound) {
      result.municipio = munFound.nombre;
      chunks.shift();
    } else if (/^municipio\s+/i.test(firstChunk)) {
      result.municipio = firstChunk.replace(/^municipio\s+/i, '').trim();
      chunks.shift();
    }
  }

  // 6. El resto es el lugar / detalle
  if (chunks.length > 0) {
    result.lugar = chunks.join(', ').trim();
  }

  return result;
}

