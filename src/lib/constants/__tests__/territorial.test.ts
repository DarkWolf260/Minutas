import { describe, it, expect } from 'vitest';
import {
  getMunicipios,
  findMunicipio,
  getParroquias,
  getSectores,
  getCircuitosComunales,
  getCircuitoComunalParaSector,
  formatUbicacionString,
  parseUbicacionString,
} from '../territorial';

describe('Territorial Division and Location Formatting', () => {
  it('should load all 21 municipalities of Anzoátegui', () => {
    const municipios = getMunicipios();
    expect(municipios.length).toBe(21);
    expect(municipios.some((m) => m.nombre === 'Diego Bautista Urbaneja')).toBe(true);
    expect(municipios.some((m) => m.nombre === 'Juan Antonio Sotillo')).toBe(true);
    expect(municipios.some((m) => m.nombre === 'Simón Bolívar')).toBe(true);
    expect(municipios.some((m) => m.nombre === 'Guanta')).toBe(true);
  });

  it('should find municipio by full or partial name', () => {
    const mun = findMunicipio('Diego Bautista Urbaneja');
    expect(mun).toBeDefined();
    expect(mun?.id).toBe('diego-bautista-urbaneja');
    expect(mun?.nombreOficial).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja'
    );

    const mun2 = findMunicipio('Urbaneja');
    expect(mun2?.id).toBe('diego-bautista-urbaneja');
  });

  it('should return parishes for a municipality', () => {
    const parroquias = getParroquias('Diego Bautista Urbaneja');
    expect(parroquias.map((p) => p.nombre)).toEqual(
      expect.arrayContaining(['Lechería', 'El Morro'])
    );
  });

  it('should return sectors for a parish', () => {
    const sectores = getSectores('Diego Bautista Urbaneja', 'Lechería');
    expect(sectores.some((s) => s.nombre === 'Barrio Venezuela')).toBe(true);
    expect(sectores.some((s) => s.nombre === 'Casco Central')).toBe(true);
  });

  it('should link Barrio Venezuela with Circuito Comunal Alberto Lovera', () => {
    const circuito = getCircuitoComunalParaSector(
      'Diego Bautista Urbaneja',
      'Lechería',
      'Barrio Venezuela'
    );
    expect(circuito).toBe('Alberto Lovera');
  });

  it('should format location matching user specifications', () => {
    const formatted = formatUbicacionString({
      municipio: 'Diego Bautista Urbaneja',
      parroquia: 'Lechería',
      sector: 'Barrio Venezuela',
      calle: 'calle Pampatar',
      lugar: 'Residencias Las Palmeras',
      circuitoComunal: 'Alberto Lovera',
    });

    expect(formatted).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja, parroquia Lechería, sector Barrio Venezuela, calle Pampatar, Residencias Las Palmeras, circuito comunal Alberto Lovera'
    );
  });

  it('should parse formatted location back into parts', () => {
    const text =
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja, parroquia Lechería, sector Barrio Venezuela, calle Pampatar, Residencias Las Palmeras, circuito comunal Alberto Lovera';
    const parsed = parseUbicacionString(text);

    expect(parsed.municipio).toBe('Diego Bautista Urbaneja');
    expect(parsed.parroquia).toBe('Lechería');
    expect(parsed.sector).toBe('Barrio Venezuela');
    expect(parsed.calle).toBe('calle Pampatar');
    expect(parsed.lugar).toBe('Residencias Las Palmeras');
    expect(parsed.circuitoComunal).toBe('Alberto Lovera');
  });

  it('should format correctly even when optional parts are omitted', () => {
    const formatted = formatUbicacionString({
      municipio: 'Guanta',
      parroquia: 'Guanta',
      sector: 'La Montañita',
      lugar: 'Ambulatorio Dr. José David Sambrano',
      circuitoComunal: 'Turístico Cultural Francisco de Miranda',
    });

    expect(formatted).toBe(
      'Municipio Autónomo Guanta, parroquia Guanta, sector La Montañita, Ambulatorio Dr. José David Sambrano, circuito comunal Turístico Cultural Francisco de Miranda'
    );
  });
});

