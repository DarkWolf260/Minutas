import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ManualNovedad } from '@/lib/types';

interface ActivityItemProps {
  activity: ManualNovedad;
  isEditing: boolean;
  onEdit: (activity: ManualNovedad) => void;
  onRemove: (id: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = React.memo(({ 
  activity, 
  isEditing, 
  onEdit, 
  onRemove 
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-xl hover:bg-muted/5 transition-colors group gap-3">
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <div className="text-[9px] font-extrabold px-1.5 py-0.5 bg-primary/5 rounded text-primary/70 whitespace-nowrap uppercase tracking-wider">
              {format(new Date(activity.date), 'dd/MM')}
            </div>
            <div className="text-[9px] font-extrabold px-1.5 py-0.5 bg-primary/10 rounded text-primary whitespace-nowrap uppercase tracking-wider">
              {activity.time}
            </div>
          </div>
          {isEditing && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 animate-pulse bg-primary/5 text-primary border-primary/20 shrink-0">
              Editando
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">{activity.text}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => onEdit(activity)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
          onClick={() => onRemove(activity.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';
