
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { CedulaInput } from '@/components/cedula-input';
import { PlusCircle, Trash2, Search, UserPlus, FileEdit } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PersonnelPage() {
    const { personnel, addMember, updateMember, removeMember, isLoaded: personnelLoaded } = usePersonnel();
    const { roles, isLoaded: rolesLoaded } = useRoles();

    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New member state
    const [newName, setNewName] = useState('');
    const [newCedula, setNewCedula] = useState('');
    const [newRole, setNewRole] = useState<string>('none');

    const filteredPersonnel = useMemo(() => {
        return personnel.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.cedula && p.cedula.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [personnel, searchQuery]);

    const handleAdd = () => {
        if (!newName.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        addMember({
            name: newName.trim(),
            cedula: newCedula || undefined,
            roleId: newRole === 'none' ? undefined : newRole
        });

        setNewName('');
        setNewCedula('');
        setNewRole('none');
        setIsAdding(false);
        toast.success('Personal añadido correctamente');
    };

    if (!personnelLoaded || !rolesLoaded) {
        return <div className="p-8 text-center text-muted-foreground">Cargando gestión de personal...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                    <p className="text-muted-foreground">Administra la base de datos central de todo el personal.</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
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
                            placeholder="Buscar por nombre o cédula..."
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
                                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                    <th className="px-4 py-3 text-left font-medium">Cédula</th>
                                    <th className="px-4 py-3 text-left font-medium">Cargo</th>
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPersonnel.length > 0 ? (
                                    filteredPersonnel.map(member => (
                                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <Input
                                                    value={member.name}
                                                    onChange={(e) => updateMember(member.id, { name: e.target.value })}
                                                    className="h-8 border-transparent focus:border-input bg-transparent hover:bg-background px-1 -ml-1 transition-all"
                                                    autoComplete="off"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <CedulaInput
                                                    value={member.cedula || ''}
                                                    onChange={(cedula) => updateMember(member.id, { cedula })}
                                                    className="h-8 border-transparent focus:border-input bg-transparent hover:bg-background px-1 -ml-1 transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    value={member.roleId || 'none'}
                                                    onValueChange={(val) => updateMember(member.id, { roleId: val === 'none' ? undefined : val })}
                                                >
                                                    <SelectTrigger className="h-8 border-transparent focus:border-input bg-transparent hover:bg-background px-1 -ml-1 shadow-none transition-all">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Sin cargo</SelectItem>
                                                        {roles.map(role => (
                                                            <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                            No se encontró personal que coincida con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
                El personal registrado aquí estará disponible para ser seleccionado en las Guardias y departamentos.
            </p>
        </div>
    );
}
