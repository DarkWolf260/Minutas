import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppBarActionPortal } from '@/components/layout/app-bar-action-portal';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useAdmin } from '@/hooks/admin';

export const PlantillasHeader = () => {
  const { isCloud } = useWorkspaceManager();
  const { isAdmin } = useAdmin();
  const showTabs = !(isCloud && !isAdmin);

  if (!showTabs) return null;

  return (
    <AppBarActionPortal>
      <TabsList className="grid w-[220px] grid-cols-2 h-9 p-1 shadow-xs bg-muted/60">
        <TabsTrigger value="editor" className="text-xs font-semibold">Gestionar</TabsTrigger>
        <TabsTrigger value="builder" className="text-xs font-semibold">Constructor</TabsTrigger>
      </TabsList>
    </AppBarActionPortal>
  );
};

