
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { PlusCircle, Trash2, Search, UserPlus, FileEdit, Download, Upload, UserCog, Activity, LifeBuoy, HeartPulse, User, Clock, Mail, Phone, ShieldCheck, Calendar, Hash, Users, FileText, LayoutGrid } from 'lucide-react';
import { GuardStaffEditor } from '@/components/guard-staff-editor';
import { StructureManager } from '@/components/structure-manager';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useAttendance } from '@/hooks/use-attendance';
import type { StaffMember, PersonnelStatus, Guard } from '@/types';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import Link from 'next/link';
import { useReports } from '@/hooks/use-reports';
import { CedulaInput } from '@/components/cedula-input';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CheckCircle2,
    XCircle,
    UserCircle,
    CalendarCheck,
    Share2
} from 'lucide-react';
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

const RANKS = [
    'OPC', 'OPC I', 'OPC II', 'OPC III',
    'OSPC I', 'OSPC II', 'OSPC III',
    'OCPC I', 'OCPC II'
];

const STATUS_OPTIONS: { value: PersonnelStatus; label: string; color: string }[] = [
    { value: 'activo', label: 'Activo', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'vacaciones', label: 'Vacaciones', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'permiso', label: 'Permiso', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'reposo', label: 'Reposo', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'apoyo', label: 'Apoyo', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
];

const ATTENDANCE_STATUS_CONFIG = {
    presente: { label: 'Presente', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    tarde: { label: 'Tarde', icon: Clock, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    permiso: { label: 'Permiso', icon: FileText, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    ausente: { label: 'Ausente', icon: XCircle, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

export default function PersonnelPage() {
    const { personnel, addMember, updateMember, removeMember, isLoaded: personnelLoaded, savePersonnel } = usePersonnel();
    const { roles, saveRoles, isLoaded: rolesLoaded } = useRoles();
    const { departments, addDepartment, removeDepartment, updateDepartment, isLoaded: deptsLoaded, saveDepartments } = useDepartments();
    const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
    const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
    const { reports } = useReports();
    const { records, markAttendance, getRecordsByDate, isLoaded: attendanceLoaded } = useAttendance();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

    // New member state
    const [newName, setNewName] = useState('');
    const [newCedula, setNewCedula] = useState('');
    const [newRank, setNewRank] = useState<string>('OPC');
    const [newRole, setNewRole] = useState<string>('none');
    const [newSpecialties, setNewSpecialties] = useState<string[]>([]);

    // Guard state
    const [newGuardName, setNewGuardName] = useState('');

    const handleAddGuard = () => {
        if (!newGuardName.trim()) {
            toast.error('El nombre de la guardia es obligatorio');
            return;
        }
        if (guards.find(g => g.id === newGuardName.toUpperCase())) {
            toast.error('Esta guardia ya existe');
            return;
        }

        const newGuardObj: Guard = {
            id: newGuardName.toUpperCase(),
            staff: {},
        };
        saveGuards([...guards, newGuardObj].sort((a, b) => a.id.localeCompare(b.id)));
        setNewGuardName('');
        toast.success(`Guardia ${newGuardObj.id} creada`);
    };

    const handleRemoveGuard = (guardIdToRemove: string) => {
        if (window.confirm(`¿Estás seguro de eliminar la Guardia "${guardIdToRemove}"?`)) {
            saveGuards(guards.filter((guard) => guard.id !== guardIdToRemove));
            toast.success('Guardia eliminada');
        }
    };

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
            rank: newRank,
            roleId: newRole === 'none' ? undefined : newRole,
            status: 'activo',
            specialties: newSpecialties
        });

        setNewName('');
        setNewCedula('');
        setNewRank('OPC');
        setNewRole('none');
        setNewSpecialties([]);
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

    const [selectedGuardForEdit, setSelectedGuardForEdit] = useState<Guard | null>(null);

    // Attendance State
    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<Date>(new Date());
    const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
    const [filterAttendanceGuardId, setFilterAttendanceGuardId] = useState<string>('todos');

    // Set default attendance filter to active guard when loaded
    useEffect(() => {
        if (settingsLoaded && settings.activeGuardId) {
            setFilterAttendanceGuardId(settings.activeGuardId);
        }
    }, [settingsLoaded, settings.activeGuardId]);

    const formattedAttendanceDate = format(selectedAttendanceDate, 'yyyy-MM-dd');
    const displayAttendanceDate = format(selectedAttendanceDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const isAttendanceEditable = !isBefore(startOfDay(selectedAttendanceDate), startOfDay(new Date()));

    const dailyAttendanceRecords = useMemo(() => getRecordsByDate(formattedAttendanceDate), [getRecordsByDate, formattedAttendanceDate]);

    const attendanceStats = useMemo(() => {
        const total = personnel.length || 1;
        const present = dailyAttendanceRecords.filter(r => r.status === 'presente').length;
        const late = dailyAttendanceRecords.filter(r => r.status === 'tarde').length;
        const permit = dailyAttendanceRecords.filter(r => r.status === 'permiso').length;
        const absent = dailyAttendanceRecords.filter(r => r.status === 'ausente').length;

        return [
            { label: 'Presentes', value: present, percentage: Math.round((present / total) * 100), color: 'text-emerald-600', sub: `${Math.round((present / total) * 100)}% del personal` },
            { label: 'Tardanzas', value: late, percentage: Math.round((late / total) * 100), color: 'text-amber-600', sub: `${(late / total * 100).toFixed(1)}% del personal` },
            { label: 'Permisos', value: permit, sub: 'Justificados', color: 'text-blue-600' },
            { label: 'Ausentes', value: absent, percentage: Math.round((absent / total) * 100), color: 'text-rose-600', sub: `${(absent / total * 100).toFixed(1)}% del personal` },
        ];
    }, [personnel, dailyAttendanceRecords]);

    const filteredAttendancePersonnel = useMemo(() => {
        let currentList = personnel;

        // Filter by Guard
        if (filterAttendanceGuardId !== 'todos') {
            const activeGuard = guards.find(g => g.id === filterAttendanceGuardId);
            if (activeGuard) {
                const guardMemberIds = new Set<string>();
                const guardMemberNames = new Set<string>();

                Object.values(activeGuard.staff).flat().forEach(member => {
                    if (member.personnelId) guardMemberIds.add(member.personnelId);
                    if (member.name) guardMemberNames.add(member.name.toLowerCase().trim());
                });

                currentList = currentList.filter(p =>
                    guardMemberIds.has(p.id) ||
                    guardMemberNames.has(p.name.toLowerCase().trim())
                );
            }
        }

        return currentList.filter(p =>
            p.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
            p.cedula?.includes(attendanceSearchQuery)
        );
    }, [personnel, attendanceSearchQuery, filterAttendanceGuardId, guards]);

    const handleAttendanceStatusChange = (memberId: string, status: any) => {
        if (!isAttendanceEditable) {
            toast.error('No se puede modificar la asistencia de días anteriores.');
            return;
        }
        const time = status === 'presente' || status === 'tarde' ? format(new Date(), 'HH:mm') : undefined;
        markAttendance(memberId, formattedAttendanceDate, status, time);
    };

    if (!personnelLoaded || !rolesLoaded || !guardsLoaded || !attendanceLoaded || !deptsLoaded) {
        return <div className="p-8 text-center text-muted-foreground">Cargando gestión operativa...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión Operativa</h1>
                    <p className="text-muted-foreground">Administra el personal, sus cargos y la conformación de las guardias.</p>
                </div>
            </div>

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
                        {!isAdding && (
                            <Button size="sm" onClick={() => setIsAdding(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Personal
                            </Button>
                        )}
                    </div>

                    {isAdding && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg">Nuevo Miembro del Personal</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jerarquía</Label>
                                        <Select value={newRank} onValueChange={setNewRank}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Jerarquía..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RANKS.map(rank => (
                                                    <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Especialidades</Label>
                                        <MultiInput
                                            value={newSpecialties}
                                            onChange={(val) => setNewSpecialties(Array.isArray(val) ? val : [val])}
                                            placeholder="Añadir especialidad (Ej. Rescate, Prehospitalaria)..."
                                        />
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
                                            <th className="px-4 py-3 text-left font-medium">Departamento</th>
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
                                                            <div className="font-medium">
                                                                {member.rank && <span className="text-xs font-mono text-primary mr-1">{member.rank}</span>}
                                                                {member.name}
                                                            </div>
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
                                                        <td className="px-4 py-3">
                                                            {(() => {
                                                                const role = roles.find(r => r.name === member.roleId);
                                                                const scopes = role?.departmentScope || [];
                                                                if (scopes.length === 0) return <span className="text-[10px] text-muted-foreground uppercase font-medium">Global</span>;
                                                                return (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {scopes.map(s => {
                                                                            if (s === 'OPERATIONS') return <Badge key={s} variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5">Operaciones</Badge>;
                                                                            const dept = departments.find(d => d.id === s);
                                                                            return <Badge key={s} variant="outline" className="text-[9px] border-muted-foreground/30">{dept?.name || s}</Badge>;
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()}
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
                                                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Jerarquía / Rango</Label>
                                                                                        <p className="text-sm font-medium">{editingMember.rank || 'OPC'}</p>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Nombre Completo</Label>
                                                                                        <p className="text-sm font-medium">{editingMember.name}</p>
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
                                                                                                    <Label>Jerarquía</Label>
                                                                                                    <Select value={editingMember.rank || 'OPC'} onValueChange={(val) => {
                                                                                                        setEditingMember({ ...editingMember, rank: val });
                                                                                                        updateMember(editingMember.id, { rank: val });
                                                                                                    }}>
                                                                                                        <SelectTrigger>
                                                                                                            <SelectValue />
                                                                                                        </SelectTrigger>
                                                                                                        <SelectContent>
                                                                                                            {RANKS.map(rank => (
                                                                                                                <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                                                                                            ))}
                                                                                                        </SelectContent>
                                                                                                    </Select>
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    <Label>Nombre Completo</Label>
                                                                                                    <Input value={editingMember.name} onChange={(e) => {
                                                                                                        const updated = { ...editingMember, name: e.target.value };
                                                                                                        setEditingMember(updated);
                                                                                                        updateMember(editingMember.id, { name: e.target.value });
                                                                                                    }} />
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    <Label>Estatus</Label>
                                                                                                    <Select value={editingMember.status || 'activo'} onValueChange={(val: PersonnelStatus) => {
                                                                                                        setEditingMember({ ...editingMember, status: val });
                                                                                                        updateMember(editingMember.id, { status: val });
                                                                                                    }}>
                                                                                                        <SelectTrigger>
                                                                                                            <SelectValue />
                                                                                                        </SelectTrigger>
                                                                                                        <SelectContent>
                                                                                                            {STATUS_OPTIONS.map(opt => (
                                                                                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                                                            ))}
                                                                                                        </SelectContent>
                                                                                                    </Select>
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    <Label>Especialidades</Label>
                                                                                                    <MultiInput
                                                                                                        value={editingMember.specialties || []}
                                                                                                        onChange={(val) => {
                                                                                                            const specialties = Array.isArray(val) ? val : [val];
                                                                                                            setEditingMember({ ...editingMember, specialties });
                                                                                                            updateMember(editingMember.id, { specialties });
                                                                                                        }}
                                                                                                    />
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

                </TabsContent>

                <TabsContent value="structure" className="space-y-6 mt-0">
                    <div className="space-y-1 px-1">
                        <h2 className="text-xl font-bold font-heading">Estructura Organizativa</h2>
                        <p className="text-sm text-muted-foreground">Define las unidades y las responsabilidades administrativas.</p>
                    </div>

                    <StructureManager
                        roles={roles}
                        departments={departments}
                        onRolesChange={saveRoles}
                        onDepartmentsChange={saveDepartments}
                        onAddDepartment={(name) => {
                            addDepartment({ id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name, staff: {} });
                            toast.success(`Departamento "${name}" creado`);
                        }}
                        onRemoveDepartment={(id) => {
                            const dept = departments.find(d => d.id === id);
                            if (window.confirm(`¿Eliminar el departamento "${dept?.name}"? Los cargos asignados a él pasarán a ser Globales.`)) {
                                removeDepartment(id);
                                const updatedRoles = roles.map(r => ({
                                    ...r,
                                    departmentScope: r.departmentScope ? r.departmentScope.filter(dld => dld !== id) : []
                                }));
                                saveRoles(updatedRoles);
                                toast.success('Departamento eliminado');
                            }
                        }}
                        onAddRole={(name) => {
                            if (!roles.find(r => r.name.toLowerCase() === name.toLowerCase())) {
                                saveRoles([...roles, { name, isSingle: false, departmentScope: [] }]);
                                toast.success(`Cargo "${name}" añadido`);
                            } else {
                                toast.error('Este cargo ya existe');
                            }
                        }}
                        onRemoveRole={(name) => {
                            if (window.confirm(`¿Eliminar el cargo "${name}"?`)) {
                                saveRoles(roles.filter(r => r.name !== name));
                                toast.success('Cargo eliminado');
                            }
                        }}
                        onSave={() => {
                            toast.success('Cambios de estructura guardados en almacenamiento local');
                        }}
                    />
                </TabsContent>

                <TabsContent value="guards" className="space-y-6 mt-0">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold">Guardias Operativas</h2>
                            <p className="text-sm text-muted-foreground">Configuración de los equipos de guardia y rotación.</p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Nueva Guardia
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Añadir Nueva Guardia</DialogTitle>
                                    <DialogDescription>
                                        Ingresa el identificador para la nueva guardia (ej. A, B, C, D).
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="new-guard-name">Nombre de la Guardia</Label>
                                    <Input
                                        id="new-guard-name"
                                        value={newGuardName}
                                        onChange={(e) => setNewGuardName(e.target.value)}
                                        placeholder="Ej: E"
                                        className="mt-2"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddGuard}>Crear Guardia</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader className="pb-3 px-4">
                            <CardTitle className="text-base">Listado de Guardias</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-y">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Identificador</th>
                                            <th className="px-4 py-3 text-left font-medium">Personal Asignado</th>
                                            <th className="px-4 py-3 text-left font-medium">Estado</th>
                                            <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {guards.length > 0 ? (
                                            guards.map((guard) => {
                                                const totalStaff = Object.values(guard.staff).flat().length;
                                                const isActive = settings.activeGuardId === guard.id;
                                                return (
                                                    <tr key={guard.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold flex items-center gap-2">
                                                                <ShieldCheck className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                                                Guardia "{guard.id}"
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                                <span>{totalStaff} funcionarios</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isActive ? (
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                                                    ACTIVA HOY
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-muted-foreground">
                                                                    En Reserva
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-primary"
                                                                    onClick={() => setSelectedGuardForEdit(guard)}
                                                                >
                                                                    <UserCog className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleRemoveGuard(guard.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                    No hay guardias operativas definidas.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-dashed">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Configuración de Rotación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground/70">Duración del Turno (Horas)</Label>
                                    <div className="flex gap-2 max-w-[200px]">
                                        <Input
                                            type="number"
                                            value={settings.guardShiftDuration || 24}
                                            onChange={(e) => saveSettings({ ...settings, guardShiftDuration: parseInt(e.target.value, 10) || 0 })}
                                            className="h-8"
                                        />
                                        <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success('Duración actualizada')}>
                                            Guardar
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground">La guardia activa se cambia desde el</p>
                                    <Link href="/orden-del-dia" className="text-[10px] font-bold text-primary hover:underline">
                                        Generador de Orden del Día
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-6 mt-0">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold">Control de Asistencia</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{displayAttendanceDate}</p>
                                {!isAttendanceEditable && (
                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 font-bold px-1.5 h-5 uppercase">
                                        Solo Lectura
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar personal..."
                                    className="pl-10 h-9"
                                    value={attendanceSearchQuery}
                                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterAttendanceGuardId} onValueChange={setFilterAttendanceGuardId}>
                                <SelectTrigger className="h-9 w-[180px]">
                                    <SelectValue placeholder="Filtrar por guardia" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todo el Personal</SelectItem>
                                    {guards.map(g => (
                                        <SelectItem key={g.id} value={g.id}>Guardia "{g.id}"</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {attendanceStats.map((stat, i) => (
                            <Card key={i} className="bg-muted/30 border-none">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className={cn("text-3xl font-bold tracking-tighter", stat.color)}>{stat.value}</span>
                                    </div>
                                    <div className="mt-3 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", stat.color.replace('text-', 'bg-'))}
                                            style={{ width: `${stat.percentage || 0}%` }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {filteredAttendancePersonnel.length > 0 ? (
                                            filteredAttendancePersonnel.map((member) => {
                                                const record = dailyAttendanceRecords.find(r => r.memberId === member.id);
                                                const status = record?.status;
                                                const Config = status ? ATTENDANCE_STATUS_CONFIG[status as keyof typeof ATTENDANCE_STATUS_CONFIG] : null;

                                                return (
                                                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-full flex items-center justify-center border transition-all",
                                                                status ? "bg-white border-primary/20" : "bg-muted border-transparent"
                                                            )}>
                                                                {Config ? <Config.icon className={cn("h-5 w-5", Config.color.split(' ')[1])} /> : <User className="h-5 w-5 text-muted-foreground" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm leading-tight">{member.name}</p>
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                                    {member.cedula || 'V-00000000'}
                                                                    {guards.map(g => {
                                                                        const isInGuard = Object.values(g.staff).flat().some(m =>
                                                                            m.personnelId === member.id ||
                                                                            m.name.toLowerCase().trim() === member.name.toLowerCase().trim()
                                                                        );
                                                                        if (!isInGuard) return null;
                                                                        return (
                                                                            <Badge key={g.id} variant="outline" className="text-[8px] py-0 px-1 border-slate-200 bg-slate-50">
                                                                                G-{g.id}
                                                                            </Badge>
                                                                        );
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right flex flex-col items-end">
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Entrada</p>
                                                                <p className="text-xs font-mono font-bold">{record?.checkInTime || '--:--'}</p>
                                                            </div>
                                                            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                                                                {(['presente', 'tarde', 'permiso', 'ausente'] as const).map((s) => {
                                                                    const isActive = status === s;
                                                                    return (
                                                                        <button
                                                                            key={s}
                                                                            onClick={() => handleAttendanceStatusChange(member.id, s)}
                                                                            disabled={!isAttendanceEditable}
                                                                            className={cn(
                                                                                "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all",
                                                                                isActive
                                                                                    ? ATTENDANCE_STATUS_CONFIG[s].color
                                                                                    : "text-muted-foreground hover:text-foreground",
                                                                                !isAttendanceEditable && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                                                                            )}
                                                                        >
                                                                            {ATTENDANCE_STATUS_CONFIG[s].label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground">
                                                No se encontraron funcionarios con los filtros actuales.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 space-y-4">
                            <Card>
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" /> Historial por Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2 pt-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={selectedAttendanceDate}
                                        onSelect={(date) => date && setSelectedAttendanceDate(date)}
                                        className="rounded-md"
                                        locale={es}
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold gap-2">
                                    <FileText className="h-3 w-3" /> Reporte
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold gap-2">
                                    <Download className="h-3 w-3" /> Exportar
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

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

            <p className="text-xs text-center text-muted-foreground pb-8">
                El personal registrado aquí estará disponible para ser seleccionado en las Guardias y departamentos.
                Los funcionarios "No Activos" serán omitidos en las sugerencias automáticas.
            </p>

            {/* Guard Staff Editor Dialog */}
            <Dialog open={!!selectedGuardForEdit} onOpenChange={(open) => !open && setSelectedGuardForEdit(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Personal de la Guardia "{selectedGuardForEdit?.id}"</DialogTitle>
                        <DialogDescription>
                            Asigna los funcionarios a cada cargo operativo para esta guardia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {selectedGuardForEdit && (
                            <GuardStaffEditor
                                scopeId="OPERATIONS"
                                guard={selectedGuardForEdit}
                                roles={roles}
                                onUpdate={(updated) => {
                                    const updatedGuards = guards.map(g => g.id === updated.id ? updated as Guard : g);
                                    saveGuards(updatedGuards);
                                }}
                                onSave={() => {
                                    toast.success(`Personal de la Guardia ${selectedGuardForEdit.id} guardado`);
                                    setSelectedGuardForEdit(null);
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
