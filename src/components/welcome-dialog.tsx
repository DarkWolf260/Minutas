'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { logger } from '@/lib/logger';

const WELCOME_MESSAGE_KEY = 'report-app-welcome-seen';

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side.
    try {
      const hasSeenMessage = localStorage.getItem(WELCOME_MESSAGE_KEY);
      if (!hasSeenMessage) {
        setIsOpen(true);
      }
    } catch (error) {
      // localStorage can be disabled in some environments (e.g. private browsing)
      logger.warn('Could not access localStorage', { feature: 'UI', metadata: { component: 'WelcomeDialog', error } });
      // We can still show it once per session if localStorage is off
      if (!sessionStorage.getItem(WELCOME_MESSAGE_KEY)) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(WELCOME_MESSAGE_KEY, 'true');
    } catch (error) {
      logger.warn('Could not save to localStorage', { feature: 'UI', metadata: { component: 'WelcomeDialog', error } });
      // Fallback to sessionStorage for the current session
      sessionStorage.setItem(WELCOME_MESSAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            ¡Bienvenido al Generador de Reportes!
          </DialogTitle>
          <DialogDescription className="pt-2">
            Una nueva herramienta para simplificar tu trabajo diario.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground space-y-4">
          <p>
            Esta aplicación se encuentra en desarrollo y fue creada para facilitar la creación de
            reportes en base a plantillas que tú mismo puedes subir y personalizar.
          </p>
          <p className="font-semibold text-foreground">
            Tu privacidad es importante: todos los datos que ingreses, incluyendo plantillas y
            reportes, se guardan exclusivamente de forma local en tu navegador. No se comparte
            ninguna información con terceros.
          </p>
          <p>
            Para sacar el máximo provecho a la aplicación, te recomendamos leer la{' '}
            <Link
              href="/documentation"
              className="text-primary underline hover:text-primary/80"
              onClick={handleClose}
            >
              documentación
            </Link>
            .
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={handleClose}>
              ¡Entendido!
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
