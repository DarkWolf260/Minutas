import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAddresses } from '@/hooks/use-addresses';
import type { Address } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

export function useDirecciones() {
  const { 
    addresses: direcciones, 
    addAddress: añadirDireccion, 
    updateAddress: actualizarDireccion, 
    removeAddress: eliminarDireccion, 
    isLoaded: estaCargado 
  } = useAddresses();

  const [esFormOpen, setEsFormOpen] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState<Address | null>(null);
  const [direccionAEliminar, setDireccionAEliminar] = useState<Address | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('all');
  const [seleccionadaParaMapa, setSeleccionadaParaMapa] = useState<Address | null>(null);
  const [coordenadasIniciales, setCoordenadasIniciales] = useState<{ lat: string; lng: string } | null>(null);
  const [idCopiado, setIdCopiado] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState('list');

  useEffect(() => {
    if (estaCargado && direcciones.length > 0 && !seleccionadaParaMapa) {
      const primeraConCoordenadas = direcciones.find((addr) => !!addr.latitude && !!addr.longitude);
      if (primeraConCoordenadas) {
        setSeleccionadaParaMapa(primeraConCoordenadas);
      }
    }
  }, [estaCargado, direcciones, seleccionadaParaMapa]);

  const manejarAbrirForm = (direccion: Address | null = null) => {
    setDireccionEditando(direccion);
    setCoordenadasIniciales(null);
    setEsFormOpen(true);
  };

  const manejarClickMapa = (coords: { lat: number; lng: number }) => {
    setDireccionEditando(null);
    setCoordenadasIniciales({ lat: coords.lat.toFixed(6), lng: coords.lng.toFixed(6) });
    setEsFormOpen(true);
  };

  const manejarCerrarForm = () => {
    setEsFormOpen(false);
    setDireccionEditando(null);
    setCoordenadasIniciales(null);
  };

  const manejarGuardarDireccion = (direccion: Address) => {
    if (direccionEditando) {
      actualizarDireccion(direccion);
      if (seleccionadaParaMapa?.id === direccion.id) {
        setSeleccionadaParaMapa(direccion);
      }
    } else {
      const nuevaDireccion = { ...direccion, id: generateId('address') };
      añadirDireccion(nuevaDireccion);
      if (nuevaDireccion.latitude && nuevaDireccion.longitude) {
        setSeleccionadaParaMapa(nuevaDireccion);
      }
    }
    manejarCerrarForm();
  };

  const manejarConfirmarEliminacion = () => {
    if (direccionAEliminar) {
      eliminarDireccion(direccionAEliminar.id);
      if (seleccionadaParaMapa?.id === direccionAEliminar.id) {
        const siguiente =
          direcciones.find(
            (addr) => addr.id !== direccionAEliminar.id && !!addr.latitude && !!addr.longitude
          ) || null;
        setSeleccionadaParaMapa(siguiente);
      }
      setDireccionAEliminar(null);
    }
  };

  const manejarCopiarDireccion = (direccion: Address, conCoordenadas: boolean) => {
    const partes = [`Municipio ${direccion.municipality}`, `parroquia ${direccion.parish}`];

    if (direccion.sector) {
      partes.push(`sector ${direccion.sector}`);
    }

    const calle = [direccion.street, direccion.houseNumber].filter(Boolean).join(' ');
    if (calle) {
      partes.push(`calle ${calle}`);
    }

    partes.push(direccion.name);
    partes.push(`Cuadrante de Paz ${direccion.peaceQuadrant}${direccion.entity ? ` (${direccion.entity})` : ''}`);

    let texto = partes.join(', ');

    if (conCoordenadas && direccion.latitude && direccion.longitude) {
      texto += `\nCoordenadas: ${direccion.latitude}, ${direccion.longitude}`;
    }

    navigator.clipboard.writeText(texto).then(() => {
      setIdCopiado(direccion.id);
      setTimeout(() => setIdCopiado(null), 2000);
    });
  };

  const municipiosUnicos = useMemo(() => {
    const municipios = new Set(direcciones.map((addr) => addr.municipality));
    return ['Todos los municipios', ...Array.from(municipios).sort()];
  }, [direcciones]);

  const direccionesFiltradas = useMemo(() => {
    return direcciones
      .filter((addr) => {
        if (filtroMunicipio === 'all') return true;
        return addr.municipality === filtroMunicipio;
      })
      .filter((addr) => {
        if (!busqueda) return true;
        const busquedaBaja = busqueda.toLowerCase();
        return (
          addr.name.toLowerCase().includes(busquedaBaja) ||
          (addr.street && addr.street.toLowerCase().includes(busquedaBaja)) ||
          (addr.houseNumber && addr.houseNumber.toLowerCase().includes(busquedaBaja)) ||
          addr.parish.toLowerCase().includes(busquedaBaja) ||
          (addr.sector && addr.sector.toLowerCase().includes(busquedaBaja)) ||
          addr.peaceQuadrant.toLowerCase().includes(busquedaBaja) ||
          (addr.entity && addr.entity.toLowerCase().includes(busquedaBaja))
        );
      });
  }, [direcciones, busqueda, filtroMunicipio]);

  return {
    // Estado
    direcciones,
    direccionesFiltradas,
    estaCargado,
    esFormOpen,
    direccionEditando,
    direccionAEliminar,
    setDireccionAEliminar,
    busqueda,
    setBusqueda,
    filtroMunicipio,
    setFiltroMunicipio,
    seleccionadaParaMapa,
    setSeleccionadaParaMapa,
    coordenadasIniciales,
    idCopiado,
    tabActiva,
    setTabActiva,
    municipiosUnicos,
    
    // Acciones
    manejarAbrirForm,
    manejarClickMapa,
    manejarCerrarForm,
    manejarGuardarDireccion,
    manejarConfirmarEliminacion,
    manejarCopiarDireccion,
  };
}
