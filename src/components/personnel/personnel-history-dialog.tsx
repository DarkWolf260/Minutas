import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
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
    const isMobile = useIsMobile();

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

    const content = (
        <div className="flex flex-col h-full overflow-hidden">
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

            <ScrollArea className="flex-1 w-full" type="always">
                <div className="pb-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                            <p className="text-sm">Cargando historial...</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[120px] text-[10px] uppercase font-bold">Fecha</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold">Guardia / Depto</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold text-right">Cargo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((entry: PersonnelAssignment) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium text-[11px]">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 opacity-50" />
                                                    {entry.date ? format(parseISO(entry.date), 'dd/MM/yy', { locale: es }) : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[9px] py-0 h-4 px-1">
                                                    {entry.guardId}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[11px] text-right text-muted-foreground">{entry.roleName}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <History className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <p className="text-sm text-muted-foreground font-medium">
                                No hay registros previos
                            </p>
                            <p className="text-xs text-muted-foreground/60 max-w-[200px] mt-1">
                                Las asignaciones aparecerán aquí conforme se guarden en el sistema.
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="bottom" className="rounded-t-3xl border-t-2 border-primary/20 p-6 pb-10 flex flex-col max-h-[92vh] focus-visible:outline-none">
                    <SheetHeader className="text-left mb-4 shrink-0">
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <History className="h-5 w-5 text-primary" />
                            Historial
                        </SheetTitle>
                        <SheetDescription className="text-sm">
                            Cronología operativa para {member.name}
                        </SheetDescription>
                    </SheetHeader>
                    {content}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                {content}
            </DialogContent>
        </Dialog>
    );
}
