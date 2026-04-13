'use client';

import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Clock, GripVertical, PlusCircle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import type { Staff, StaffMember, StaffRole, ManualNovedad } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { format } from 'date-fns';
import { StaffListEditor } from '../guard-staff-editor';
import { DatePicker } from '../date-picker';
import { TimeHlvInput } from '../time-hlv-input';
import { formatStaffMember } from '@/lib/formatters';

// Sub-components
import { ActivityItem } from './activity-item';
import { NoteItem } from './note-item';
import { ResultDialog } from './result-dialog';

interface Note {
  id: string;
  content: string;
}

interface OrdenDelDiaFormProps {
  selectedGuard: string;
  periodo: string;
  initialData?: Staff;
}

export interface OrdenDelDiaFormRef {
  generateOrder: () => void;
}

export const OrdenDelDiaForm = forwardRef<OrdenDelDiaFormRef, OrdenDelDiaFormProps>(
  ({ selectedGuard, periodo, initialData }, ref) => {
    const { personnel } = usePersonnel();
    const { roles } = useRoles();
    const { settings, saveSettings } = useSettings();
    const isMobile = useIsMobile();

    const [staff, setStaff] = useState<Staff>({});
    const [isJefeEncargado, setIsJefeEncargado] = useState(false);
    const [activities, setActivities] = useState<ManualNovedad[]>([]);
    const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);

    // States for new activity controls
    const [newActivityText, setNewActivityText] = useState('');
    const [newActivityTime, setNewActivityTime] = useState('');
    const [newActivityDate, setNewActivityDate] = useState(new Date());
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [generatedOrder, setGeneratedOrder] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    const [isInitialized, setIsInitialized] = useState(false);
    const lastInitializedGuard = useRef<string | null>(null);
    const lastSavedDraftTime = useRef<string | null>(null);

    // DND Sensors
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const [activeId, setActiveId] = useState<string | null>(null);

    const activeMember = useMemo(() => {
      if (!activeId) return null;
      return personnel.find((p: StaffMember) => p.id === activeId);
    }, [activeId, personnel]);

    // Initialization and Draft Loading
    useEffect(() => {
      if (!selectedGuard) return;

      const isNewGuard = lastInitializedGuard.current !== selectedGuard;
      const staffIsEmpty = Object.keys(staff).length === 0;

      // Always try to load the draft if we are on a new guard OR the current state is empty
      if (isNewGuard || staffIsEmpty) {
        if (settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === selectedGuard) {
          const draft = settings.ordenDelDiaDraft;
          setStaff(draft.staff || {});
          
          // Migration logic
          const activitiesDraft = draft.activities || [];
          const migratedActivities = activitiesDraft.map((a: any) => {
            if (a.text !== undefined) return a;
            const timeMatch = a.content ? a.content.match(/(\d{2}:\d{2})/) : null;
            const time = (timeMatch ? timeMatch[1] : '08:00') + ' HLV';
            const text = a.content ? a.content.replace(/^\*?(\d{2}:\d{2})(?:\s+HLV)?\*?\s*/, '').trim() : '';
            return { id: a.id, date: parseDatesFromPeriodo(periodo).start, time, text } as ManualNovedad;
          });

          setActivities(migratedActivities);
          setNotes(draft.notes || DEFAULT_NOTES);
          setIsJefeEncargado(!!draft.isJefeEncargado);
          lastInitializedGuard.current = selectedGuard;
          setIsInitialized(true);
          return;
        }
      }

      // If we are on a new guard and no draft was found/loaded, use initial data
      if (isNewGuard) {
        const newStaffState: Staff = {};
        roles.forEach((role: StaffRole) => {
          let assignedMembers = (initialData && initialData[role.name]) || [];
          assignedMembers = assignedMembers.map((member: StaffMember) => {
            const latestData = personnel.find((p: StaffMember) => p.id === member.id);
            return latestData || member;
          });
          newStaffState[role.name] = assignedMembers;
        });

        setStaff(newStaffState);
        setIsJefeEncargado(false);
        const { start, end } = parseDatesFromPeriodo(periodo);
        const estado = findInsensitive(settings as any, 'Estado');
        setActivities(getGeneratedDefaultActivities(start, end, estado));
        setNotes(DEFAULT_NOTES);
        lastInitializedGuard.current = selectedGuard;
        setIsInitialized(true);
      }
    }, [selectedGuard, settings.ordenDelDiaDraft, roles, initialData, personnel, periodo]);

    // Reset initialization when guard changes
    useEffect(() => {
      if (selectedGuard !== lastInitializedGuard.current) {
        setIsInitialized(false);
      }
    }, [selectedGuard]);

    // Auto-save debounced effect
    useEffect(() => {
      if (!selectedGuard || !isInitialized) return;

      const timer = setTimeout(() => {
        const nowIso = new Date().toISOString();
        lastSavedDraftTime.current = nowIso;
        saveSettings({
          ordenDelDiaDraft: {
            guardId: selectedGuard,
            staff,
            isJefeEncargado,
            activities,
            notes,
            updatedAt: nowIso,
          },
        });
      }, 1000);

      return () => clearTimeout(timer);
    }, [staff, isJefeEncargado, activities, notes, selectedGuard, saveSettings, isInitialized]);

    // Handlers
    const handleRoleStaffUpdate = (roleName: string, members: StaffMember[]) => {
      setStaff((prev) => ({
        ...prev,
        [roleName]: members,
      }));
    };

    const handleAddActivity = () => {
      if (!newActivityText || !newActivityTime) return;

      if (editingActivityId) {
        setActivities((prev) =>
          prev.map((act) =>
            act.id === editingActivityId
              ? {
                  ...act,
                  date: format(newActivityDate, 'yyyy-MM-dd'),
                  time: newActivityTime,
                  text: newActivityText,
                }
              : act
          )
        );
        setEditingActivityId(null);
        toast.success('Actividad actualizada');
      } else {
        const newActivity: ManualNovedad = {
          id: generateId(),
          date: format(newActivityDate, 'yyyy-MM-dd'),
          time: newActivityTime,
          text: newActivityText,
        };
        setActivities((prev) => [...prev, newActivity]);
        toast.success('Actividad añadida');
      }

      setNewActivityText('');
      setNewActivityTime('');
      setNewActivityDate(new Date());
    };

    const handleEditActivity = (activity: ManualNovedad) => {
      setEditingActivityId(activity.id);
      setNewActivityText(activity.text);
      setNewActivityTime(activity.time);
      setNewActivityDate(new Date(activity.date + 'T00:00:00'));
    };

    const handleCancelEditActivity = () => {
      setEditingActivityId(null);
      setNewActivityText('');
      setNewActivityTime('');
      setNewActivityDate(new Date());
    };

    const handleRemoveActivity = (id: string) => {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      if (editingActivityId === id) handleCancelEditActivity();
    };

    const handleRestoreActivities = () => {
      const { start, end } = parseDatesFromPeriodo(periodo);
      const estado = findInsensitive(settings as any, 'Estado');
      setActivities(getGeneratedDefaultActivities(start, end, estado));
      toast.success('Actividades restauradas con las fechas del periodo');
    };

    const handleAddNote = () => {
      const newNote: Note = { id: generateId(), content: '' };
      setNotes((prev) => [...prev, newNote]);
    };

    const handleUpdateNote = (id: string, content: string) => {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
    };

    const handleRemoveNote = (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    };

    const handleRestoreNotes = () => {
      setNotes(DEFAULT_NOTES);
      toast.success('Notas restauradas por defecto');
    };

    const sortedActivities = useMemo(() => {
      return [...activities].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    }, [activities]);

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      let activeContainer: string | null = null;
      for (const [roleName, members] of Object.entries(staff)) {
        if (members.some((m) => m.id === activeId)) {
          activeContainer = roleName;
          break;
        }
      }

      let overContainer: string | null = null;
      if (staff[overId]) {
        overContainer = overId;
      } else {
        for (const [roleName, members] of Object.entries(staff)) {
          if (members.some((m) => m.id === overId)) {
            overContainer = roleName;
            break;
          }
        }
      }

      if (!activeContainer || !overContainer) return;

      if (activeContainer === overContainer) {
        const containerMembers = staff[activeContainer];
        if (!containerMembers) return;

        const oldIndex = containerMembers.findIndex((m) => m.id === activeId);
        const newIndex = containerMembers.findIndex((m) => m.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          handleRoleStaffUpdate(activeContainer, arrayMove(containerMembers, oldIndex, newIndex));
        }
      } else {
        const sourceMembers = staff[activeContainer];
        if (!sourceMembers) return;
        const activeIndex = sourceMembers.findIndex((m) => m.id === activeId);
        const activeItem = sourceMembers[activeIndex];
        if (!activeItem) return;

        const destMembers = staff[overContainer] || [];
        const overIndex = destMembers.findIndex((m) => m.id === overId);
        const targetRole = roles.find((r: StaffRole) => r.name === overContainer);

        setStaff((prev) => {
          const newStaff = { ...prev };
          newStaff[activeContainer!] = (prev[activeContainer!] || []).filter((m) => m.id !== activeId);

          if (targetRole?.isSingle) {
            newStaff[overContainer!] = [activeItem];
          } else {
            const updatedDestMembers = [...(prev[overContainer!] || [])];
            if (overIndex === -1) {
              updatedDestMembers.push(activeItem);
            } else {
              updatedDestMembers.splice(overIndex, 0, activeItem);
            }
            newStaff[overContainer!] = updatedDestMembers;
          }
          return newStaff;
        });
      }
    };

    const handleGenerateOrder = () => {
      const jefeDeOperaciones = (() => {
        const key = Object.keys(staff).find((k) => k.toLowerCase() === 'jefe de operaciones');
        if (key) {
          const list = staff[key];
          if (list && list.length > 0) {
            const first = list[0];
            if (first) return formatStaffMember(first).trim();
          }
        }
        return '';
      })();

      const director = (() => {
        const key = Object.keys(staff).find((k) => k.toLowerCase() === 'director');
        if (key) {
          const list = staff[key];
          if (list && list.length > 0) {
            const first = list[0];
            if (first) return formatStaffMember(first).trim();
          }
        }
        return '';
      })();

      const municipio = findInsensitive(settings as any, 'Municipio');
      const estado = findInsensitive(settings as any, 'Estado');

      const reportParts = [
        `*ORDEN DEL DÍA DEL INSTITUTO AUTONOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES DEL MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
        ``,
      ];

      if (director) reportParts.push(`*DIRECTOR*`, director, ``);
      if (jefeDeOperaciones) reportParts.push(`*JEFE DE OPERACIONES*`, jefeDeOperaciones, ``);

      reportParts.push(
        `*GRUPO DE GUARDIA:* “${selectedGuard}”`,
        ``,
        `*PERIODO:* ${periodo}`
      );

      Object.entries(staff).forEach(([role, personnelList]) => {
        if (role.toLowerCase() === 'director' || role.toLowerCase() === 'jefe de operaciones') return;

        if (personnelList && personnelList.length > 0 && personnelList.some((p: StaffMember) => p.name.trim() !== '')) {
          const isJefeServicios = role.toLowerCase() === 'jefe de los servicios';
          const displayRole = isJefeServicios && isJefeEncargado ? `${role.toUpperCase()} (E)` : role.toUpperCase();
          reportParts.push(``, `*${displayRole}*`, personnelList.map(m => formatStaffMember(m, false, true)).join('\n'));
        }
      });

      const order = reportParts.join('\n').trim();
      const secondaryParts: string[] = [];

      if (sortedActivities.length > 0) {
        secondaryParts.push(``, `*ACTIVIDADES DEL DÍA*`);
        sortedActivities.forEach(act => {
          if (act.text.trim()) secondaryParts.push(``, `- *${act.time}* ${act.text.trim()}`);
        });
      }

      if (notes.length > 0) {
        secondaryParts.push(``, `*NOTA:*`);
        notes.forEach(note => {
          if (note.content.trim()) secondaryParts.push(``, `*${note.content.trim()}*`);
        });
      }

      const footerText = municipio ? `*PROTECCIÓN CIVIL ${municipio.toUpperCase()}*` : '*PROTECCIÓN CIVIL*';
      const finalReport = [order, ...secondaryParts, '', footerText].join('\n').trim();
      setGeneratedOrder(finalReport);
      setIsResultDialogOpen(true);
      setCopyButtonText('Copiar');
    };

    useImperativeHandle(ref, () => ({
      generateOrder: handleGenerateOrder,
    }));

    const handleCopyToClipboard = () => {
      navigator.clipboard.writeText(generatedOrder);
      setCopyButtonText('¡Copiado!');
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopyButtonText('Copiar'), 2000);
    };

    return (
      <div className="md:h-full flex flex-col min-h-0">
        <div className="space-y-6 flex-1 md:flex md:flex-col min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-2 md:flex-1 min-h-0">
            {/* DISTRIBUCIÓN DE PERSONAL */}
            <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/60 min-h-[400px] h-auto">
              <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-primary" />
                  Distribución de Personal
                </CardTitle>
              </CardHeader>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <ScrollArea className="flex-1 p-4 pt-0" type="always">
                  <div className="grid grid-cols-1 gap-4">
                    {roles.filter((r: StaffRole) => !r.isHidden).map((role: StaffRole) => (
                      <div key={role.name} className="space-y-3">
                        <StaffListEditor
                          label={role.name}
                          staffMembers={staff[role.name] || []}
                          isSingle={role.isSingle}
                          onUpdate={(members) => handleRoleStaffUpdate(role.name, members)}
                          showObservations={true}
                        />
                        {role.name.toLowerCase() === 'jefe de los servicios' && (
                          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col">
                              <Label htmlFor="jefe-encargado" className="text-[11px] font-bold uppercase tracking-tight text-primary/80">Encargado (E)</Label>
                              <p className="text-[9px] text-muted-foreground font-medium">Marcado como encargado de los servicios</p>
                            </div>
                            <Switch id="jefe-encargado" checked={isJefeEncargado} onCheckedChange={setIsJefeEncargado} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DragOverlay 
                  dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}
                >
                  {activeId && activeMember ? (
                    <div className="flex items-center justify-between p-3 pl-4 bg-background border rounded-lg shadow-xl z-[500] pointer-events-none">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground/90 truncate">{activeMember.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-tighter">{activeMember.cedula || 'SIN CÉDULA'}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Card>

            {/* ACTIVIDADES DEL DÍA */}
            <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/60 min-h-[400px] h-auto">
              <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actividades del Día</CardTitle>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-primary hover:bg-primary/10" onClick={handleRestoreActivities}>Restaurar</Button>
                </div>
              </CardHeader>
              <div className="p-4 border-b bg-muted/10">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Fecha</Label>
                    <DatePicker value={format(newActivityDate, 'yyyy-MM-dd')} onChange={(val) => setNewActivityDate(new Date(val + 'T00:00:00'))} />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Hora</Label>
                    <TimeHlvInput value={newActivityTime} onChange={setNewActivityTime} className="h-9 text-xs" />
                  </div>
                  <div className="sm:col-span-5 flex gap-2 items-end">
                    <Button onClick={handleAddActivity} disabled={!newActivityText || !newActivityTime} className="w-full sm:w-auto h-9 px-6 rounded-xl font-bold gap-2 text-xs">
                      {editingActivityId ? <Save className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                      {editingActivityId ? 'Guardar' : 'Añadir'}
                    </Button>
                    {editingActivityId && <Button variant="outline" onClick={handleCancelEditActivity} className="h-9 px-4 rounded-xl font-bold gap-2 text-xs"><X className="h-3.5 w-3.5" />Cancelar</Button>}
                  </div>
                </div>
                <div className="mt-3">
                  <Textarea 
                    placeholder="Descripción de la actividad..." 
                    value={newActivityText} 
                    onChange={(e) => setNewActivityText(e.target.value)} 
                    autoSize={false}
                    className="h-28 rounded-xl text-sm" 
                  />
                </div>
              </div>
              <ScrollArea className="flex-1" type="always">
                <div className="p-4 space-y-2">
                  {sortedActivities.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <PlusCircle className="h-8 w-8 mb-2 stroke-1" />
                      <p className="text-[11px] font-medium uppercase tracking-widest text-center px-4">Sin actividades registradas</p>
                    </div>
                  ) : (
                    sortedActivities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        isEditing={editingActivityId === activity.id}
                        onEdit={handleEditActivity}
                        onRemove={handleRemoveActivity}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* NOTAS ADMINISTRATIVAS */}
            <Card className="shadow-sm flex flex-col md:flex-1 md:h-full overflow-hidden border-muted/60 min-h-[400px] h-auto">
              <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notas Adm.</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={handleRestoreNotes}>Restaurar</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={handleAddNote}>+ Añadir</Button>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="pt-4 flex-1" type="always">
                <div className="space-y-3 px-4">
                  {notes.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg bg-muted/5">No hay notas registradas.</p>
                  ) : (
                    notes.map((note) => (
                      <NoteItem key={note.id} note={note} onUpdate={handleUpdateNote} onRemove={handleRemoveNote} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>

        <ResultDialog
          isOpen={isResultDialogOpen}
          onOpenChange={setIsResultDialogOpen}
          isMobile={isMobile}
          generatedOrder={generatedOrder}
          copyButtonText={copyButtonText}
          onCopy={handleCopyToClipboard}
        />
      </div>
    );
  }
);

// Utilities and Constants
const findInsensitive = (obj: Record<string, string>, key: string): string => {
  if (!obj) return '';
  const keyLower = key.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyLower);
  return foundKey ? (obj[foundKey] ?? '') : '';
};

const DEFAULT_NOTES: Note[] = [
  { id: 'note-1', content: 'ESTA ORDEN DE OPERACIONES DEBE SER CUMPLIDA A CABALIDAD, EL INCUMPLIMIENTO DE LAS MISMAS ACARREARÁ COMO CONSECUENCIA SANCIONES ADMINISTRATIVAS.' },
  { id: 'note-2', content: 'LA ORDEN DE OPERACIONES DEBE SER REALIZADA Y DIFUNDIDA TODOS LOS DÍAS POR EL JEFE DE LOS SERVICIOS DE GUARDIA.' },
  { id: 'note-3', content: 'LA UNIDAD AMBULANCIA DEL AMBULATORIO TITO GONZÁLEZ HEREDIA EN APOYO A LAS OPERACIONES DEL INSTITUTO.' },
  { id: 'note-4', content: 'EL ASEO DE LAS UNIDADES E INSTALACIONES (OFICINAS, CUADRA, BAÑOS Y COCINA) DEBE SER REALIZADA DIARIAMENTE.' },
];

const parseDatesFromPeriodo = (periodo: string) => {
  const matches = periodo.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
  if (!matches || matches.length < 2) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { start: today.toISOString(), end: tomorrow.toISOString() };
  }
  const parse = (s: string) => {
    const [d, m, y] = s.split('/').map(Number);
    const date = new Date(y!, m! - 1, d!);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  };
  return { start: parse(matches[0]!), end: parse(matches[1]!) };
};

const getGeneratedDefaultActivities = (startDate: string, endDate: string, estadoName?: string): ManualNovedad[] => {
  const estado = estadoName || 'Anzoátegui';
  return [
    { id: 'def-1', date: startDate, time: '08:00 HLV', text: 'Se realiza cambio y recepción de Guardia' },
    { id: 'def-3', date: startDate, time: '08:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-4', date: startDate, time: '12:00 HLV - 13:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-5', date: startDate, time: '14:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-6', date: startDate, time: '16:00 HLV', text: `Se envía segundo corte de novedades diarias a la central de Protección Civil ${estado}.` },
    { id: 'def-7', date: startDate, time: '17:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-8', date: startDate, time: '18:00 HLV - 19:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-9', date: startDate, time: '20:00 HLV', text: 'Se realiza mantenimiento limpieza de las unidades e instalaciones de la sede.' },
    { id: 'def-10', date: startDate, time: '20:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-11', date: startDate, time: '21:00 HLV', text: 'Se inicia el periodo de descanso del personal.' },
    { id: 'def-12', date: endDate, time: '03:00 HLV', text: `Se envía primer corte de novedades diarias a la central de Protección Civil ${estado}.` },
    { id: 'def-13', date: endDate, time: '04:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-14', date: endDate, time: '06:00 HLV - 07:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-15', date: endDate, time: '06:00 HLV', text: 'Culmina el periodo de descanso del personal.' },
    { id: 'def-17', date: endDate, time: '08:00 HLV', text: 'Se envía reporte final de novedades correspondiente a la guardia de 24 Horas del día a la dirección estadal y ZOEDAN / Se da culminación a la guardia de 24 Horas.' },
  ];
};
