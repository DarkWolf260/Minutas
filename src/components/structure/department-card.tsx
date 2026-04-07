
import React from 'react';
import { Building2, PlusCircle, ShieldCheck, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Department } from '@/lib/types';

interface DepartmentCardProps {
    departments: Department[];
    selectedDeptId: string;
    onSelectDept: (id: string) => void;
    onAdd: (name: string) => void;
    onRemove: (id: string) => void;
    onLoadInstitutional: () => void;
}

export function DepartmentCard({
    departments,
    selectedDeptId,
    onSelectDept,
    onAdd,
    onRemove,
    onLoadInstitutional,
}: DepartmentCardProps) {
    const [newDeptName, setNewDeptName] = React.useState('');

    const handleAdd = () => {
        if (newDeptName.trim()) {
            onAdd(newDeptName);
            setNewDeptName('');
        }
    };

    return (
        <Card className="shadow-sm border-muted/60">
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Departamentos</CardTitle>
                            <CardDescription className="text-xs">
                                Unidades organizativas de la institución
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoadInstitutional}
                        className="h-8 text-xs"
                    >
                        <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                        Cargar Estructura Institucional
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nuevo departamento..."
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        className="h-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button size="sm" onClick={handleAdd} className="shrink-0">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir
                    </Button>
                </div>

                <div className="rounded-xl border bg-muted/20 divide-y divide-muted/60 overflow-hidden">
                    <div className="flex items-center justify-between p-3 px-4 bg-muted/40">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Nombre
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Acción
                        </span>
                    </div>
                    <ScrollArea className="max-h-[300px] w-full" type="always">
                        <div
                            className={cn(
                                'flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors cursor-pointer',
                                selectedDeptId === 'global' && 'bg-primary/10 border-r-2 border-primary'
                            )}
                            onClick={() => onSelectDept('global')}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        selectedDeptId === 'global' ? 'bg-primary' : 'bg-slate-400'
                                    )}
                                />
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        selectedDeptId === 'global' && 'text-primary'
                                    )}
                                >
                                    Cargos Globales
                                </span>
                            </div>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">
                                Base
                            </Badge>
                        </div>
                        <div
                            className={cn(
                                'flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors cursor-pointer',
                                selectedDeptId === 'all' && 'bg-muted/50 border-r-2 border-muted-foreground/30'
                            )}
                            onClick={() => onSelectDept('all')}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        selectedDeptId === 'all' ? 'bg-muted-foreground' : 'bg-muted-foreground/40'
                                    )}
                                />
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        selectedDeptId === 'all' && 'text-foreground font-bold'
                                    )}
                                >
                                    Todos los departamentos
                                </span>
                            </div>
                        </div>
                        {departments.map((dept) => (
                            <div
                                key={dept.id}
                                className={cn(
                                    'flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors group cursor-pointer',
                                    selectedDeptId === dept.id && 'bg-primary/10 border-r-2 border-primary'
                                )}
                                onClick={() => onSelectDept(dept.id)}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className={cn(
                                            'h-2 w-2 rounded-full',
                                            selectedDeptId === dept.id ? 'bg-primary' : 'bg-primary/40'
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'text-sm font-medium truncate',
                                            selectedDeptId === dept.id && 'text-primary'
                                        )}
                                    >
                                        {dept.name}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(dept.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {departments.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground font-medium italic">
                                No hay departamentos personalizados.
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
