'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useGuards } from '@/hooks/use-guards';
import { useDrafts } from '@/hooks/use-drafts';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useDepartments } from '@/hooks/use-departments';
import { 
  Trash2, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function BorrarDatosPage() {
  const { clearAllUnits } = useUnits();
  const { clearAllRoles } = useRoles();
  const { clearAllDepartments } = useDepartments();
  const { clearAllSettings } = useSettings();
  const { clearAllReports } = useReports();
  const { clearAllTemplates } = useTemplates();
  const { clearAllGuards } = useGuards();
  const { clearAllDefinitions } = useFieldDefinitions();
  const { clearDraft } = useDrafts();
  const isMobile = useIsMobile();

  const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);

  const handleConfirmReset = async () => {
    if (!actionToConfirm) return;

    switch (actionToConfirm) {
      case 'reports':
        await clearAllReports();
        break;
      case 'templates':
        await clearAllTemplates();
        break;
      case 'staff':
        await clearAllRoles();
        await clearAllDepartments();
        await clearAllGuards();
        await clearAllUnits();
        break;
      case 'definitions':
        await clearAllDefinitions();
        break;
      case 'all':
        await Promise.all([
          clearAllReports(),
          clearAllTemplates(),
          clearAllRoles(),
          clearAllDepartments(),
          clearAllGuards(),
          clearAllUnits(),
          clearAllDefinitions(),
          clearAllSettings(),
          clearDraft(),
        ]);
        localStorage.removeItem('report-app-welcome-seen');
        window.location.reload();
        break;
    }

    setActionToConfirm(null);
  };

  const resetOptions: {
    [key: string]: { title: string; description: string; buttonLabel: string };
  } = {
    reports: {
      title: '¿Limpiar todos los reportes?',
      description:
        'Esta acción es irreversible. Se eliminarán permanentemente todos los reportes de novedades que has guardado.',
      buttonLabel: 'Limpiar Reportes',
    },
    templates: {
      title: '¿Limpiar todas las plantillas?',
      description:
        'Esta acción es irreversible. Se eliminarán permanentemente todas las plantillas y sus configuraciones asociadas.',
      buttonLabel: 'Limpiar Plantillas',
    },
    staff: {
      title: '¿Restablecer personal, guardias y unidades?',
      description:
        'Se eliminarán todas las guardias, departamentos, cargos personalizados y unidades, volviendo a la configuración por defecto. El personal y las unidades asignadas se perderán.',
      buttonLabel: 'Restablecer Personal y Unidades',
    },
    definitions: {
      title: '¿Restablecer etiquetas globales?',
      description:
        'Se eliminarán todas las etiquetas globales personalizadas, volviendo a la configuración por defecto.',
      buttonLabel: 'Restablecer Etiquetas',
    },
    all: {
      title: '¿Restablecer toda la aplicación?',
      description:
        '¡ADVERTENCIA! Esta acción es irreversible. Se eliminará TODA la información guardada (reportes, plantillas, configuraciones, personal) y se restaurará la aplicación a su estado inicial. Es como abrirla por primera vez.',
      buttonLabel: 'Restablecer Toda la Aplicación',
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto flex items-center gap-4 mb-2">
         <Link href="/settings">
           <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
           </Button>
         </Link>
         <h1 className="text-2xl font-bold tracking-tight">Borrar datos de la app</h1>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Zona de Peligro
          </CardTitle>
          <CardDescription>
            Las siguientes acciones son destructivas y no se pueden deshacer. Úsalas con
            precaución.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-destructive/10">
            {Object.entries(resetOptions).map(([key, option]) => (
              <div
                key={key}
                className="flex flex-row items-center justify-between p-4 sm:p-6 gap-4 hover:bg-destructive/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-destructive">{option.buttonLabel}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {option.description.split('.')[0]}.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setActionToConfirm(key)}
                  className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 shrink-0 shadow-sm"
                  title={option.buttonLabel}
                >
                  < Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{option.buttonLabel}</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isMobile ? (
        <Sheet
          open={!!actionToConfirm}
          onOpenChange={(open) => !open && setActionToConfirm(null)}
        >
          <SheetContent side="bottom" className="rounded-t-xl p-6">
            <SheetHeader className="text-left">
              <SheetTitle>
                {actionToConfirm && resetOptions[actionToConfirm]?.title}
              </SheetTitle>
              <SheetDescription>
                {actionToConfirm && resetOptions[actionToConfirm]?.description}
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-3">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold"
                onClick={handleConfirmReset}
              >
                Sí, continuar
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => setActionToConfirm(null)}
              >
                Cancelar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <AlertDialog
          open={!!actionToConfirm}
          onOpenChange={(open) => !open && setActionToConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionToConfirm && resetOptions[actionToConfirm]?.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionToConfirm && resetOptions[actionToConfirm]?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setActionToConfirm(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReset}>
                Sí, continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
