import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkspaceControlsProps {
  onCreate: (name: string) => void;
  onImport: (file: File) => void;
}

export function WorkspaceControls({ onCreate, onImport }: WorkspaceControlsProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [mode, setMode] = useState<'none' | 'local'>('none');

  const handleCreateLocal = () => {
    if (!newWorkspaceName.trim()) return;
    onCreate(newWorkspaceName);
    setNewWorkspaceName('');
    setMode('none');
  };

  if (mode === 'local') {
    return (
      <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1">
            Nueva Área Local (Offline)
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="new-workspace-name"
              name="new-workspace-name"
              placeholder="Nombre del área..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="h-10 rounded-xl"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateLocal();
                else if (e.key === 'Escape') setMode('none');
              }}
            />
            <Button
              size="sm"
              className="h-10 px-4 rounded-xl font-bold"
              disabled={!newWorkspaceName.trim()}
              onClick={handleCreateLocal}
            >
              Crear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 rounded-xl"
              onClick={() => setMode('none')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Button
        variant="outline"
        className="h-12 rounded-xl border-dashed hover:border-primary hover:bg-primary/5 transition-all group"
        onClick={() => setMode('local')}
      >
        <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
        Área Local
      </Button>

      <Button
        variant="outline"
        className="h-12 rounded-xl border-dashed hover:bg-muted/50"
        onClick={() => document.getElementById('import-workspace-input')?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Importar (.json)
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
  );
}
