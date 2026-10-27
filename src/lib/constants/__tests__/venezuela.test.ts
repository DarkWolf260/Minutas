import { describe, it, expect } from 'vitest';
import {
  MUNICIPIOS_NOMBRES_LARGOS,
  obtenerNombreLargoSugerido,
  getMunicipalitiesByState,
} from '../venezuela';

describe('Venezuela Constants - Long Municipality Names', () => {
  it('should have official long name for Urbaneja / Diego Bautista Urbaneja', () => {
    expect(MUNICIPIOS_NOMBRES_LARGOS['urbaneja']).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja'
    );
    expect(MUNICIPIOS_NOMBRES_LARGOS['diego bautista urbaneja']).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja'
    );
  });

  it('should correctly suggest official long names using obtenerNombreLargoSugerido', () => {
    expect(obtenerNombreLargoSugerido('Urbaneja')).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja'
    );
    expect(obtenerNombreLargoSugerido('Diego Bautista Urbaneja')).toBe(
      'Municipio Turístico "El Morro" Licenciado Diego Bautista Urbaneja'
    );
    expect(obtenerNombreLargoSugerido('Guanta')).toBe('Municipio Autónomo Guanta');
    expect(obtenerNombreLargoSugerido('Juan Antonio Sotillo')).toBe('Municipio Juan Antonio Sotillo');
    expect(obtenerNombreLargoSugerido('Maneiro')).toBe(
      'Municipio Bolivariano General en Jefe Bartolomé Maneiro'
    );
  });

  it('should fallback to prefixing "Municipio" for unknown municipalities', () => {
    expect(obtenerNombreLargoSugerido('Desconocido')).toBe('Municipio Desconocido');
    expect(obtenerNombreLargoSugerido('Municipio Existente')).toBe('Municipio Existente');
    expect(obtenerNombreLargoSugerido('')).toBe('');
  });

  it('should retrieve municipalities by state id', () => {
    const anz = getMunicipalitiesByState('ANZ');
    expect(anz.length).toBeGreaterThan(0);
    expect(anz.some(m => m.name === 'Diego Bautista Urbaneja')).toBe(true);
  });
});
