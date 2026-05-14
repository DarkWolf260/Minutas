import { useState } from 'react';
import { toast } from 'sonner';
import { formatStaffMember } from '@/lib/formatters';
import type { Staff, StaffRole, ManualNovedad } from '@/lib/types';
import type { Nota } from './use-orden-del-dia-notes';

interface UseOrdenDelDiaGeneratorProps {
  personalAsignado: Staff;
  esJefeEncargado: boolean;
  actividadesOrdenadas: ManualNovedad[];
  notas: Nota[];
  selectedGuard: string;
  periodo: string;
  roles: StaffRole[];
  definiciones: any;
  buscarCampoInsensible: (defs: any, key: string) => string;
}

export function useOrdenDelDiaGenerator({
  personalAsignado,
  esJefeEncargado,
  actividadesOrdenadas,
  notas,
  selectedGuard,
  periodo,
  roles,
  definiciones,
  buscarCampoInsensible
}: UseOrdenDelDiaGeneratorProps) {
  const [ordenGenerada, setOrdenGenerada] = useState('');
  const [esDialogOpenResultado, setEsDialogOpenResultado] = useState(false);
  const [textoBotonCopiar, setTextoBotonCopiar] = useState('Copiar');

  const manejarGenerarOrden = () => {
    const jefeDeOperaciones = (() => {
      const key = Object.keys(personalAsignado).find((k) => k.toLowerCase() === 'jefe de operaciones');
      if (key) {
        const lista = personalAsignado[key];
        if (lista && lista.length > 0) {
          const primero = lista[0];
          if (primero) return formatStaffMember(primero).trim();
        }
      }
      return '';
    })();

    const director = (() => {
      const key = Object.keys(personalAsignado).find((k) => k.toLowerCase() === 'director');
      if (key) {
        const lista = personalAsignado[key];
        if (lista && lista.length > 0) {
          const primero = lista[0];
          if (primero) return formatStaffMember(primero).trim();
        }
      }
      return '';
    })();

    const municipio = buscarCampoInsensible(definiciones, 'Municipio');
    const estado = buscarCampoInsensible(definiciones, 'Estado');

    const partesReporte = [
      `*ORDEN DEL DÍA DEL INSTITUTO AUTONOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES DEL MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
      ``,
    ];

    if (director) partesReporte.push(`*DIRECTOR*`, director, ``);
    if (jefeDeOperaciones) partesReporte.push(`*JEFE DE OPERACIONES*`, jefeDeOperaciones, ``);

    partesReporte.push(
      `*GRUPO DE GUARDIA:* “${selectedGuard}”`,
      ``,
      `*PERIODO:* ${periodo}`
    );

    const rolesOrdenadosParaReporte = [...roles]
      .sort((a, b) => (a.hierarchy_order ?? a.order ?? 0) - (b.hierarchy_order ?? b.order ?? 0));

    rolesOrdenadosParaReporte.forEach((rol) => {
      const nombreRolBajo = rol.name.toLowerCase();
      if (nombreRolBajo === 'director' || nombreRolBajo === 'jefe de operaciones') return;

      const listaPersonal = personalAsignado[rol.name];
      if (listaPersonal && listaPersonal.length > 0 && listaPersonal.some((p) => {
        const name = typeof p === 'string' ? p : p?.name;
        return name && name.trim() !== '';
      })) {
        const esJefeServicios = nombreRolBajo === 'jefe de los servicios';
        const rolAMostrar = esJefeServicios && esJefeEncargado ? `${rol.name.toUpperCase()} (E)` : rol.name.toUpperCase();
        partesReporte.push(``, `*${rolAMostrar}*`, listaPersonal.map(m => formatStaffMember(m, false, true)).join('\n'));
      }
    });

    const orden = partesReporte.join('\n').trim();
    const partesSecundarias: string[] = [];

    if (actividadesOrdenadas.length > 0) {
      partesSecundarias.push(``, `*ACTIVIDADES DEL DÍA*`);
      actividadesOrdenadas.forEach(act => {
        if (act.text.trim()) partesSecundarias.push(``, `- *${act.time}* ${act.text.trim()}`);
      });
    }

    if (notas.length > 0) {
      partesSecundarias.push(``, `*NOTA:*`);
      notas.forEach(nota => {
        if (nota.content.trim()) partesSecundarias.push(``, `*${nota.content.trim()}*`);
      });
    }

    const textoPie = municipio ? `*PROTECCIÓN CIVIL ${municipio.toUpperCase()}*` : '*PROTECCIÓN CIVIL*';
    const reporteFinal = [orden, ...partesSecundarias, '', textoPie].join('\n').trim();
    setOrdenGenerada(reporteFinal);
    setEsDialogOpenResultado(true);
    setTextoBotonCopiar('Copiar');
  };

  const manejarCopiadoAlPortapapeles = () => {
    navigator.clipboard.writeText(ordenGenerada);
    setTextoBotonCopiar('¡Copiado!');
    toast.success('Copiado al portapapeles');
    setTimeout(() => setTextoBotonCopiar('Copiar'), 2000);
  };

  return {
    ordenGenerada,
    esDialogOpenResultado,
    setEsDialogOpenResultado,
    textoBotonCopiar,
    manejarGenerarOrden,
    manejarCopiadoAlPortapapeles
  };
}

