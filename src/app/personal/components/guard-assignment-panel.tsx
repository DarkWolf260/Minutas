'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { GuardStaffEditor } from '@/components/guard-staff-editor';
import { PlusCircle, Trash2, ShieldCheck, ExternalLink } from 'lucide-react';
import type { Guard, StaffMember, StaffRole, Department } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

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
    const [selectedGuardId, setSelectedGuardId] = useState<string>(
        guards[0]?.id || ''
    );
    const [newGuardName, setNewGuardName] = useState('');

    const selectedGuard = guards.find(g => g.id === selectedGuardId);

    const handleAddGuard = () => {
        if (!newGuardName.trim()) {
            toast.error('El nombre de la guardia es obligatorio');
            return;
        }

        const guardId = newGuardName.toUpperCase();
        if (guards.find(g => g.id === guardId)) {
            toast.error('Esta guardia ya existe');
            return;
        }

        const newGuard: Guard = {
            id: guardId,
            staff: {},
        };

        const updatedGuards = [...guards, newGuard].sort((a, b) =>
            a.id.localeCompare(b.id)
        );

        onGuardUpdate(updatedGuards);
        setSelectedGuardId(guardId);
        setNewGuardName('');
        toast.success(`Guardia ${guardId} creada`);
    };

    const handleRemoveGuard = (guardId: string) => {
        if (window.confirm(`¿Eliminar Guardia "${guardId}"?`)) {
            const updatedGuards = guards.filter(g => g.id !== guardId);
            onGuardUpdate(updatedGuards);

            // Select first guard if current was deleted
            if (selectedGuardId === guardId && updatedGuards.length > 0) {
                setSelectedGuardId(updatedGuards[0]?.id || '');
            }

            toast.success('Guardia eliminada');
        }
    };

    const handleStaffUpdate = (updatedGuard: Guard | Department) => {
        onGuardUpdate(guards.map(g =>
            g.id === updatedGuard.id ? updatedGuard as Guard : g
        ));
    };

    return (
        <div className="space-y-6">
            {/* Guard Management */}
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
                {/* Sidebar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Guardias</CardTitle>
                        <CardDescription>Selecciona o crea una guardia</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add New Guard */}
                        <div className="space-y-2">
                            <Label htmlFor="new-guard">Nueva Guardia</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="new-guard"
                                    value={newGuardName}
                                    onChange={(e) => setNewGuardName(e.target.value)}
                                    placeholder="Ej. A, B, C..."
                                    className="uppercase"
                                    maxLength={10}
                                />
                                <Button size="icon" onClick={handleAddGuard}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Guard List */}
                        <div className="space-y-1">
                            <Label>Guardias Existentes</Label>
                            {guards.map((guard) => (
                                <div
                                    key={guard.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                                >
                                    <Button
                                        variant={selectedGuardId === guard.id ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex-1 justify-start"
                                        onClick={() => setSelectedGuardId(guard.id)}
                                    >
                                        <ShieldCheck className="h-3 w-3 mr-2" />
                                        Guardia {guard.id}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveGuard(guard.id)}
                                        className="text-destructive h-8 w-8 p-0"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}

                            {guards.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                    No hay guardias creadas
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content - Guard Staff Editor */}
                {selectedGuard ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Guardia {selectedGuard.id}</CardTitle>
                            <CardDescription>
                                Asigna personal a esta guardia
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GuardStaffEditor
                                guard={selectedGuard}
                                onUpdate={handleStaffUpdate}
                                roles={roles}
                                onSave={() => toast.success('Personal de guardia actualizado')}
                                scopeId="OPERATIONS"
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="flex items-center justify-center h-64">
                            <div className="text-center text-muted-foreground">
                                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Selecciona o crea una guardia para comenzar</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
