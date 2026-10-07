import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { useSettings } from '@/hooks/configuracion';
import { useUnits } from '@/hooks/configuracion';
import { useRoles } from '@/hooks/personal';
import { useReports } from '@/hooks/novedades';
import { useTemplates } from '@/hooks/plantillas';
import { useGuards } from '@/hooks/guardias';
import { useDrafts } from '@/hooks/novedades';
import { useFieldDefinitions } from '@/hooks/configuracion';
import { useDepartments } from '@/hooks/personal';
import { usePersonnel } from '@/hooks/personal';
import { useAddresses } from '@/hooks/direcciones';
import { useGuardHistory } from '@/hooks/guardias';
import { usePersonnelHistory } from '@/hooks/personal';
import { useProfile } from '@/hooks/configuracion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/components/providers/user-provider';
import { useWorkspaceManager } from '@/lib/db/db-context';

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
  const { clearAllPersonnel } = usePersonnel();
  const { clearAllAddresses } = useAddresses();
  const { clearAllGuardHistory } = useGuardHistory();
  const { clearAllPersonnelHistory } = usePersonnelHistory();
  const { clearProfile } = useProfile();
  const { isAdmin } = useUser();
  const { isCloud } = useWorkspaceManager();

  const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);

  // Prevent access to non-admins in cloud mode
  if (isCloud && !isAdmin) {
    return <Navigate to="/settings" replace />;
  }

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
        await clearAllPersonnel();
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
          clearAllPersonnel(),
          clearAllAddresses(),
          clearAllGuardHistory(),
          clearAllPersonnelHistory(),
          clearAllDefinitions(),
          clearAllSettings(),
          clearProfile(),
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
      title: '¿Restablecer Módulo de Personal y Unidades?',
      description:
        'Esta acción eliminará todo el personal, cargos y unidades actuales, y restaurará automáticamente la estructura Institucional por defecto. Úsalo para volver a la configuración de fábrica del organigrama.',
      buttonLabel: 'Restablecer Módulo de Personal y Unidades',
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
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-destructive" />
              Borrar datos de la app
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Restablece configuraciones, reportes o el estado completo del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          <Card className="shadow-xs border-destructive/40 overflow-hidden">
            <CardHeader className="bg-destructive/5 border-b border-destructive/10">
              <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
                <AlertTriangle className="h-5 w-5" />
                Zona de Peligro
              </CardTitle>
              <CardDescription>
                Las siguientes acciones son destructivas y no se pueden deshacer. Úsalas con precaución.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-destructive/10">
                {Object.entries(resetOptions).map(([key, option]) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 sm:gap-4 hover:bg-destructive/[0.03] transition-colors"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground">{option.buttonLabel}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                        {option.description}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setActionToConfirm(key)}
                      className="h-9 px-3 shrink-0 shadow-xs w-full sm:w-auto font-medium"
                      title={option.buttonLabel}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>{option.buttonLabel}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={!!actionToConfirm}
            onOpenChange={(open) => !open && setActionToConfirm(null)}
            onConfirm={handleConfirmReset}
            title={actionToConfirm ? resetOptions[actionToConfirm]?.title : ''}
            message={actionToConfirm ? resetOptions[actionToConfirm]?.description || '' : ''}
            confirmText="Sí, continuar"
            cancelText="Cancelar"
            variant="destructive"
          />
        </div>
      </ScrollArea>
    </div>
  );
}
