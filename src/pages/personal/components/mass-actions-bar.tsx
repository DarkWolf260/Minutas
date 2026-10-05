import React from 'react';
import { Trash2, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUS_OPTIONS } from '@/lib/constants/personnel';
import type { PersonnelStatus } from '@/lib/types';

interface MassActionsBarProps {
  selectedCount: number;
  onDeleteRequest: () => void;
  onUpdateStatusRequest?: (status: PersonnelStatus) => void;
  onClearSelection?: () => void;
}

export const MassActionsBar = ({
  selectedCount,
  onDeleteRequest,
  onUpdateStatusRequest,
  onClearSelection,
}: MassActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto">
      <div className="flex items-center gap-3 p-2.5 px-4 bg-background/95 border border-border shadow-2xl rounded-2xl ring-1 ring-border/20 backdrop-blur-md select-none max-w-[95vw]">
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <span className="text-xs font-bold text-foreground whitespace-nowrap bg-muted px-2.5 py-1 rounded-lg">
            {selectedCount} seleccionados
          </span>
          {onClearSelection && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              title="Deseleccionar todos"
              aria-label="Deseleccionar todos"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onUpdateStatusRequest && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium shadow-xs"
                >
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Cambiar Estado</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Asignar nuevo estado
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onUpdateStatusRequest(opt.value as PersonnelStatus)}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteRequest}
            className="h-8 gap-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
