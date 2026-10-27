'use client';

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion, ChevronLeft, Newspaper } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="empty-state-container min-h-[80vh]">
      <div className="max-w-md">
        <div className="empty-state-icon-box">
          <FileQuestion className="h-7 w-7 text-primary" />
        </div>
        
        <h3 className="empty-state-title text-lg sm:text-xl">Página no encontrada</h3>
        <p className="empty-state-desc max-w-xs mt-2">
          El recurso que buscas no existe o ha sido movido. Verifica la dirección e intenta de nuevo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver atrás
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="default"
            size="sm"
          >
            <Newspaper className="h-4 w-4" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
