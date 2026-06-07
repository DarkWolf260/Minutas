import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useWorkspaceManager } from '@/lib/db/db-context';
import { useAdmin } from '@/hooks/use-admin';

export const PlantillasHeader = () => {
  const { isCloud } = useWorkspaceManager();
  const { isAdmin } = useAdmin();
  const showTabs = !(isCloud && !isAdmin);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 w-full shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/settings" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Plantillas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y construye plantillas para reportes internos.
          </p>
        </div>
      </div>
      
      {showTabs && (
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 w-full sm:w-auto">
          <TabsList className="grid w-[240px] grid-cols-2 shadow-sm">
            <TabsTrigger value="editor">Gestionar</TabsTrigger>
            <TabsTrigger value="builder">Constructor</TabsTrigger>
          </TabsList>
        </div>
      )}
    </div>
  );
};
