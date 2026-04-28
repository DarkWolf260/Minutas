import { useState, useCallback } from 'react';
import { generateId } from '@/lib/utils/id';
import { toast } from 'sonner';

export interface Nota {
  id: string;
  content: string;
}

export const NOTAS_POR_DEFECTO: Nota[] = [
  { id: 'note-1', content: 'ESTA ORDEN DE OPERACIONES DEBE SER CUMPLIDA A CABALIDAD, EL INCUMPLIMIENTO DE LAS MISMAS ACARREARÁ COMO CONSECUENCIA SANCIONES ADMINISTRATIVAS.' },
  { id: 'note-2', content: 'LA ORDEN DE OPERACIONES DEBE SER REALIZADA Y DIFUNDIDA TODOS LOS DÍAS POR EL JEFE DE LOS SERVICIOS DE GUARDIA.' },
  { id: 'note-3', content: 'EL ASEO DE LAS UNIDADES E INSTALACIONES (OFICINAS, CUADRA, BAÑOS Y COCINA) DEBE SER REALIZADA DIARIAMENTE.' },
];

export function useOrdenDelDiaNotes() {
  const [notas, setNotas] = useState<Nota[]>(NOTAS_POR_DEFECTO);

  const manejarUpdateNota = useCallback((id: string, content: string) => {
    setNotas((prev) =>
      prev.map((nota) => (nota.id === id ? { ...nota, content } : nota))
    );
  }, []);

  const manejarEliminarNota = useCallback((id: string) => {
    setNotas((prev) => prev.filter((nota) => nota.id !== id));
  }, []);

  const manejarAñadirNota = useCallback(() => {
    setNotas((prev) => [
      ...prev,
      { id: generateId('note'), content: '' },
    ]);
  }, []);

  const manejarRestaurarNotas = () => {
    setNotas(NOTAS_POR_DEFECTO);
    toast.success('Notas restauradas por defecto');
  };

  return {
    notas,
    setNotas,
    manejarUpdateNota,
    manejarEliminarNota,
    manejarAñadirNota,
    manejarRestaurarNotas
  };
}
