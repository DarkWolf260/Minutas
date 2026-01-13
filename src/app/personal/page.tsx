
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useGuards } from '@/hooks/use-guards'; // Import useGuards
import { useReports } from '@/hooks/use-reports';
import { CedulaInput } from '@/components/cedula-input';
import { PlusCircle, Trash2, Search, UserPlus, FileEdit, Download, Upload, UserCog, Activity, LifeBuoy, HeartPulse, User, Clock, Mail, Phone, ShieldCheck, Calendar, Hash } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StaffMember, PersonnelStatus } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MultiInput } from '@/components/ui/multi-input';

const STATUS_OPTIONS: { value: PersonnelStatus; label: string; color: string }[] = [
    { value: 'activo', label: 'Activo', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'vacaciones', label: 'Vacaciones', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'permiso', label: 'Permiso', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'reposo', label: 'Reposo', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

export default function PersonnelPage() {
    const { personnel, addMember, updateMember, removeMember, isLoaded: personnelLoaded, savePersonnel } = usePersonnel();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { guards } = useGuards();
    const { reports } = useReports();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

    // New member state
    const [newName, setNewName] = useState('');
    const [newCedula, setNewCedula] = useState('');
    const [newRole, setNewRole] = useState<string>('none');

    const filteredPersonnel = useMemo(() => {
        return personnel.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.cedula && p.cedula.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.specialties && p.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
        );
    }, [personnel, searchQuery]);

    const memberHistory = useMemo(() => {
        if (!editingMember) return [];
        return reports.filter(r => {
            const content = r.content.toLowerCase();
            return content.includes(editingMember.name.toLowerCase());
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [editingMember, reports]);

    const handleAdd = () => {
        if (!newName.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        addMember({
            name: newName.trim(),
            cedula: newCedula || undefined,
            roleId: newRole === 'none' ? undefined : newRole,
            status: 'activo',
            specialties: []
        });

        setNewName('');
        setNewCedula('');
        setNewRole('none');
        setIsAdding(false);
        toast.success('Personal añadido correctamente');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;

            try {
                const lines = content.split('\n');
                const newMembers: StaffMember[] = [];
                // Skip header if it exists (e.g., if first line contains "nombre" or "cedula")
                const startIdx = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const [name, cedula, role, department, email, phone, joinDate, bloodType, emergencyContact] = line.split(',').map(s => s.trim());
                    if (name) {
                        newMembers.push({
                            id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${i}`,
                            name,
                            cedula: cedula || undefined,
                            roleId: roles.find(r => r.name.toLowerCase() === role?.toLowerCase())?.name || undefined,
                            department: department || undefined,
                            email: email || undefined,
                            phone: phone || undefined,
                            joinDate: joinDate || undefined,
                            bloodType: bloodType || undefined,
                            emergencyContact: emergencyContact || undefined,
                            status: 'activo',
                            specialties: []
                        });
                    }
                }

                if (newMembers.length > 0) {
                    savePersonnel([...personnel, ...newMembers]);
                    toast.success(`Se importaron ${newMembers.length} miembros correctamente`);
                } else {
                    toast.error('No se encontraron datos válidos en el archivo');
                }
            } catch (error) {
                console.error('Error parsing CSV', error);
                toast.error('Error al procesar el archivo. Asegúrate de que el formato sea CSV.');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const downloadTemplate = () => {
        const header = 'Nombre,Cedula,Cargo,Departamento,Email,Telefono,Fecha Ingreso,Tipo Sangre,Contacto Emergencia\n';
        const example = 'Juan Perez,V-12345678,Conductor,Operaciones,juan@pc.gob.ve,0412-1112233,2022-02-25,O+,Maria (0412-0000000)\n';
        const blob = new Blob([header + example], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_personal.csv';
        a.click();
    };

    if (!personnelLoaded || !rolesLoaded) {
        return <div className="p-8 text-center text-muted-foreground">Cargando gestión de personal...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                    <p className="text-muted-foreground">Administra la base de datos central de todo el personal y su disponibilidad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Plantilla
                    </Button>
                    <div className="relative">
                        <Button variant="outline" className="relative overflow-hidden cursor-pointer">
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
                    {!isAdding && (
                        <Button onClick={() => setIsAdding(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Personal
                        </Button>
                    )}
                </div>
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Nuevo Miembro del Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre y Apellido</Label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ej. Juan Pérez"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cédula</Label>
                                <CedulaInput
                                    value={newCedula}
                                    onChange={setNewCedula}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo Predeterminado</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cargo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin cargo asignado</SelectItem>
                                        {roles.map(role => (
                                            <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                            <Button onClick={handleAdd}>Guardar Miembro</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, cédula o especialidad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm h-8"
                            autoComplete="off"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Nombre / Cédula</th>
                                    <th className="px-4 py-3 text-left font-medium">Estatus</th>
                                    <th className="px-4 py-3 text-left font-medium">Cargo</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Especialidades</th>
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPersonnel.length > 0 ? (
                                    filteredPersonnel.map(member => {
                                        const status = STATUS_OPTIONS.find(s => s.value === member.status) || STATUS_OPTIONS[0];
                                        return (
                                            <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{member.cedula || 'Sin cédula'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={cn("font-medium", status.color)}>
                                                        {status.label}
                                                    </Badge>
                                                    {/* Show Guard Badges */}
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {guards.map(g => {
                                                            const isInGuard = Object.values(g.staff).flat().some(m =>
                                                                m.personnelId === member.id ||
                                                                m.name.toLowerCase().trim() === member.name.toLowerCase().trim()
                                                            );
                                                            if (!isInGuard) return null;
                                                            return (
                                                                <Badge key={g.id} variant="secondary" className="text-[9px] px-1 h-4 bg-slate-100 border-slate-200 text-slate-700">
                                                                    G-{g.id}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs">{member.roleId || <span className="opacity-40 italic">Global</span>}</div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.specialties && member.specialties.length > 0 ? (
                                                            member.specialties.slice(0, 2).map(s => (
                                                                <Badge key={s} variant="secondary" className="text-[9px] px-1 h-4">
                                                                    {s}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground italic">Ninguna</span>
                                                        )}
                                                        {member.specialties && member.specialties.length > 2 && (
                                                            <span className="text-[9px] text-muted-foreground">+{member.specialties.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-primary"
                                                                    onClick={() => setEditingMember(member)}
                                                                >
                                                                    <UserCog className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            {editingMember && editingMember.id === member.id && (
                                                                <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 border-none sm:rounded-2xl shadow-2xl">
                                                                    <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                                                                        <DialogHeader className="px-0 pt-0">
                                                                            <DialogTitle className="text-xl font-bold text-foreground">Detalles del Personal</DialogTitle>
                                                                            <DialogDescription className="text-sm text-muted-foreground">
                                                                                Información completa del personal de Protección Civil
                                                                            </DialogDescription>
                                                                        </DialogHeader>

                                                                        {/* Profile Summary */}
                                                                        <div className="flex items-center gap-4 py-2">
                                                                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground border shrink-0">
                                                                                <User className="h-7 w-7" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h3 className="text-lg font-bold truncate">{editingMember.name}</h3>
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                    <span className="font-mono">{editingMember.cedula || 'SIN CÉDULA'}</span>
                                                                                    <span>•</span>
                                                                                    <Badge variant="outline" className={cn("px-1.5 py-0 h-4 text-[10px] uppercase font-bold", STATUS_OPTIONS.find(s => s.value === editingMember.status)?.color)}>
                                                                                        {STATUS_OPTIONS.find(s => s.value === editingMember.status)?.label}
                                                                                    </Badge>
                                                                                    {guards.map(g => {
                                                                                        const isInGuard = Object.values(g.staff).flat().some(m =>
                                                                                            m.personnelId === editingMember.id ||
                                                                                            m.name.toLowerCase().trim() === editingMember.name.toLowerCase().trim()
                                                                                        );
                                                                                        if (!isInGuard) return null;
                                                                                        return (
                                                                                            <Badge key={g.id} variant="secondary" className="text-[9px] px-1 h-4 bg-slate-100 border-slate-200 text-slate-700">
                                                                                                G-{g.id}
                                                                                            </Badge>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2 border-t">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Cargo / Rol</Label>
                                                                                <p className="text-sm font-medium">{editingMember.roleId || 'Sin asignar'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Departamento</Label>
                                                                                <p className="text-sm font-medium">{editingMember.department || 'Protección Civil'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Correo Electrónico</Label>
                                                                                <p className="text-sm font-medium truncate">{editingMember.email || 'No registrado'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Teléfono</Label>
                                                                                <p className="text-sm font-medium">{editingMember.phone || 'No registrado'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Fecha de Ingreso</Label>
                                                                                <p className="text-sm font-medium">{editingMember.joinDate || 'N/A'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">ID de Sistema</Label>
                                                                                <p className="text-sm font-mono text-muted-foreground truncate">{editingMember.id}</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Collapsible Editor (for modifications) */}
                                                                        <div className="pt-4 border-t">
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="outline" className="w-full text-xs font-bold gap-2 bg-background hover:bg-primary/5">
                                                                                        <FileEdit className="h-3 w-3" /> MODIFICAR DATOS DEL FUNCIONARIO
                                                                                    </Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="max-w-xl">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>Editar Funcionario</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <div className="grid grid-cols-2 gap-4 py-4">
                                                                                        <div className="space-y-2">
                                                                                            <Label>Nombre Completo</Label>
                                                                                            <Input value={editingMember.name} onChange={(e) => {
                                                                                                const updated = { ...editingMember, name: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { name: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Cédula</Label>
                                                                                            <CedulaInput value={editingMember.cedula || ''} onChange={(val) => {
                                                                                                const updated = { ...editingMember, cedula: val };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { cedula: val });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Email</Label>
                                                                                            <Input value={editingMember.email || ''} onChange={(e) => {
                                                                                                const updated = { ...editingMember, email: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { email: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Teléfono</Label>
                                                                                            <Input value={editingMember.phone || ''} onChange={(e) => {
                                                                                                const updated = { ...editingMember, phone: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { phone: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Departamento</Label>
                                                                                            <Input value={editingMember.department || ''} onChange={(e) => {
                                                                                                const updated = { ...editingMember, department: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { department: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Fecha de Ingreso</Label>
                                                                                            <Input type="date" value={editingMember.joinDate || ''} onChange={(e) => {
                                                                                                const updated = { ...editingMember, joinDate: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { joinDate: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Estatus</Label>
                                                                                            <Select value={editingMember.status || 'activo'} onValueChange={(val: PersonnelStatus) => {
                                                                                                const updated = { ...editingMember, status: val };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { status: val });
                                                                                            }}>
                                                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label>Tipo de Sangre</Label>
                                                                                            <Input value={editingMember.bloodType || ''} onChange={(e) => {
                                                                                                const updated = { ...editingMember, bloodType: e.target.value };
                                                                                                setEditingMember(updated);
                                                                                                updateMember(editingMember.id, { bloodType: e.target.value });
                                                                                            }} />
                                                                                        </div>
                                                                                    </div>
                                                                                    <DialogFooter>
                                                                                        <Button onClick={() => setEditingMember(null)}>Cerrar Edición</Button>
                                                                                    </DialogFooter>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-muted/20 p-4 border-t flex justify-end">
                                                                        <Button variant="outline" className="font-bold tracking-wider text-xs" onClick={() => setEditingMember(null)}>CERRAR VENTANA</Button>
                                                                    </div>
                                                                </DialogContent>
                                                            )}
                                                        </Dialog>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                if (window.confirm('¿Eliminar a este miembro del personal?')) {
                                                                    removeMember(member.id);
                                                                    toast.success('Miembro eliminado');
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No se encontró personal que coincida con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-muted/30">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" /> Total Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{personnel.length}</div>
                        <p className="text-[10px] text-muted-foreground">Funcionarios registrados</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-500">
                            <Activity className="h-4 w-4" /> Activos Hoy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{personnel.filter(p => p.status === 'activo').length}</div>
                        <p className="text-[10px] text-muted-foreground">Disponibles para asignar</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-500">
                            <LifeBuoy className="h-4 w-4" /> En Novedad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{personnel.filter(p => p.status !== 'activo').length}</div>
                        <p className="text-[10px] text-muted-foreground">Vacaciones/Reposos/Permisos</p>
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-center text-muted-foreground">
                El personal registrado aquí estará disponible para ser seleccionado en las Guardias y departamentos.
                Los funcionarios "No Activos" serán omitidos en las sugerencias automáticas.
            </p>
        </div>
    );
}
