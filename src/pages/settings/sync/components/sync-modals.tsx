import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { LoginDialog } from '@/components/auth/login-dialog';
import { QRScanner } from '@/components/sync/qr-scanner';

interface SyncModalsProps {
  hook: any;
  esQRScannerOpen: boolean;
  setEsQRScannerOpen: (v: boolean) => void;
}

export const SyncModals = ({ hook, esQRScannerOpen, setEsQRScannerOpen }: SyncModalsProps) => {
  const { 
    esLoginOpen, 
    setEsLoginOpen,
    esConfirmarReinicioOpen, 
    setEsConfirmarReinicioOpen, 
    esPrincipal, 
    reiniciarSync,
    setCodigoUnion 
  } = hook;

  return (
    <>
      {/* Login Dialog */}
      <LoginDialog open={esLoginOpen} onOpenChange={setEsLoginOpen} />

      {/* QR Scanner Dialog */}
      <Dialog open={esQRScannerOpen} onOpenChange={setEsQRScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Código QR</DialogTitle>
            <DialogDescription>
              Apunta la cámara al código QR que se muestra en el dispositivo principal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <QRScanner
              onScan={(data) => {
                setCodigoUnion(data);
                setEsQRScannerOpen(false);
              }}
              onClose={() => setEsQRScannerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Sync AlertDialog */}
      <AlertDialog open={esConfirmarReinicioOpen} onOpenChange={setEsConfirmarReinicioOpen}>
        <AlertDialogContent className="rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Desactivar sincronización?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {esPrincipal
                ? 'Se eliminará el canal y todos los reportes pendientes en Supabase. Los reportes ya importados no se verán afectados.'
                : 'Este dispositivo se desconectará del canal. Podrás volverte a conectar con el código del principal.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold shadow-lg shadow-destructive/20"
              onClick={() => { reiniciarSync(); setEsConfirmarReinicioOpen(false); }}
            >
              Sí, desactivar sincronización
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
