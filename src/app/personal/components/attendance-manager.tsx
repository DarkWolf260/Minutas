'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { StaffMember, AttendanceStatus } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ATTENDANCE_STATUS_CONFIG } from '@/constants/attendance';
import { cn } from '@/lib/utils';

interface AttendanceManagerProps {
  personnel: StaffMember[];
  date: Date;
  onDateChange: (date: Date) => void;
  attendanceRecords: Array<{
    id: string;
    memberId: string;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    note?: string;
  }>;
  onMarkAttendance: (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    checkInTime?: string,
    note?: string
  ) => void;
}

/**
 * Attendance tracking component
 *
 * Allows marking daily attendance for all personnel with status tracking.
 */
export function AttendanceManager({
  personnel,
  date,
  onDateChange,
  attendanceRecords,
  onMarkAttendance,
}: AttendanceManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date);

  // Get attendance for selected date
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.date === dateString);
  }, [attendanceRecords, dateString]);

  // Get record for a specific member
  const getRecordForMember = (memberId: string) => {
    return todayRecords.find((r) => r.memberId === memberId);
  };

  // Handle attendance marking
  const handleMark = async (memberId: string, status: AttendanceStatus) => {
    const now = new Date();
    const timeString = format(now, 'HH:mm');
    await onMarkAttendance(memberId, dateString, status, timeString);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = personnel.length;
    const presente = todayRecords.filter((r) => r.status === 'presente').length;
    const tarde = todayRecords.filter((r) => r.status === 'tarde').length;
    const ausente = todayRecords.filter((r) => r.status === 'ausente').length;
    const permiso = todayRecords.filter((r) => r.status === 'permiso').length;

    return { total, presente, tarde, ausente, permiso };
  }, [personnel, todayRecords]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate);
      onDateChange(newDate);
    }
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* Calendar Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccionar Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={es}
            className="rounded-md border"
          />

          {/* Stats Summary */}
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">Resumen del Día</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>Presente: {stats.presente}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <span>Tarde: {stats.tarde}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span>Ausente: {stats.ausente}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3 text-blue-600" />
                <span>Permiso: {stats.permiso}</span>
              </div>
            </div>
            <div className="pt-2 border-t text-sm font-medium">Total: {stats.total}</div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Asistencia - {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {personnel.map((member) => {
              const record = getRecordForMember(member.id);
              const currentStatus = record?.status;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.rank} • {member.cedula || 'Sin cédula'}
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-1">
                    {(Object.keys(ATTENDANCE_STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                      const config = ATTENDANCE_STATUS_CONFIG[status];
                      const isSelected = currentStatus === status;

                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn('h-8 px-3 text-xs', isSelected && config.color)}
                          onClick={() => handleMark(member.id, status)}
                        >
                          {config.icon && <config.icon className="h-3 w-3 mr-1" />}
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Check-in Time */}
                  {record?.checkInTime && (
                    <div className="ml-3 text-xs text-muted-foreground font-mono">
                      {record.checkInTime}
                    </div>
                  )}
                </div>
              );
            })}

            {personnel.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay personal registrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
