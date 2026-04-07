
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Department, StaffRole } from '@/lib/types';

interface SortableRoleItemProps {
    role: StaffRole;
    index: number;
    departments: Department[];
    onRemoveFromList: () => void;
}

export function SortableRoleItem({
    role,
    index,
    departments,
    onRemoveFromList,
}: SortableRoleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: role.name });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.3 : 1,
    };

    const scopeName =
        (role.departmentScope ?? []).length > 0
            ? departments.find((d) => d.id === (role.departmentScope ?? [])[0])?.name ||
            'Varios'
            : 'Global';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center justify-between p-3 px-6 hover:bg-primary/5 transition-colors group',
                isDragging && 'bg-primary/10'
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground hover:text-primary shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 pl-0"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-[10px] font-bold text-primary font-mono shrink-0">
                        {index + 1}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={role.name}>
                            {role.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">
                            {scopeName}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={onRemoveFromList}
                    title="Quitar de la organización"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
