'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    LayoutGrid,
    ShieldCheck,
    CalendarCheck,
    Download,
    Upload,
    PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useGuards } from '@/hooks/use-guards';
import { useAttendance } from '@/hooks/use-attendance';
import { useReports } from '@/hooks/use-reports';
import type { StaffMember } from '@/types';
import { StructureManager } from '@/components/structure-manager';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

// Extracted components
import { PersonnelTable } from './components/personnel-table';
import { AddEditPersonnelDialog } from './components/add-edit-personnel-dialog';
import { AttendanceManager } from './components/attendance-manager';
import { GuardAssignmentPanel } from './components/guard-assignment-panel';

function PersonnelPageContent() {
    // Hooks
    const { personnel, addMember, updateMember, removeMember, isLoaded: personnelLoaded, savePersonnel } = usePersonnel();
    const { roles, saveRoles, isLoaded: rolesLoaded } = useRoles();
    const { departments, saveDepartments, isLoaded: deptsLoaded } = useDepartments();
    const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
    const { records, markAttendance, isLoaded: attendanceLoaded } = useAttendance();
    const { reports } = useReports();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [viewHistoryMember, setViewHistoryMember] = useState<StaffMember | null>(null);

    // Attendance state
    const [attendanceDate, setAttendanceDate] = useState(new Date());

    // Loading state
    const isLoading = !personnelLoaded || !rolesLoaded || !deptsLoaded || !guardsLoaded || !attendanceLoaded;

    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Personal</h1>
                    <p className="text-muted-foreground">Cargando datos...</p>
                </div>
                <DataTableSkeleton rows={10} columns={5} />
            </div>
        );
    }

    // Handlers
    const handleEdit = (member: StaffMember) => {
        setEditingMember(member);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingMember(null);
        setIsDialogOpen(true);
    };

    const handleSave = (data: Partial<StaffMember>) => {
        if (editingMember) {
            // Update existing
            updateMember(editingMember.id, data);
        } else {
            // Add new - ensure name is provided
            if (data.name) {
                addMember(data as Omit<StaffMember, 'id'>);
            }
        }
        setIsDialogOpen(false);
        setEditingMember(null);
    };

    const handleCancel = () => {
        setIsDialogOpen(false);
        setEditingMember(null);
    };

    const handleDelete = (id: string) => {
        removeMember(id);
        toast.success('Personal eliminado');
    };

    const handleViewHistory = (member: StaffMember) => {
        setViewHistoryMember(member);
        // TODO: Implement history view dialog
        toast.info(`Historial de ${member.name} - Pendiente de implementar`);
    };

    // CSV Export
    const downloadTemplate = () => {
        const csv = 'Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus\nOPC,Juan Pérez,V-12345678,Técnico,,activo';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_personal.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // CSV Import
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;

            try {
                const lines = content.split('\n');
                const startIdx = lines[0]?.toLowerCase().includes('nombre') ? 1 : 0;
                let imported = 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i]?.trim();
                    if (!line) continue;

                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length >= 2 && parts[1]) {
                        addMember({
                            rank: parts[0] || 'OPC',
                            name: parts[1],
                            cedula: parts[2] || undefined,
                            roleId: parts[3] || undefined,
                            department: parts[4] || undefined,
                            status: (parts[5] as any) || 'activo',
                        });
                        imported++;
                    }
                }

                toast.success(`${imported} personas importadas correctamente`);
            } catch (error) {
                toast.error('Error al importar el archivo CSV');
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    return (
        <div className="container mx-auto p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Personal</h1>
                <p className="text-muted-foreground">
                    Administra el personal, sus cargos y la conformación de las guardias.
                </p>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="personnel" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="personnel" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Funcionarios
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Estructura
                    </TabsTrigger>
                    <TabsTrigger value="guards" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Guardias
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        Asistencia
                    </TabsTrigger>
                </TabsList>

                {/* Personnel Tab */}
                <TabsContent value="personnel" className="space-y-6 mt-0">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download className="mr-2 h-4 w-4" />
                            Plantilla
                        </Button>
                        <div className="relative">
                            <Button variant="outline" size="sm" className="relative overflow-hidden cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                Importar CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                            </Button>
                        </div>
                        <Button size="sm" onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Personal
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <PersonnelTable
                                personnel={personnel}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewHistory={handleViewHistory}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Structure Tab */}
                <TabsContent value="structure">
                    <StructureManager
                        roles={roles}
                        departments={departments}
                        onRolesChange={saveRoles}
                        onDepartmentsChange={saveDepartments}
                        onAddDepartment={() => { }}
                        onRemoveDepartment={() => { }}
                        onAddRole={() => { }}
                        onRemoveRole={() => { }}
                        onSave={() => { }}
                    />
                </TabsContent>

                {/* Guards Tab */}
                <TabsContent value="guards">
                    <GuardAssignmentPanel
                        guards={guards}
                        personnel={personnel}
                        roles={roles}
                        onGuardUpdate={saveGuards}
                    />
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance">
                    <AttendanceManager
                        personnel={personnel}
                        date={attendanceDate}
                        onDateChange={setAttendanceDate}
                        attendanceRecords={records}
                        onMarkAttendance={markAttendance}
                    />
                </TabsContent>
            </Tabs>

            {/* Add/Edit Dialog */}
            <AddEditPersonnelDialog
                open={isDialogOpen}
                member={editingMember}
                roles={roles}
                departments={departments}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default function PersonnelPage() {
    return (
        <FeatureErrorBoundary featureName="Personal">
            <PersonnelPageContent />
        </FeatureErrorBoundary>
    );
}
