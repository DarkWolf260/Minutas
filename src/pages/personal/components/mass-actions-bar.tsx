import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MassActionsBarProps {
  selectedCount: number;
  onDeleteRequest: () => void;
}

export const MassActionsBar = ({ selectedCount, onDeleteRequest }: MassActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-2 md:top-28 h-0 overflow-visible z-[45] w-full px-4 animate-in slide-in-from-top-4 duration-300 pointer-events-none shrink-0">
      <div className="max-w-[1600px] mx-auto flex justify-center md:justify-end pointer-events-none">
        <div className="w-full md:w-auto min-w-[300px] flex items-center justify-between gap-4 p-3 px-5 bg-[#fff1f1] dark:bg-[#2a0a0a] border border-destructive/20 shadow-2xl rounded-2xl ring-1 ring-destructive/10 backdrop-blur-md select-none pointer-events-auto">
          <span className="text-sm font-bold text-destructive whitespace-nowrap">
            {selectedCount} seleccionados
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteRequest}
            className="shadow-md h-9 md:h-8 font-bold px-4 rounded-xl transition-all active:scale-95"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Eliminar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
