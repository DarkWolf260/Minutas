
import React from 'react';
import { Briefcase, PlusCircle, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Department, StaffRole } from '@/types';

interface RoleCardProps {
    roles: StaffRole[];
    departments: Department[];
    selectedDeptId: string;
    onSelectDept: (id: string) => void;
    onAdd: (name: string) => void;
    onRemove: (name: string) => void;
    onUpdateRole: (name: string, updates: Partial<StaffRole>) => void;
    onAssignDept: (roleName: string, deptId: string) => void;
}

export function RoleCard({
    roles,
    departments,
    selectedDeptId,
    onSelectDept,
    onAdd,
    onRemove,
    onUpdateRole,
    onAssignDept,
}: RoleCardProps) {
    const [newRoleName, setNewRoleName] = React.useState('');

    const filteredRoles = React.useMemo(() => {
        if (selectedDeptId === 'all') return roles;
        return roles.filter((r) => {
            if (selectedDeptId === 'global') return (r.departmentScope || []).length === 0;
            return (r.departmentScope || []).includes(selectedDeptId);
        });
    }, [roles, selectedDeptId]);

    const handleAdd = () => {
        if (newRoleName.trim()) {
            onAdd(newRoleName);
            setNewRoleName('');
        }
    };

    return (
        <Card className="shadow-sm border-muted/60">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Cargos / Roles</CardTitle>
                        <CardDescription className="text-xs">
                            Definición de funciones y su alcance
                        </CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Ver:</span>
                    <Select value={selectedDeptId} onValueChange={onSelectDept}>
                        <SelectTrigger className="h-7 text-[10px] w-[180px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los cargos</SelectItem>
                            <SelectItem value="global">Cargos Globales</SelectItem>
                            {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nuevo cargo..."
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className="h-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button size="sm" onClick={handleAdd} className="shrink-0">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir
                    </Button>
                </div>

                <div className="rounded-xl border bg-muted/20 divide-y divide-muted/60 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 p-3 px-4 bg-muted/40">
                        <div className="col-span-5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Nombre
                        </div>
                        <div className="col-span-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Alcance
                        </div>
                        <div className="col-span-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-center">
                            Único
                        </div>
                        <div className="col-span-1"></div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {filteredRoles.map((role) => (
                            <div
                                key={role.name}
                                className="grid grid-cols-12 gap-2 p-3 px-4 hover:bg-muted/30 transition-colors group items-center"
                            >
                                <div className="col-span-5 min-w-0">
                                    <span className="text-sm font-medium truncate block" title={role.name}>
                                        {role.name}
                                    </span>
                                </div>
                                <div className="col-span-4">
                                    <Select
                                        value={(role.departmentScope ?? [])[0] || 'global'}
                                        onValueChange={(val) => onAssignDept(role.name, val)}
                                    >
                                        <SelectTrigger className="h-7 text-[11px] bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global">Cargos Globales</SelectItem>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <Switch
                                        checked={role.isSingle}
                                        onCheckedChange={(checked) =>
                                            onUpdateRole(role.name, { isSingle: checked })
                                        }
                                        className="scale-75"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => onRemove(role.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredRoles.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground font-medium italic">
                                No hay cargos definidos para este filtro.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
