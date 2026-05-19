'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Briefcase, Check } from 'lucide-react';

export function WorkspaceSelectionDialog() {
  const { workspaces, currentWorkspace, switchWorkspace, cloudWorkspaces } = useWorkspaceManager();
  const { isAuthenticated } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(currentWorkspace);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    const skip = localStorage.getItem('skip-workspace-selection') === 'true';
    
    // Solo mostrar si está autenticado, tiene más de 1 workspace, 
    // no ha saltado la opción y no hemos preguntado en esta sesión.
    if (!skip && isAuthenticated && workspaces.length > 1 && !hasPrompted) {
      // Esperar un momento para que la app cargue visualmente
      const timer = setTimeout(() => {
        setOpen(true);
        setHasPrompted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, workspaces, hasPrompted]);

  const handleConfirm = async () => {
    if (dontAskAgain) {
      localStorage.setItem('skip-workspace-selection', 'true');
    }
    
    if (selectedWorkspace !== currentWorkspace) {
      await switchWorkspace(selectedWorkspace);
    }
    
    setOpen(false);
  };

  // No renderizar nada si no está abierto
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] border-border/50 shadow-2xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Seleccionar Área de Trabajo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Hemos detectado múltiples áreas de trabajo disponibles. Por favor, selecciona en cuál deseas trabajar hoy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspace === workspace;
            const cloudInfo = cloudWorkspaces?.find((cw: any) => cw.id === workspace);
            const displayName = cloudInfo?.name || workspace;
            const isLocal = workspace === 'minutasdb';

            return (
              <div
                key={workspace}
                onClick={() => setSelectedWorkspace(workspace)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:bg-muted/50 group",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                    : "border-border/50 bg-card hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isLocal ? 'Almacenamiento Local' : 'Área de Trabajo en la Nube'}
                    </p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground animate-in zoom-in duration-200">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="dont-ask" 
            checked={dontAskAgain} 
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
          />
          <Label 
            htmlFor="dont-ask" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            No volver a preguntar (esta será tu área predeterminada)
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="default" 
            onClick={handleConfirm}
            className="w-full sm:w-auto shadow-lg hover:shadow-primary/20 transition-all duration-300"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
