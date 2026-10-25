'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GuardStaffEditor } from '@/components/guards/guard-staff-editor';
import { PlusCircle, Trash2, ShieldCheck, Save } from 'lucide-react';
import { useRef } from 'react';
import type { Guard, StaffMember, StaffRole, Department } from '@/lib/types';
import { LEADER_ROLES } from '@/lib/constants/roles';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';

interface GuardAssignmentPanelProps {
  guards: Guard[];
  personnel: StaffMember[];
  roles: StaffRole[];
  onGuardUpdate: (guards: Guard[]) => void;
}

/**
 * Quick guard assignment panel
 *
 * Simplified interface for managing guard assignments.
 * For full features, users can navigate to the Guardias page.
 */
export function GuardAssignmentPanel({
  guards,
  personnel,
  roles,
  onGuardUpdate,
}: GuardAssignmentPanelProps) {
  const [selectedGuardId, setSelectedGuardId] = useState<string>(guards[0]?.id || '');
  const [newGuardName, setNewGuardName] = useState('');
  const editorRef = useRef<any>(null);
  const [confirmDeleteGuardId, setConfirmDeleteGuardId] = useState<string | null>(null);

  const selectedGuard = guards.find((g) => g.id === selectedGuardId);

  const handleAddGuard = async () => {
    if (!newGuardName.trim()) {
      toast.error('El nombre de la guardia es obligatorio');
      return;
    }

    const guardId = newGuardName.toUpperCase();
    if (guards.find((g) => g.id === guardId)) {
      toast.error('Esta guardia ya existe');
      return;
    }

    // Pre-load Director and Jefe de Operaciones from the personnel list
    const preStaff: Record<string, StaffMember[]> = {};
    const leaderRoles = [LEADER_ROLES.DIRECTOR, LEADER_ROLES.JEFE_OPERACIONES];
    leaderRoles.forEach((roleName) => {
      const member = personnel.find(
        (p) => p.role_id?.toLowerCase() === roleName.toLowerCase()
      );
      if (member) preStaff[roleName] = [member];
    });

    const newGuard: Guard = {
      id: guardId,
      staff: preStaff,
    };

    const updatedGuards = [...guards, newGuard].sort((a, b) => a.id.localeCompare(b.id));
    await onGuardUpdate(updatedGuards);
    setSelectedGuardId(guardId);
    setNewGuardName('');
    toast.success(`Guardia ${guardId} creada`);
  };

  const handleRemoveGuard = async (guardId: string) => {
    const updatedGuards = guards.filter((g) => g.id !== guardId);
    await onGuardUpdate(updatedGuards);

    // Select first guard if current was deleted
    if (selectedGuardId === guardId && updatedGuards.length > 0) {
      setSelectedGuardId(updatedGuards[0]?.id || '');
    }

    toast.success('Guardia eliminada');
  };

  const handleStaffUpdate = async (updatedGuard: Guard | Department) => {
    await onGuardUpdate(
      guards.map((g) => (g.id === updatedGuard.id ? (updatedGuard as Guard) : g))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full pb-4">
      {/* Guard Management */}
      <div className="grid md:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <Card className="flex flex-col min-h-0 border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/5 backdrop-blur-sm">
            <CardTitle className="text-base font-bold">Guardias</CardTitle>
            <CardDescription className="text-[11px]">Selecciona o crea una guardia operativa.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" type="always">
              <div className="space-y-6">
                {/* Add New Guard */}
                <div className="space-y-2">
                  <Label htmlFor="new-guard" className="text-[10px] uppercase font-bold text-muted-foreground px-1">Nueva Guardia</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-guard"
                      name="new-guard"
                      value={newGuardName}
                      onChange={(e) => setNewGuardName(e.target.value)}
                      placeholder="Ej. A, B, C..."
                      className="uppercase bg-background h-9 text-sm"
                      maxLength={10}
                    />
                    <Button size="icon" onClick={handleAddGuard} className="shrink-0 h-9 w-9">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Guard List */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Guardias Existentes</Label>
                  <div className="space-y-1">
                    {guards.map((guard) => (
                      <div
                        key={guard.id}
                        className={cn(
                          "flex items-center justify-between p-1 rounded-lg transition-all group",
                          selectedGuardId === guard.id ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "flex-1 justify-start h-9 text-sm font-medium",
                            selectedGuardId === guard.id ? "text-primary font-bold" : "text-muted-foreground"
                          )}
                          onClick={() => setSelectedGuardId(guard.id)}
                        >
                          <ShieldCheck className={cn("h-4 w-4 mr-2", selectedGuardId === guard.id ? "text-primary" : "text-muted-foreground/30")} />
                          Guardia {guard.id}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmDeleteGuardId(guard.id)}
                          className="text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Eliminar guardia"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    {guards.length === 0 && (
                      <div className="empty-state-container py-8 border border-border/60 rounded-xl bg-muted/20">
                        <div className="empty-state-icon-box">
                          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="empty-state-title text-xs">Sin guardias</p>
                        <p className="empty-state-desc text-[11px]">No hay guardias creadas en el sistema.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Guard Staff Editor */}
        {selectedGuard ? (
          <Card className="flex flex-col min-h-0 border bg-card shadow-sm overflow-visible">
            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-primary">Guardia {selectedGuard.id}</CardTitle>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Activo</span>
                  </div>
                  <CardDescription className="text-[11px]">Asigna personal y define la jerarquía operativa para esta guardia.</CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                className="flex gap-1.5 h-9 px-3 shadow-xs"
                onClick={() => editorRef.current?.save?.()}
              >
                <Save className="h-4 w-4" />
                <span className="font-bold text-xs sm:text-sm">Guardar</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
              <GuardStaffEditor
                ref={editorRef}
                guard={selectedGuard}
                onUpdate={handleStaffUpdate}
                roles={roles}
                onSave={() => toast.success('Personal de guardia actualizado')}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center border bg-card rounded-xl shadow-2xs">
            <div className="empty-state-container max-w-sm">
              <div className="empty-state-icon-box">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="empty-state-title text-base sm:text-lg">Gestión de Guardias</h3>
              <p className="empty-state-desc">
                Elige una guardia del panel lateral o crea una nueva para empezar a asignar funcionarios y cargos operativos.
              </p>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteGuardId}
        onOpenChange={(open) => !open && setConfirmDeleteGuardId(null)}
        title="Eliminar Guardia"
        message={`¿Estás seguro de que deseas eliminar la Guardia "${confirmDeleteGuardId}"? Esta acción borrará permanentemente la asignación de personal para esta guardia.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteGuardId) {
            handleRemoveGuard(confirmDeleteGuardId);
            setConfirmDeleteGuardId(null);
          }
        }}
      />
    </div>
  );
}


