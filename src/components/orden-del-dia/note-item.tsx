import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Note {
  id: string;
  content: string;
}

interface NoteItemProps {
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ 
  note, 
  onUpdate, 
  onRemove 
}) => {
  return (
    <div className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
      <Textarea
        className="flex-1 min-h-[40px] text-xs font-mono py-2 px-3 bg-muted/20 border-muted/30 focus-visible:ring-primary/20 resize-none scrollbar-none rounded-md"
        placeholder="Contenido de la nota..."
        value={note.content}
        rows={1}
        onChange={(e) => {
          onUpdate(note.id, e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onFocus={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onRemove(note.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
