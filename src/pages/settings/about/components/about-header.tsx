import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AboutHeaderProps {
  version: string;
}

export const AboutHeader = ({ version }: AboutHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <Link to="/settings" className="shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Acerca de</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Versión <span className="text-primary font-bold">{version}</span> · Recursos de la plataforma.
        </p>
      </div>
    </div>
  );
};
