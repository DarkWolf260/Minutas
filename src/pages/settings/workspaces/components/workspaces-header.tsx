import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WorkspacesHeader() {
  return (
    <div className="flex items-center gap-4">
      <Link to="/settings" className="shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Áreas de Trabajo</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona entornos independientes para tus reportes. Cada área tiene su propia base de datos local.
        </p>
      </div>
    </div>
  );
}
