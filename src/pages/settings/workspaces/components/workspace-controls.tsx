import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkspaceControlsProps {
  onCreate: (name: string) => void;
  onImport: (file: File) => void;
}

export function WorkspaceControls({ onCreate, onImport }: WorkspaceControlsProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  return (
    <div className="pt-2">
      {isCreatingWorkspace ? (
        <div className="flex items-center gap-2">
          <Input
            id="new-workspace-name"
            name="new-workspace-name"
            placeholder="Nombre de la nueva área..."
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="h-9"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCreate(newWorkspaceName);
                setNewWorkspaceName('');
                setIsCreatingWorkspace(false);
              } else if (e.key === 'Escape') {
                setIsCreatingWorkspace(false);
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              onCreate(newWorkspaceName);
              setNewWorkspaceName('');
              setIsCreatingWorkspace(false);
            }}
          >
            Crear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCreatingWorkspace(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 border-dashed h-12"
            onClick={() => setIsCreatingWorkspace(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Área
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-dashed h-12"
            onClick={() => document.getElementById('import-workspace-input')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar Área
          </Button>

          <input
            id="import-workspace-input"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = ''; // Reset input
            }}
          />
        </div>
      )}
    </div>
  );
}
