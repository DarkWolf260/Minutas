'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePendingActivities, PendingActivity, ActivityStatus, SubTask } from '@/hooks/use-pending-activities';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { FeatureErrorBoundary } from '@/components/common/error-boundary-feature';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  CalendarClock,
  Clock,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Sparkles,
  ClipboardList,
  Shield,
  HandHelping,
  Eye,
  EyeOff,
  Users,
  Activity,
  Check,
  Plus,
  Trash,
  X,
  ListTodo,
  AlertCircle,
  GripVertical,
  CheckSquare,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'guardia', label: 'Guardia Preventiva', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/5', icon: Shield },
  { id: 'apoyo', label: 'Apoyo Institucional', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/5', icon: HandHelping },
  { id: 'inspeccion', label: 'Inspección', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5', icon: Eye },
  { id: 'reunion', label: 'Capacitación / Reunión', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/5', icon: Users },
  { id: 'monitoreo', label: 'Monitoreo', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400 dark:bg-cyan-500/5', icon: Activity },
  { id: 'otro', label: 'Otro', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-500/5', icon: ClipboardList }
] as const;

const PRIORITIES = [
  { id: 'high', label: 'Alta', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/5', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  { id: 'medium', label: 'Media', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { id: 'low', label: 'Baja', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-500/5', dot: 'bg-slate-400', bar: 'bg-slate-400' }
] as const;

const COLUMNS: { id: ActivityStatus; label: string; ringColor: string; bg: string; border: string }[] = [
  { id: 'pending', label: 'Pendiente', ringColor: 'ring-blue-500/25', bg: 'bg-blue-500/[0.01]', border: 'border-blue-500/20 hover:border-blue-500/30' },
  { id: 'in_progress', label: 'En Proceso', ringColor: 'ring-amber-500/25', bg: 'bg-amber-500/[0.01]', border: 'border-amber-500/20 hover:border-amber-500/30' },
  { id: 'completed', label: 'Completado', ringColor: 'ring-emerald-500/25', bg: 'bg-emerald-500/[0.01]', border: 'border-emerald-500/20 hover:border-emerald-500/30' }
];

const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateReadable = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
      }).format(d);
    }
  } catch (e) { }
  return dateStr;
};

const getDateStatus = (dateStr: string, isCompleted: boolean) => {
  if (isCompleted) return null;

  const todayStr = getLocalTodayString();
  if (dateStr === todayStr) {
    return { label: 'Hoy', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Sparkles };
  }

  try {
    const [tY, tM, tD] = todayStr.split('-').map(Number);
    const [dY, dM, dD] = dateStr.split('-').map(Number);

    if (tY !== undefined && tM !== undefined && tD !== undefined && dY !== undefined && dM !== undefined && dD !== undefined) {
      const todayDate = new Date(tY, tM - 1, tD);
      const targetDate = new Date(dY, dM - 1, dD);

      const diffTime = targetDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: 'Atrasado', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse', icon: AlertCircle };
      } else if (diffDays === 1) {
        return { label: 'Mañana', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Calendar };
      }
    }
  } catch (e) { }

  return null;
};

function ActividadesPageContent() {
  const navigate = useNavigate();
  const {
    activities,
    isLoading,
    addActivity,
    updateActivityStatus,
    editActivity,
    toggleSubtask,
    clearCompletedActivities,
    deleteActivity
  } = usePendingActivities();

  const { guard_period } = useActiveGuard();

  // Page level tabs state
  const [activePageTab, setActivePageTab] = useState<'guardia' | 'todas'>('guardia');

  // Stats visibility state (persisted in localStorage)
  const [showStats, setShowStats] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minutas_tablon_show_stats');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const toggleStats = useCallback(() => {
    setShowStats(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('minutas_tablon_show_stats', JSON.stringify(newVal));
      } catch (e) { }
      return newVal;
    });
  }, []);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-asc');

  // Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Mobile View Tab
  const [mobileTab, setMobileTab] = useState<ActivityStatus>('pending');

  // Dialog State for Add/Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PendingActivity | null>(null);
  const [formDate, setFormDate] = useState(getLocalTodayString());
  const [formTime, setFormTime] = useState('');
  const [formCategory, setFormCategory] = useState<string>('guardia');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('pending');
  const [formText, setFormText] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formSubtasks, setFormSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // 8 AM to 8 AM Shift Calculation logic helpers
  const getShiftDates = useCallback((guardPeriodStr: string) => {
    let startDateStr = '';
    let endDateStr = '';

    if (guardPeriodStr) {
      const parts = guardPeriodStr.split(/ AL /i).map(p => p.trim());
      const firstPart = parts[0];
      const secondPart = parts[1];

      const match1 = firstPart?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const match2 = secondPart?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

      if (match1 && match2) {
        const [, d1, m1, y1] = match1;
        const [, d2, m2, y2] = match2;
        startDateStr = `${y1}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
        endDateStr = `${y2}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
      }
    }

    if (!startDateStr || !endDateStr) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      startDateStr = fmt(today);
      endDateStr = fmt(tomorrow);
    }

    return { startDateStr, endDateStr };
  }, []);

  const getFirstTimeHour = useCallback((timeStr: string): number => {
    const digits = timeStr.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return parseInt(digits.slice(0, 2), 10);
    }
    return 8;
  }, []);

  const isActivityInShift = useCallback((actDate: string, actTime: string, startDateStr: string, endDateStr: string): boolean => {
    const hour = getFirstTimeHour(actTime);
    if (actDate === startDateStr) {
      return hour >= 8;
    }
    if (actDate === endDateStr) {
      return hour < 8;
    }
    return false;
  }, [getFirstTimeHour]);

  const handleRegisterNovelty = (activity: PendingActivity) => {
    // Store activity data for the novedades page to auto-select template & pre-fill
    try {
      sessionStorage.setItem('minutas_activity_to_report', JSON.stringify({
        time: activity.time,
        text: activity.text,
        category: activity.category,
        date: activity.date,
      }));
    } catch (e) { /* ignore */ }
    toast.success('Abriendo novedades con la actividad...');
    navigate('/?from_activity=true');
  };

  const openAddDialog = (status: ActivityStatus = 'pending') => {
    setEditingActivity(null);
    setFormDate(getLocalTodayString());
    setFormTime('');
    setFormCategory('guardia');
    setFormStatus(status);
    setFormText('');
    setFormPriority('medium');
    setFormSubtasks([]);
    setNewSubtaskText('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (activity: PendingActivity) => {
    setEditingActivity(activity);
    setFormDate(activity.date);
    setFormTime(activity.time);
    setFormCategory(activity.category || 'guardia');
    setFormStatus(activity.status || 'pending');
    setFormText(activity.text);
    setFormPriority(activity.priority || 'medium');
    setFormSubtasks(activity.subtasks || []);
    setNewSubtaskText('');
    setIsDialogOpen(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub: SubTask = {
      id: crypto.randomUUID(),
      text: newSubtaskText.trim(),
      completed: false
    };
    setFormSubtasks([...formSubtasks, newSub]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setFormSubtasks(formSubtasks.filter(sub => sub.id !== id));
  };

  const handleSaveActivity = async () => {
    if (!formDate || !formTime.trim() || !formText.trim()) return;

    try {
      if (editingActivity) {
        await editActivity(
          editingActivity.id,
          formDate,
          formTime.trim(),
          formText.trim(),
          formCategory,
          formStatus,
          formPriority,
          formSubtasks
        );
        toast.success('Actividad actualizada');
      } else {
        await addActivity(
          formDate,
          formTime.trim(),
          formText.trim(),
          formCategory,
          formStatus,
          formPriority,
          formSubtasks
        );
        toast.success('Actividad programada');
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Error al guardar la actividad');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      try {
        await deleteActivity(id);
        toast.success('Actividad eliminada');
      } catch (err) {
        toast.error('Error al eliminar la actividad');
      }
    }
  };

  const handleClearCompleted = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar permanentemente todas las actividades completadas del tablón?')) {
      try {
        await clearCompletedActivities();
        toast.success('Actividades completadas eliminadas');
      } catch (err) {
        toast.error('Error al limpiar las actividades');
      }
    }
  };

  const handleMoveStatus = async (id: string, newStatus: ActivityStatus) => {
    try {
      await updateActivityStatus(id, newStatus);
      toast.success(`Actividad movida a "${COLUMNS.find(c => c.id === newStatus)?.label}"`);
    } catch (err) {
      toast.error('Error al mover la actividad');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ActivityStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    if (!id) return;

    const activity = activities.find(a => a.id === id);
    if (activity && activity.status !== targetStatus) {
      await handleMoveStatus(id, targetStatus);
    }
  };

  // Filtered and sorted activities (All activities matches search/filters)
  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        const categoryLabel = CATEGORIES.find(c => c.id === act.category)?.label || '';
        const matchesSearch =
          act.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Category filter
        if (selectedCategoryFilter !== 'all' && act.category !== selectedCategoryFilter) {
          return false;
        }

        // Priority filter
        if (selectedPriorityFilter !== 'all' && (act.priority || 'medium') !== selectedPriorityFilter) {
          return false;
        }

        // Date filter
        if (selectedDateFilter !== 'all') {
          const todayStr = getLocalTodayString();
          if (selectedDateFilter === 'today') {
            return act.date === todayStr;
          }
          if (selectedDateFilter === 'tomorrow') {
            try {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              const tomStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return act.date === tomStr;
            } catch (e) {
              return false;
            }
          }
          if (selectedDateFilter === 'overdue') {
            return act.date < todayStr && act.status !== 'completed';
          }
          if (selectedDateFilter === 'week') {
            try {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              const actDate = new Date(act.date + 'T00:00:00');
              const diffTime = actDate.getTime() - d.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              return diffDays >= 0 && diffDays <= 7;
            } catch (e) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-asc') {
          return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        } else if (sortBy === 'date-desc') {
          return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        } else if (sortBy === 'priority-high') {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          const wA = priorityWeight[a.priority || 'medium'];
          const wB = priorityWeight[b.priority || 'medium'];
          if (wA !== wB) return wB - wA;
          return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        }
        return 0;
      });
  }, [activities, searchQuery, selectedCategoryFilter, selectedPriorityFilter, selectedDateFilter, sortBy]);

  // Filtered shift activities (For Kanban page main view, 8 AM - 8 AM)
  const shiftFilteredActivities = useMemo(() => {
    const { startDateStr, endDateStr } = getShiftDates(guard_period);
    return filteredActivities.filter((act) =>
      isActivityInShift(act.date, act.time, startDateStr, endDateStr)
    );
  }, [filteredActivities, guard_period, getShiftDates, isActivityInShift]);

  // Group by status for Kanban columns (Using shift-filtered activities)
  const columnsData = useMemo(() => {
    const data: Record<ActivityStatus, PendingActivity[]> = {
      pending: [],
      in_progress: [],
      completed: []
    };
    shiftFilteredActivities.forEach((act) => {
      if (data[act.status]) {
        data[act.status]!.push(act);
      }
    });
    return data;
  }, [shiftFilteredActivities]);

  // Chronological grouping by day (For all activities tab)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, PendingActivity[]> = {};
    filteredActivities.forEach((act) => {
      if (!groups[act.date]) {
        groups[act.date] = [];
      }
      groups[act.date]!.push(act);
    });
    return groups;
  }, [filteredActivities]);

  // Sorted list of dates
  const sortedDates = useMemo(() => {
    const dates = Object.keys(groupedByDate);
    return dates.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.localeCompare(a);
      }
      return a.localeCompare(b);
    });
  }, [groupedByDate, sortBy]);

  // Separate statistics for Shift view and All activities view
  const shiftActivitiesRaw = useMemo(() => {
    const { startDateStr, endDateStr } = getShiftDates(guard_period);
    return activities.filter((act) =>
      isActivityInShift(act.date, act.time, startDateStr, endDateStr)
    );
  }, [activities, guard_period, getShiftDates, isActivityInShift]);

  const statsShift = useMemo(() => {
    const total = shiftActivitiesRaw.length;
    const completed = shiftActivitiesRaw.filter((a) => a.status === 'completed').length;
    const inProgress = shiftActivitiesRaw.filter((a) => a.status === 'in_progress').length;
    const pending = shiftActivitiesRaw.filter((a) => a.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const high = shiftActivitiesRaw.filter((a) => a.priority === 'high').length;
    const medium = shiftActivitiesRaw.filter((a) => a.priority === 'medium' || !a.priority).length;
    const low = shiftActivitiesRaw.filter((a) => a.priority === 'low').length;

    const todayStr = getLocalTodayString();
    const overdue = shiftActivitiesRaw.filter((a) => a.status !== 'completed' && a.date < todayStr).length;

    return { total, completed, inProgress, pending, percentage, high, medium, low, overdue };
  }, [shiftActivitiesRaw]);

  const statsAll = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter((a) => a.status === 'completed').length;
    const inProgress = activities.filter((a) => a.status === 'in_progress').length;
    const pending = activities.filter((a) => a.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const high = activities.filter((a) => a.priority === 'high').length;
    const medium = activities.filter((a) => a.priority === 'medium' || !a.priority).length;
    const low = activities.filter((a) => a.priority === 'low').length;

    const todayStr = getLocalTodayString();
    const overdue = activities.filter((a) => a.status !== 'completed' && a.date < todayStr).length;

    return { total, completed, inProgress, pending, percentage, high, medium, low, overdue };
  }, [activities]);

  // Active statistics based on the active tab
  const stats = activePageTab === 'guardia' ? statsShift : statsAll;

  const getCategoryBadge = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[5]!;
    const IconComp = cat.icon;
    return (
      <Badge variant="outline" className={cn('h-5 text-[9px] font-bold uppercase tracking-wider px-2 rounded-md shrink-0 flex items-center gap-1', cat.color)}>
        <IconComp className="h-3 w-3" />
        {cat.label}
      </Badge>
    );
  };

  const getDateBadge = (dateStr: string, isCompleted: boolean) => {
    const dateStatus = getDateStatus(dateStr, isCompleted);
    if (!dateStatus) return null;
    const DateIcon = dateStatus.icon;
    return (
      <Badge variant="outline" className={cn('h-5 text-[9px] font-bold uppercase tracking-wider px-2 rounded-md shrink-0 flex items-center gap-1', dateStatus.color)}>
        <DateIcon className="h-3 w-3" />
        {dateStatus.label}
      </Badge>
    );
  };

  const formatDayHeader = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        const todayStr = getLocalTodayString();

        let label = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }).format(d);

        label = label.charAt(0).toUpperCase() + label.slice(1);

        if (dateStr === todayStr) {
          return `${label} (Hoy)`;
        }

        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
        if (dateStr === tomStr) {
          return `${label} (Mañana)`;
        }

        return label;
      }
    } catch (e) { }
    return dateStr;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="w-24 h-1 bg-muted/50 rounded-full overflow-hidden">
          <div className="h-full bg-primary/30 animate-pulse w-full" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full md:flex-1 md:min-h-0 md:overflow-hidden relative bg-muted/10 h-full">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 sm:pb-6 flex flex-col md:flex-1 md:min-h-0 h-full gap-6">

        {/* Cabecera (Pattern de la App) */}
        <div className="flex flex-col gap-4 mb-2 shrink-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">
                Tablón de Actividades
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Organización visual y planificación de servicios preventivos, guardias y comisiones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto pl-13 md:pl-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStats}
              className="h-9 text-xs font-bold uppercase tracking-wider gap-2 rounded-xl shadow-sm border-border bg-background hover:bg-muted text-foreground"
              title={showStats ? "Ocultar panel de progreso" : "Mostrar panel de progreso"}
            >
              {showStats ? (
                <>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span>Ocultar Progreso</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>Ver Progreso</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => openAddDialog('pending')}
              className="h-9 text-xs font-bold uppercase tracking-wider gap-2 rounded-xl shadow-md bg-primary hover:bg-primary/95 text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              Programar Actividad
            </Button>
          </div>
        </div>

        {/* Tabs de Selección de Vista (Diaria vs Todas) */}
        <div className="shrink-0">
          <Tabs
            value={activePageTab}
            onValueChange={(val) => setActivePageTab(val as 'guardia' | 'todas')}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-card p-1 rounded-xl border shadow-sm">
              <TabsTrigger
                value="guardia"
                className="rounded-lg text-xs font-black uppercase tracking-wider py-2 transition-all"
              >
                Guardia Actual (8am - 8am)
              </TabsTrigger>
              <TabsTrigger
                value="todas"
                className="rounded-lg text-xs font-black uppercase tracking-wider py-2 transition-all"
              >
                Todas las Actividades
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Resumen del Tablón (Stats Cards - Reactivas según la pestaña activa) */}
        {showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[85px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progreso {activePageTab === 'guardia' ? 'Guardia' : 'Total'}</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Progress value={stats.percentage} className="h-2 rounded-full flex-1" />
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                      {stats.percentage}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {stats.completed} de {stats.total} actividades finalizadas
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[85px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Actividades por Estado</span>
                  <div className="flex items-center gap-4 mt-2 font-mono text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span>Pend: {stats.pending}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>Proc: {stats.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>List: {stats.completed}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Tareas distribuidas en el tablón
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[85px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Prioridad / Urgencia</span>
                  <div className="flex items-center gap-4 mt-2 font-mono text-xs font-bold font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-[11px]">Alta: {stats.high}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[11px]">Media: {stats.medium}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="text-[11px]">Baja: {stats.low}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Priorización de tareas
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between h-full min-h-[85px] gap-2">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Actividades Atrasadas</span>
                    <div className="text-xl font-black text-rose-500 mt-1">
                      {stats.overdue}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Requieren atención inmediata
                  </p>
                </div>
                <AlertCircle className={cn("h-8 w-8 text-rose-500/25 shrink-0", stats.overdue > 0 && "text-rose-500 animate-bounce")} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Centro de Control (Filtros y Ordenamiento) */}
        <div className="bg-card border rounded-2xl p-4 flex flex-col gap-4 shrink-0 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por descripción, fecha, hora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-background border shadow-sm placeholder:text-muted-foreground/60 text-sm"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Categorías (Tolva) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Categoría:</span>
                <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                  <SelectTrigger className="h-9 w-[150px] rounded-lg text-xs bg-background flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <cat.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{cat.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridad */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Prioridad:</span>
                <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
                  <SelectTrigger className="h-9 w-[110px] rounded-lg text-xs bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rango de Fechas */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Fecha:</span>
                <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                  <SelectTrigger className="h-9 w-[130px] rounded-lg text-xs bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="tomorrow">Mañana</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Orden:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-[160px] rounded-lg text-xs bg-background">
                    <SelectValue placeholder="Fecha (Asc)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-asc">Fecha / Hora (Asc)</SelectItem>
                    <SelectItem value="date-desc">Fecha / Hora (Desc)</SelectItem>
                    <SelectItem value="priority-high">Prioridad (Alta primero)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Limpiar Completadas */}
              {stats.completed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="h-9 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-1.5 ml-auto lg:ml-0"
                >
                  <Trash className="h-3.5 w-3.5" />
                  Limpiar Completas ({stats.completed})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content: Kanban Board vs Chronological List */}
        {activePageTab === 'guardia' ? (
          <>
            {/* Mobile Column Tabs (Only shown on mobile for Kanban view) */}
            <div className="flex md:hidden bg-muted/60 p-1 rounded-xl border shrink-0">
              {COLUMNS.map((col) => {
                const count = columnsData[col.id].length;
                const isActive = mobileTab === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => setMobileTab(col.id)}
                    className={cn(
                      'flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                      isActive ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <span>{col.label}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Board Grid (Kanban Daily Shift: 8 AM - 8 AM) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch pb-6">
              {COLUMNS.map((col) => {
                const items = columnsData[col.id];
                const isDragOver = dragOverColumn === col.id;
                const isMobileHidden = mobileTab !== col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={cn(
                      'flex flex-col min-h-[400px] md:h-full rounded-2xl border bg-card transition-all duration-300 overflow-hidden relative',
                      col.border,
                      isDragOver && cn('ring-4 scale-[1.005] bg-primary/[0.01]', col.ringColor),
                      isMobileHidden && 'hidden md:flex'
                    )}
                  >
                    {/* Column Header */}
                    <div className="p-4 border-b bg-muted/15 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', col.id === 'pending' ? 'bg-blue-500' : col.id === 'in_progress' ? 'bg-amber-500' : 'bg-emerald-500')} />
                        <h2 className="text-xs font-black uppercase tracking-wider text-foreground/80">
                          {col.label}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold font-mono px-2 h-5 bg-background">
                          {items.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                          onClick={() => openAddDialog(col.id)}
                          title={`Agregar actividad a ${col.label}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <ScrollArea className="flex-1 p-3" type="always">
                      <div className="space-y-3 pb-8">
                        {items.length === 0 ? (
                          <div className="py-16 text-center text-muted-foreground/45 flex flex-col items-center justify-center space-y-2 border border-dashed rounded-xl m-1 bg-muted/5">
                            <ArrowRightLeft className="h-6 w-6 stroke-1 animate-pulse text-muted-foreground/30" />
                            <p className="text-[10px] uppercase font-bold tracking-wider">Arrastra tareas aquí</p>
                          </div>
                        ) : (
                          items.map((act) => {
                            const priorityColor = PRIORITIES.find(p => p.id === act.priority) || PRIORITIES[1]!;
                            const subtasks = act.subtasks || [];
                            const completedSubtasks = subtasks.filter(s => s.completed).length;
                            const totalSubtasks = subtasks.length;
                            const subtasksPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                            return (
                              <div
                                key={act.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, act.id)}
                                className={cn(
                                  'group flex flex-col p-4 pl-5 bg-background border rounded-xl shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 cursor-grab active:cursor-grabbing gap-3 relative border-border overflow-hidden',
                                  act.status === 'completed' && 'opacity-75 bg-muted/10'
                                )}
                              >
                                {/* Priority visual bar indicator */}
                                <span className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl', priorityColor.bar)} />

                                {/* Card Top Row */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {getCategoryBadge(act.category)}
                                    {getDateBadge(act.date, act.status === 'completed')}
                                  </div>

                                  <div className="flex items-center gap-1 text-muted-foreground font-mono text-[9px] font-bold">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>{formatDateReadable(act.date)}</span>
                                    <span className="opacity-50">|</span>
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>{act.time}</span>
                                  </div>
                                </div>

                                {/* Card Title Description */}
                                <div className="flex items-start gap-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/45 transition-colors shrink-0 mt-0.5 -ml-1 cursor-grab" />
                                  <p className={cn(
                                    'text-sm leading-relaxed text-foreground/90 break-words font-semibold flex-1',
                                    act.status === 'completed' && 'line-through text-muted-foreground/60'
                                  )}>
                                    {act.text}
                                  </p>
                                </div>

                                {/* Subtasks Progress List */}
                                {totalSubtasks > 0 && (
                                  <div className="space-y-1.5 border-t pt-2.5 mt-0.5">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <ListTodo className="h-3 w-3" />
                                        {completedSubtasks}/{totalSubtasks} Subtareas
                                      </span>
                                      <span className="font-mono">{subtasksPct}%</span>
                                    </div>
                                    <Progress value={subtasksPct} className="h-1 rounded-full" />

                                    <div className="space-y-1 mt-2 max-h-[120px] overflow-y-auto pr-1">
                                      {subtasks.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className="flex items-start gap-2 text-xs py-1 group/sub cursor-pointer hover:bg-muted/40 px-1.5 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtask(act.id, sub.id);
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={sub.completed}
                                            onChange={() => { }}
                                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 shrink-0 cursor-pointer"
                                          />
                                          <span className={cn(
                                            "text-foreground/80 break-words flex-1 text-[11px]",
                                            sub.completed && "line-through text-muted-foreground/50"
                                          )}>
                                            {sub.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Card Footer Actions */}
                                <div className="flex items-center justify-between border-t pt-3 mt-1 gap-2 shrink-0">
                                  {/* Column Movers */}
                                  <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
                                    {col.id !== 'pending' && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md hover:bg-background text-muted-foreground"
                                        onClick={() => handleMoveStatus(act.id, col.id === 'completed' ? 'in_progress' : 'pending')}
                                        title="Mover a columna anterior"
                                      >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                      </Button>
                                    )}

                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 font-mono tracking-wider px-1.5 select-none">
                                      {col.id === 'pending' ? 'Pend' : col.id === 'in_progress' ? 'Proc' : 'Listo'}
                                    </span>

                                    {col.id !== 'completed' && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md hover:bg-background text-muted-foreground"
                                        onClick={() => handleMoveStatus(act.id, col.id === 'pending' ? 'in_progress' : 'completed')}
                                        title="Mover a siguiente columna"
                                      >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Operations utility tools */}
                                  <div className="flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(act)}
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                                      title="Editar"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(act.id)}
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRegisterNovelty(act)}
                                      className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                                      title="Crear Reporte de esta Actividad"
                                    >
                                      <CheckSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* "Todas las Actividades" View - Chronological group list (without columns) */
          <div className="flex-1 min-h-0 flex flex-col pb-6">
            <ScrollArea className="flex-1 pr-3" type="always">
              {sortedDates.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground/45 flex flex-col items-center justify-center space-y-2 border border-dashed rounded-xl bg-card">
                  <Calendar className="h-8 w-8 stroke-1 animate-pulse text-muted-foreground/30" />
                  <p className="text-sm uppercase font-bold tracking-wider">No se encontraron actividades</p>
                </div>
              ) : (
                <div className="space-y-8 pb-12">
                  {sortedDates.map((dateStr) => {
                    const itemsForDate = groupedByDate[dateStr] || [];
                    return (
                      <div key={dateStr} className="space-y-4">
                        {/* Day Section Header */}
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          {formatDayHeader(dateStr)}
                          <Badge variant="outline" className="ml-1 text-[10px] font-mono py-0 h-4 bg-background">
                            {itemsForDate.length}
                          </Badge>
                        </h3>

                        {/* Group of Cards in that day */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {itemsForDate.map((act) => {
                            const priorityColor = PRIORITIES.find(p => p.id === act.priority) || PRIORITIES[1]!;
                            const subtasks = act.subtasks || [];
                            const completedSubtasks = subtasks.filter(s => s.completed).length;
                            const totalSubtasks = subtasks.length;
                            const subtasksPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                            return (
                              <div
                                key={act.id}
                                className={cn(
                                  'group flex flex-col p-4 pl-5 bg-background border rounded-xl shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 gap-3 relative border-border overflow-hidden',
                                  act.status === 'completed' && 'opacity-75 bg-muted/10'
                                )}
                              >
                                {/* Priority visual bar */}
                                <span className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl', priorityColor.bar)} />

                                {/* Top Row */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {getCategoryBadge(act.category)}
                                    {getDateBadge(act.date, act.status === 'completed')}
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground font-mono text-[9px] font-bold">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>{act.time}</span>
                                  </div>
                                </div>

                                {/* Title/Description */}
                                <p className={cn(
                                  'text-sm leading-relaxed text-foreground/90 break-words font-semibold',
                                  act.status === 'completed' && 'line-through text-muted-foreground/60'
                                )}>
                                  {act.text}
                                </p>

                                {/* Subtasks Progress List */}
                                {totalSubtasks > 0 && (
                                  <div className="space-y-1.5 border-t pt-2.5 mt-0.5">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <ListTodo className="h-3 w-3" />
                                        {completedSubtasks}/{totalSubtasks} Subtareas
                                      </span>
                                      <span className="font-mono">{subtasksPct}%</span>
                                    </div>
                                    <Progress value={subtasksPct} className="h-1 rounded-full" />

                                    <div className="space-y-1 mt-2 max-h-[120px] overflow-y-auto pr-1">
                                      {subtasks.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className="flex items-start gap-2 text-xs py-1 group/sub cursor-pointer hover:bg-muted/40 px-1.5 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtask(act.id, sub.id);
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={sub.completed}
                                            onChange={() => { }}
                                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 shrink-0 cursor-pointer"
                                          />
                                          <span className={cn(
                                            "text-foreground/80 break-words flex-1 text-[11px]",
                                            sub.completed && "line-through text-muted-foreground/50"
                                          )}>
                                            {sub.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Footer actions & direct status dropdown editor */}
                                <div className="flex items-center justify-between border-t pt-3 mt-1 gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5">
                                    <Select
                                      value={act.status}
                                      onValueChange={(val) => handleMoveStatus(act.id, val as ActivityStatus)}
                                    >
                                      <SelectTrigger className="h-7 w-[115px] rounded-md text-[10px] bg-background border font-bold p-1 px-2">
                                        <SelectValue placeholder="Estado" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COLUMNS.map(c => (
                                          <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold">
                                            {c.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(act)}
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                                      title="Editar"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(act.id)}
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRegisterNovelty(act)}
                                      className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                                      title="Crear Reporte de esta Actividad"
                                    >
                                      <CheckSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

      </div>

      {/* Programar Actividad Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {editingActivity ? 'Editar Actividad' : 'Programar Nueva Actividad'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-3">
            {/* Fecha */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activity-date" className="text-xs font-bold uppercase text-muted-foreground">
                Fecha de la Actividad
              </Label>
              <DatePicker
                id="activity-date"
                value={formDate}
                onChange={(val) => setFormDate(val || getLocalTodayString())}
                className="h-10 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>
            {/* Hora picker */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activity-time" className="text-xs font-bold uppercase text-muted-foreground">
                Hora de Ejecución (HLV)
              </Label>
              <TimeHlvInput
                id="activity-time"
                value={formTime}
                onChange={(val) => setFormTime(val)}
                className="h-10 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 font-mono"
              />
            </div>
            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activity-category" className="text-xs font-bold uppercase text-muted-foreground">
                Categoría / Tipo de Actividad
              </Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="activity-category" className="h-10 rounded-lg bg-background">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4 text-muted-foreground" />
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Estatus */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activity-status" className="text-xs font-bold uppercase text-muted-foreground">
                  Estado Inicial
                </Label>
                <Select value={formStatus} onValueChange={(val) => setFormStatus(val as ActivityStatus)}>
                  <SelectTrigger id="activity-status" className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridad */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activity-priority" className="text-xs font-bold uppercase text-muted-foreground">
                  Prioridad / Urgencia
                </Label>
                <Select value={formPriority} onValueChange={(val) => setFormPriority(val as 'low' | 'medium' | 'high')}>
                  <SelectTrigger id="activity-priority" className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="Seleccionar prioridad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", p.dot)} />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Texto descripción */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activity-text" className="text-xs font-bold uppercase text-muted-foreground">
                Descripción de la Actividad / Tarea
              </Label>
              <Textarea
                id="activity-text"
                placeholder="Se realiza guardia de prevención en..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                className="min-h-[90px] rounded-lg resize-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>

            {/* Subtasks checklist creator */}
            <div className="flex flex-col gap-2 border-t pt-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <ListTodo className="h-3.5 w-3.5" />
                Subtareas / Pasos ({formSubtasks.length})
              </Label>

              <div className="flex gap-2">
                <Input
                  placeholder="Nueva subtarea (ej. Inspeccionar extintores)"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="h-9 text-sm rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSubtask}
                  className="h-9 px-3 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formSubtasks.length > 0 && (
                <div className="border rounded-lg p-2 max-h-[150px] overflow-y-auto space-y-1.5 bg-muted/20">
                  {formSubtasks.map((sub, index) => (
                    <div key={sub.id} className="flex items-center justify-between gap-2 bg-background p-1.5 rounded-md border text-xs">
                      <span className="font-mono text-muted-foreground/60 select-none">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className="flex-1 break-all">{sub.text}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={() => handleRemoveSubtask(sub.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button onClick={handleSaveActivity} disabled={!formDate || !formTime.trim() || !formText.trim()} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingActivity ? 'Guardar Cambios' : 'Programar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function ActividadesPage() {
  return (
    <FeatureErrorBoundary featureName="Tablón de Actividades">
      <ActividadesPageContent />
    </FeatureErrorBoundary>
  );
}
