import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PersonnelHeader = () => {
  return (
    <div className="flex flex-col gap-4 mb-6 shrink-0 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Administración de funcionarios, cargos y jerarquías de la institución.
          </p>
        </div>
      </div>
    </div>
  );
};
