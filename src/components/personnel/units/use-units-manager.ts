import { useState, useEffect } from 'react';
import { useUnits } from '@/hooks/use-units';
import { toast } from 'sonner';

export function useUnitsManager() {
  const { units, saveUnits, isLoaded } = useUnits();
  const [localUnits, setLocalUnits] = useState<string[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setLocalUnits([...units].sort());
    }
  }, [units, isLoaded]);

  const handleAddUnit = () => {
    const trimmed = newUnitName.trim();
    if (trimmed && !localUnits.includes(trimmed)) {
      setLocalUnits(prev => [...prev, trimmed].sort());
      setNewUnitName('');
    } else if (localUnits.includes(trimmed)) {
      toast.error('Esta unidad ya existe');
    }
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    setLocalUnits(prev => prev.filter(u => u !== unitToRemove));
    toast.success('Unidad removida del borrador');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveUnits([...localUnits].sort());
      toast.success('Unidades actualizadas correctamente');
    } catch (error) {
      toast.error('Error al guardar las unidades');
    } finally {
      setIsSaving(false);
    }
  };

  const isModified = units.join(',') !== localUnits.join(',');

  return {
    localUnits,
    newUnitName,
    setNewUnitName,
    isSaving,
    confirmDeleteUnit,
    setConfirmDeleteUnit,
    handleAddUnit,
    handleRemoveUnit,
    handleSave,
    isLoaded,
    isModified
  };
}
