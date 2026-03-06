'use client';

import { useState, useMemo, useEffect } from 'react';
import type { AttendanceStatus } from '@/types';
import { usePersonnel } from '@/hooks/use-personnel';
import { useAttendance } from '@/hooks/use-attendance';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Calendar as CalendarIcon,
  Download,
  Search,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

const ATTENDANCE_STATUS_CONFIG = {
  presente: {
    label: 'Presente',
    icon: CheckCircle2,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  tarde: {
    label: 'Tarde',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  permiso: {
    label: 'Permiso',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  ausente: {
    label: 'Ausente',
    icon: XCircle,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
};

export default function AttendancePage() {
  const { personnel } = usePersonnel();
  const { markAttendance, getRecordsByDate } = useAttendance();
  const { guards } = useGuards();
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGuardId, setFilterGuardId] = useState<string>('todos');

  // Set default filter to active guard when loaded
  useEffect(() => {
    if (settings.activeGuardId) {
      setFilterGuardId(settings.activeGuardId);
    }
  }, [settings.activeGuardId]);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const dailyRecords = useMemo(
    () => getRecordsByDate(formattedDate),
    [getRecordsByDate, formattedDate]
  );

  const stats = useMemo(() => {
    const total = personnel.length || 1;
    const present = dailyRecords.filter((r) => r.status === 'presente').length;
    const late = dailyRecords.filter((r) => r.status === 'tarde').length;
    const permit = dailyRecords.filter((r) => r.status === 'permiso').length;
    const absent = dailyRecords.filter((r) => r.status === 'ausente').length;

    return [
      {
        label: 'Presentes',
        value: present,
        percentage: Math.round((present / total) * 100),
        color: 'text-emerald-600',
        sub: `${Math.round((present / total) * 100)}% del personal`,
      },
      {
        label: 'Tardanzas',
        value: late,
        percentage: Math.round((late / total) * 100),
        color: 'text-amber-600',
        sub: `${((late / total) * 100).toFixed(1)}% del personal`,
      },
      { label: 'Permisos', value: permit, sub: 'Justificados', color: 'text-blue-600' },
      {
        label: 'Ausentes',
        value: absent,
        percentage: Math.round((absent / total) * 100),
        color: 'text-rose-600',
        sub: `${((absent / total) * 100).toFixed(1)}% del personal`,
      },
    ];
  }, [personnel, dailyRecords]);

  const filteredPersonnel = useMemo(() => {
    let currentList = personnel;

    // Filter by Guard
    if (filterGuardId !== 'todos') {
      const activeGuard = guards.find((g) => g.id === filterGuardId);
      if (activeGuard) {
        // Get all personnel IDs in this guard
        const guardMemberIds = new Set<string>();
        const guardMemberNames = new Set<string>();

        Object.values(activeGuard.staff)
          .flat()
          .forEach((member) => {
            if (member.personnelId) guardMemberIds.add(member.personnelId);
            // Also track names for fallback matching (legacy/manual entries)
            if (member.name) guardMemberNames.add(member.name.toLowerCase().trim());
          });

        currentList = currentList.filter(
          (p) => guardMemberIds.has(p.id) || guardMemberNames.has(p.name.toLowerCase().trim())
        );
      }
    }

    return currentList.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.cedula?.includes(searchQuery)
    );
  }, [personnel, searchQuery, filterGuardId, guards]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    const time =
      status === 'presente' || status === 'tarde' ? format(new Date(), 'HH:mm') : undefined;
    markAttendance(memberId, formattedDate, status, time);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de Asistencia</h1>
          <p className="text-muted-foreground mt-1">
            Registro diario del personal y estadísticas de cumplimiento.
          </p>
        </div>
        <Button className="font-bold gap-2">
          <CalendarCheck className="h-4 w-4" /> REGISTRAR ASISTENCIA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm group hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={cn('text-5xl font-bold tracking-tighter', stat.color)}>
                  {stat.value}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tight">
                {stat.sub}
              </p>
              <div className="mt-4 h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-out',
                    stat.color.replace('text-', 'bg-')
                  )}
                  style={{ width: `${stat.percentage || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100/50">
            <div>
              <CardTitle className="text-xl font-extrabold tracking-tight">
                Asistencia de Hoy
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground capitalize mt-1">
                {displayDate}
              </p>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                className="pl-10 h-10 bg-white/50 border-slate-200/60 focus:bg-white transition-all rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <Select value={filterGuardId} onValueChange={setFilterGuardId}>
                <SelectTrigger className="h-10 bg-white/50 border-slate-200/60 rounded-xl">
                  <SelectValue placeholder="Filtrar por guardia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo el Personal</SelectItem>
                  {guards.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      Guardia "{g.id}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100/50">
              {filteredPersonnel.map((member) => {
                const record = dailyRecords.find((r) => r.memberId === member.id);
                const status = record?.status;
                const Config = status ? ATTENDANCE_STATUS_CONFIG[status] : null;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          'h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500',
                          status
                            ? 'bg-white border-primary/20 shadow-sm'
                            : 'bg-muted/30 border-transparent'
                        )}
                      >
                        {Config ? (
                          <Config.icon className={cn('h-6 w-6', Config.color.split(' ')[1])} />
                        ) : (
                          <UserCircle className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-base text-slate-900 leading-none">
                          {member.name}
                        </p>
                        <p className="text-xs font-mono font-medium text-muted-foreground mt-1.5 flex items-center gap-2">
                          {member.cedula || 'V-00000000'}
                          {/* Show Guard Badge if they belong to one */}
                          {guards.map((g) => {
                            const isInGuard = Object.values(g.staff)
                              .flat()
                              .some(
                                (m) =>
                                  m.personnelId === member.id ||
                                  m.name.toLowerCase().trim() === member.name.toLowerCase().trim()
                              );
                            if (!isInGuard) return null;
                            return (
                              <span
                                key={g.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                G-{g.id}
                              </span>
                            );
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-widest">
                          Entrada
                        </p>
                        <p className="text-sm font-mono font-bold text-slate-700">
                          {record?.checkInTime || '--:--'}
                        </p>
                      </div>
                      <div className="flex gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200/30">
                        {(['presente', 'tarde', 'permiso', 'ausente'] as const).map((s) => {
                          const sColor = ATTENDANCE_STATUS_CONFIG[s].color;
                          const isActive = status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(member.id, s)}
                              className={cn(
                                'px-3.5 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all',
                                isActive
                                  ? cn(sColor, 'shadow-sm scale-105 border border-current/20')
                                  : 'text-muted-foreground/60 hover:text-slate-900 border border-transparent'
                              )}
                            >
                              {ATTENDANCE_STATUS_CONFIG[s].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Calendario
              </CardTitle>
              <p className="text-xs font-medium text-muted-foreground">
                Filtra el historial por fecha
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-xl border border-slate-100/50 bg-white"
                locale={es}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-sm font-extrabold bg-white hover:bg-slate-50 border-slate-200/60 shadow-sm transition-all"
              >
                <FileText className="h-4 w-4 text-blue-500" /> Ver Reporte Mensual
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-sm font-extrabold bg-white hover:bg-slate-50 border-slate-200/60 shadow-sm transition-all"
              >
                <Download className="h-4 w-4 text-emerald-500" /> Exportar Asistencia
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for missing icon
function CalendarCheck({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}
