'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GuardStaffEditor } from '@/components/guard-staff-editor';
import { PlusCircle, Trash2, ShieldCheck, Save } from 'lucide-react';
import { useRef } from 'react';
import type { Guard, StaffMember, StaffRole, Department } from '@/types';
import { LEADER_ROLES } from '@/constants/roles';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
        (p) => p.roleId?.toLowerCase() === roleName.toLowerCase()
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
    if (window.confirm(`¿Eliminar Guardia "${guardId}"?`)) {
      const updatedGuards = guards.filter((g) => g.id !== guardId);
      await onGuardUpdate(updatedGuards);

      // Select first guard if current was deleted
      if (selectedGuardId === guardId && updatedGuards.length > 0) {
        setSelectedGuardId(updatedGuards[0]?.id || '');
      }

      toast.success('Guardia eliminada');
    }
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
        <Card className="flex flex-col min-h-0 border-muted/50 bg-muted/5 shadow-inner">
          <CardHeader className="pb-3 border-b bg-background/50 backdrop-blur-sm">
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
                          size="sm"
                          onClick={() => handleRemoveGuard(guard.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    {guards.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-xl bg-background/50">
                        No hay guardias creadas
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
          <Card className="flex flex-col min-h-0 border-muted/50 bg-background shadow-xl shadow-foreground/5 overflow-visible">
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
                className="hidden md:flex gap-2 h-8 px-3 shadow-md"
                onClick={() => editorRef.current?.save?.()}
              >
                <Save className="h-4 w-4" />
                <span className="font-bold">Guardar Personal</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1" type="always">
                <div className="p-6">
                  <GuardStaffEditor
                    ref={editorRef}
                    guard={selectedGuard}
                    onUpdate={handleStaffUpdate}
                    roles={roles}
                    onSave={() => toast.success('Personal de guardia actualizado')}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/5 border-muted-foreground/20 rounded-2xl">
            <div className="max-w-xs space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2 border border-primary/10">
                <ShieldCheck className="h-10 w-10 text-primary/30" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">Gestión de Guardias</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Elige una guardia del panel lateral o crea una nueva para empezar a asignar funcionarios y cargos operativos.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
