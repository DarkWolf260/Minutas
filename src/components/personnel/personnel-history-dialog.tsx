'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, Shield, User } from 'lucide-react';
import { usePersonnelHistory } from '@/hooks/use-personnel-history';
import type { StaffMember, PersonnelAssignment } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PersonnelHistoryDialogProps {
    member: StaffMember | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PersonnelHistoryDialog({ member, isOpen, onClose }: PersonnelHistoryDialogProps) {
    const { getHistory } = usePersonnelHistory();
    const [history, setHistory] = useState<PersonnelAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (member && isOpen) {
            const fetchHistory = async () => {
                setIsLoading(true);
                const data = await getHistory(member.id);
                setHistory(data);
                setIsLoading(false);
            };
            fetchHistory();
        }
    }, [member, isOpen, getHistory]);

    if (!member) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Historial de Asignaciones
                    </DialogTitle>
                    <DialogDescription>
                        Cronología de guardias y cargos para {member.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                            {member.rank} • {member.cedula || 'Sin Cédula'}
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0 -mx-6 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 w-full" type="always">
                        <div className="px-6 pb-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                                    <p className="text-sm">Cargando historial...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[150px]">Fecha</TableHead>
                                            <TableHead>Guardia / Depto</TableHead>
                                            <TableHead>Cargo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3 w-3 opacity-50" />
                                                        {entry.date ? format(parseISO(entry.date), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-[10px] py-0 h-5">
                                                        <Shield className="h-3 w-3 mr-1 opacity-50" />
                                                        {entry.guardId}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{entry.roleName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <History className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                    <p className="text-sm text-muted-foreground font-medium">
                                        No hay registros previos
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 max-w-[200px] mt-1">
                                        Las asignaciones comenzarán a aparecer aquí conforme se guarden en el sistema.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
