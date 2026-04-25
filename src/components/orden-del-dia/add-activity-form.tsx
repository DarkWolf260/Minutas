import React, { useState } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { format } from 'date-fns';
import type { ManualNovedad } from '@/lib/types';

interface AddActivityFormProps {
  onAdd: (activity: Omit<ManualNovedad, 'id'>) => void;
  editingActivity: ManualNovedad | null;
  onSaveEdit: (activity: ManualNovedad) => void;
  onCancelEdit: () => void;
}

export const AddActivityForm: React.FC<AddActivityFormProps> = ({
  onAdd,
  editingActivity,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(new Date());

  // Update local state when editingActivity changes
  React.useEffect(() => {
    if (editingActivity) {
      setText(editingActivity.text);
      setTime(editingActivity.time);
      setDate(new Date(editingActivity.date));
    } else {
      setText('');
      // Keep previous time/date as defaults for convenience when adding multiple
    }
  }, [editingActivity]);

  const handleSubmit = () => {
    if (!text || !time) return;

    if (editingActivity) {
      onSaveEdit({
        ...editingActivity,
        text,
        time,
        date: date.toISOString(),
      });
    } else {
      onAdd({
        text,
        time,
        date: date.toISOString(),
      });
      setText(''); // Only clear text to allow adding next one with same date/time
    }
  };

  return (
    <div className="p-4 border-b bg-muted/10">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4 space-y-1">
          <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Fecha</Label>
          <DatePicker 
            value={format(date, 'yyyy-MM-dd')} 
            onChange={(val) => setDate(new Date(val + 'T00:00:00'))} 
          />
        </div>
        <div className="sm:col-span-3 space-y-1">
          <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Hora</Label>
          <TimeHlvInput value={time} onChange={setTime} className="h-9 text-xs" />
        </div>
        <div className="sm:col-span-5 flex gap-2 items-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!text || !time} 
            className="w-full sm:w-auto h-9 px-6 rounded-xl font-bold gap-2 text-xs"
          >
            {editingActivity ? <Save className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
            {editingActivity ? 'Guardar' : 'Añadir'}
          </Button>
          {editingActivity && (
            <Button 
              variant="outline" 
              onClick={onCancelEdit} 
              className="h-9 px-4 rounded-xl font-bold gap-2 text-xs"
            >
              <X className="h-3.5 w-3.5" />Cancelar
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Textarea 
          placeholder="Descripción de la actividad..." 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          autoSize={false}
          className="h-28 rounded-xl text-sm" 
        />
      </div>
    </div>
  );
};
