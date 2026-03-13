'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useReports } from '@/hooks/use-reports';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { Skeleton } from '@/components/ui/skeleton';
import { findValueInFormData } from '@/lib/report-sorter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { usePersonnel } from '@/hooks/use-personnel';
import { useTemplates } from '@/hooks/use-templates';
import { useIsMobile } from '@/hooks/use-mobile';
import { renderFinalReport } from '@/lib/template-parser';
import { format } from 'date-fns';
import type { Report, StaffMember } from '@/types';
import { DatePicker } from '@/components/date-picker';
import { TimeHlvInput } from '@/components/time-hlv-input';
import { PlusCircle, Trash2, Calculator, FileText, Save, TrendingUp, Users, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LEADER_ROLES } from '@/constants/roles';
import { generateId } from '@/lib/utils/id';

interface ManualNovedad {
  id: string;
  date: Date;
  time: string;
  text: string;
}

const formatStaffMemberForReport = (member: StaffMember): string => {
  const parts: string[] = [];
  if (member.rank) parts.push(member.rank);
  if (member.titulo) parts.push(member.titulo);
  parts.push(member.name);
  return parts.filter(Boolean).join(' ').trim();
};

const findInsensitive = (obj: Record<string, string>, key: string): string => {
  const keyLower = key.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyLower);
  return foundKey ? (obj[foundKey] ?? '') : '';
};

export default function ReporteFinalPage() {
  const { reports, isLoaded: reportsLoaded } = useReports();
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const isMobile = useIsMobile();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { roles, isLoaded: rolesLoadedHook } = useRoles();
  const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
  const { personnel } = usePersonnel();
  const router = useRouter();

  const [statisticsText, setStatisticsText] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar');

  const [manualNovedades, setManualNovedades] = useState<ManualNovedad[]>([]);
  const [newNovedadDate, setNewNovedadDate] = useState(new Date());
  const [newNovedadTime, setNewNovedadTime] = useState('');
  const [newNovedadText, setNewNovedadText] = useState('');

  useEffect(() => {
    if (!settingsLoaded) return;

    const hasCustomDates = settings.finalReportStartDate && settings.finalReportEndDate;

    const startDate = hasCustomDates ? new Date(settings.finalReportStartDate!) : new Date();
    startDate.setHours(9, 0, 0, 0);

    const endDate = hasCustomDates
      ? new Date(settings.finalReportEndDate!)
      : new Date(new Date().setDate(new Date().getDate() + 1));
    endDate.setHours(9, 0, 0, 0);

    const defaultStartNovedad: ManualNovedad = {
      id: `${generateId('manual')}_start`,
      date: startDate,
      time: '09:00 HLV',
      text: 'Se inicia la guardia preventiva de 24 horas',
    };

    const defaultEndNovedad: ManualNovedad = {
      id: `${generateId('manual')}_end`,
      date: endDate,
      time: '09:00 HLV',
      text: 'Se da culminación a la guardia preventiva de 24 horas',
    };

    setManualNovedades((prev) => {
      const otherNovedades = prev.filter((n) => !n.id.includes('_start') && !n.id.includes('_end'));
      return [...otherNovedades, defaultStartNovedad, defaultEndNovedad];
    });
  }, [settings.finalReportStartDate, settings.finalReportEndDate, settingsLoaded]);

  const globalSettings = useMemo(() => {
    return Object.values(configs).reduce(
      (acc, config) => {
        Object.keys(config.fields).forEach((fieldName) => {
          const field = config.fields[fieldName];
          if (field && field.type === 'predefined' && field.value) {
            acc[fieldName] = field.value;
          }
        });
        return acc;
      },
      {} as Record<string, string>
    );
  }, [configs]);

  const activeGuard = useMemo(() => {
    if (!settings.activeGuardId || !guards.length) return null;
    return guards.find((g) => g.id === settings.activeGuardId);
  }, [settings.activeGuardId, guards]);

  const hasSnapshot = useMemo(() => {
    const staffSnapshot =
      settings.finalReportStaffSnapshot &&
      Object.keys(settings.finalReportStaffSnapshot).length > 0;
    const customDates = !!settings.finalReportStartDate && !!settings.finalReportEndDate;
    return staffSnapshot && customDates;
  }, [settings]);

  const handleClearSnapshot = () => {
    saveSettings({
      ...settings,
      finalReportStaffSnapshot: {},
      finalReportStartDate: '',
      finalReportEndDate: '',
    });
  };

  const handleAddManualNovedad = () => {
    if (!newNovedadTime || !newNovedadText) return;

    const newNovedad: ManualNovedad = {
      id: generateId('manual'),
      date: newNovedadDate,
      time: newNovedadTime,
      text: newNovedadText,
    };
    setManualNovedades((prev) => [...prev, newNovedad]);
    setNewNovedadTime('');
    setNewNovedadText('');
  };

  const handleRemoveManualNovedad = (idToRemove: string) => {
    setManualNovedades((prev) => prev.filter((n) => n.id !== idToRemove));
  };

  const getSortDate = (novedad: Report | ManualNovedad): Date | null => {
    if ('templateId' in novedad) {
      // It's a Report
      const fechaStr = findValueInFormData(novedad.formData, 'Fecha') as string | undefined;
      const horaStr = findValueInFormData(novedad.formData, 'Hora') as string | undefined;

      if (fechaStr && horaStr) {
        const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          const mappedValues = timeMatch.slice(1).map(Number);
          const hours = mappedValues[0];
          const minutes = mappedValues[1];
          if (hours !== undefined && minutes !== undefined && !isNaN(hours) && !isNaN(minutes)) {
            const sortDate = new Date(`${fechaStr}T00:00:00`);
            if (!isNaN(sortDate.getTime())) {
              sortDate.setHours(hours, minutes);
              return sortDate;
            }
          }
        }
      }
      return new Date(novedad.timestamp);
    } else {
      // It's a ManualNovedad
      const horaStr = novedad.time;
      const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
      if (!timeMatch) return novedad.date;
      const mappedValues = timeMatch.slice(1).map(Number);
      const hours = mappedValues[0];
      const minutes = mappedValues[1];
      if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes))
        return novedad.date;

      const sortDate = new Date(novedad.date);
      sortDate.setHours(hours, minutes, 0, 0);
      return sortDate;
    }
  };

  const sortedManualNovedades = useMemo(() => {
    return [...manualNovedades].sort((a, b) => {
      const dateA = getSortDate(a);
      const dateB = getSortDate(b);
      if (dateA && dateB) return dateA.getTime() - dateB.getTime();
      return 0;
    });
  }, [manualNovedades]);

  const finishedReports = useMemo(() => {
    return reports.filter((report) => report.status === 'Finalizado');
  }, [reports]);

  const handleGenerateReport = () => {
    if (finishedReports.length === 0 && !statisticsText.trim() && manualNovedades.length === 0) {
      setGeneratedReport('No hay novedades finalizadas ni estadísticas para reportar.');
      setIsResultDialogOpen(true);
      return;
    }

    const staffForReport = hasSnapshot ? settings.finalReportStaffSnapshot : activeGuard?.staff;
    const guardIdForReport = hasSnapshot
      ? settings.finalReportGuardId || ''
      : activeGuard?.id || '';

    const getLeaderName = (roleName: string) => {
      if (hasSnapshot && staffForReport) {
        const key = Object.keys(staffForReport).find(
          (k) => k.toLowerCase() === roleName.toLowerCase()
        );
        if (key) {
          const members = staffForReport[key];
          const firstMember = members ? members[0] : undefined;
          if (firstMember) {
            return formatStaffMemberForReport(firstMember).trim();
          }
        }
      }

      if (personnel) {
        const globalMatch = personnel.find(
          (p) => p.roleId?.toLowerCase() === roleName.toLowerCase()
        );
        if (globalMatch) {
          return formatStaffMemberForReport(globalMatch).trim();
        }
      }
      return '';
    };

    const director = getLeaderName(LEADER_ROLES.DIRECTOR);
    const jefeDeOperaciones = getLeaderName(LEADER_ROLES.JEFE_OPERACIONES);
    const municipio = findInsensitive(globalSettings, 'Municipio');

    const dateRangeString = (() => {
      const startDate = hasSnapshot ? new Date(settings.finalReportStartDate!) : new Date();
      const endDate = hasSnapshot
        ? new Date(settings.finalReportEndDate!)
        : new Date(new Date().setDate(new Date().getDate() + 1));

      const dayStart = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit' }).format(startDate);
      const dayEnd = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'long' }).format(endDate);
      
      return `DESDE EL ${dayStart.toUpperCase()} HASTA EL ${dayEnd.toUpperCase()} DE ${startDate.getFullYear()}`;
    })();

    const headerParts = [
      `*INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()}*`,
      ``,
      `*DIRECTOR-PRESIDENTE*`,
      director,
      ``,
      `*JEFE DE OPERACIONES*`,
      jefeDeOperaciones,
      ``,
      `*REPORTE DE NOVEDADES ${dateRangeString}*`,
      ``,
    ];

    if (staffForReport) {
      if (guardIdForReport && guardIdForReport !== '“”') {
        headerParts.push(`- *EQUIPO DE GUARDIA:* Grupo “${guardIdForReport}”`);
      }

      roles
        .filter((r) => !r.isHidden)
        .forEach((role) => {
          if (
            role.name.toLowerCase() === LEADER_ROLES.DIRECTOR.toLowerCase() ||
            role.name.toLowerCase() === LEADER_ROLES.JEFE_OPERACIONES.toLowerCase()
          )
            return;

          const staffKey = Object.keys(staffForReport).find(
            (k) => k.toLowerCase() === role.name.toLowerCase()
          );
          const staffList = staffKey
            ? staffForReport[staffKey as keyof typeof staffForReport]
            : undefined;
          
          if (staffList && staffList.length > 0 && staffList.some((s) => s.name.trim() !== '')) {
            const names = staffList
              .map((member) => formatStaffMemberForReport(member))
              .join(' / ');
            
            headerParts.push(`- *${role.name.toUpperCase()}:* ${names}`);
          }
        });
    }

    const allNovedades = [
      ...finishedReports.map((report) => ({
        type: 'report',
        data: report,
        sortDate: getSortDate(report),
      })),
      ...manualNovedades.map((novedad) => ({
        type: 'manual',
        data: novedad,
        sortDate: getSortDate(novedad),
      })),
    ];

    const sortedAllNovedades = allNovedades
      .filter((item) => item.sortDate)
      .sort((a, b) => a.sortDate!.getTime() - b.sortDate!.getTime());

    const reportContent = sortedAllNovedades
      .map((item) => {
        if (item.type === 'report') {
          const report = item.data as Report;
          const sortDate = item.sortDate!;
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(sortDate);
          
          const horaStr = findValueInFormData(report.formData, 'Hora') as string | undefined;
          const timestampText = `${formattedDate} ${horaStr || format(sortDate, 'HH:mm')} HLV`.trim();

          const template = templates.find((t) => t.id === report.templateId);
          const config = configs[report.templateId];

          let contentText = '';
          if (template && config) {
            const dynamicPredefinedValues = {
              ...globalSettings,
              Guardia: guardIdForReport,
              [LEADER_ROLES.DIRECTOR]: director,
              [LEADER_ROLES.JEFE_OPERACIONES]: jefeDeOperaciones,
            };
            contentText = renderFinalReport(
              template.content,
              report.formData || {},
              config,
              {},
              true,
              dynamicPredefinedValues
            );
          }

          const titleText = ` - *${timestampText}* - *${report.title}*`;
          return contentText ? `${titleText}\n\n${contentText}` : titleText;
        } else {
          const novedad = item.data as ManualNovedad;
          const sortDate = item.sortDate!;
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(sortDate);
          const timestampText = `${formattedDate} ${novedad.time}`;
          return ` - *${timestampText}* - *${novedad.text}*`;
        }
      })
      .filter(Boolean)
      .join('\n\n');

    const finalReportParts = [...headerParts];
    if (statisticsText.trim())
      finalReportParts.push(``, `*ESTADÍSTICAS DE LA GUARDIA*`, ``, statisticsText.trim());
    if (reportContent.trim()) finalReportParts.push(``, `*NOVEDADES DE LA GUARDIA*`, ``, reportContent);
    finalReportParts.push(``, `*PROTECCIÓN CIVIL ${(municipio || '').toUpperCase()}*`);

    setGeneratedReport(finalReportParts.join('\n').trim());
    setIsResultDialogOpen(true);
    setCopyButtonText('Copiar');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    setCopyButtonText('¡Copiado!');
    setTimeout(() => setCopyButtonText('Copiar'), 2000);
  };

  const isLoaded =
    reportsLoaded && guardsLoaded && settingsLoaded && rolesLoadedHook && templatesLoaded;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reporte de Cierre de Guardia</h1>
              <p className="text-muted-foreground mt-1">
                Genera el resumen final consolidado de todas las novedades y estadísticas de la guardia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="lg" onClick={handleGenerateReport} className="gap-2">
                Generar Reporte Final
              </Button>
            </div>
          </div>

          {!isLoaded ? (
            <div className="space-y-8">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto">
              {/* Resumen Informativo al inicio */}
              <Alert className="bg-primary/5 border-primary/20 shadow-sm">
                <FileText className="h-4 w-4 text-primary" />
                <AlertTitle className="font-semibold">Información de Generación</AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                  El reporte consolidará {finishedReports.length} novedades finalizadas, {manualNovedades.length} eventos manuales y el personal de guardia configurado.
                </AlertDescription>
              </Alert>

              {/* Aviso de Guardia Inteligente */}
              {hasSnapshot ? (
                <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm pr-12 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <AlertTitle className="font-bold">Personal Pre-guardado</AlertTitle>
                      <AlertDescription className="text-sm opacity-90">
                        {settings.finalReportGuardId 
                          ? `Usando datos de la Guardia "${settings.finalReportGuardId}" desde la Orden del Día.`
                          : "No se ha guardado la orden del día para usar en el cierre."}
                      </AlertDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-blue-500/20 hover:text-blue-700 transition-colors"
                    onClick={handleClearSnapshot}
                    title="Descartar datos guardados"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Alert>
              ) : activeGuard ? (
                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <AlertTitle className="font-bold">Datos en Tiempo Real</AlertTitle>
                      <AlertDescription className="text-sm opacity-90">
                        No hay personal guardado. Se usará la <strong>Guardia "{activeGuard.id}"</strong> actualmente seleccionada.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : (
                <Alert variant="destructive" className="shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-destructive/20 p-2 rounded-full">
                      <Users className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <AlertTitle className="font-bold">Atención: Sin Personal</AlertTitle>
                      <AlertDescription className="text-sm opacity-90">
                        No se ha guardado personal ni hay una guardia activa seleccionada. El reporte podría estar incompleto.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-8 items-start">
                {/* Sección de Estadísticas */}
                <Card className="shadow-md border-muted/60">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <TrendingUp className="h-5 w-5" />
                      <CardTitle className="text-xl">Estadísticas del Día</CardTitle>
                    </div>
                    <CardDescription>
                      Ingresa las métricas correspondientes a la guardia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Textarea
                      placeholder="Ej: - TRASLADOS URBANOS 5"
                      value={statisticsText}
                      onChange={(e) => setStatisticsText(e.target.value)}
                      className="min-h-[200px] font-mono text-sm leading-relaxed"
                    />
                  </CardContent>
                </Card>

                {/* Sección de Novedades Manuales */}
                <div className="space-y-6">
                  <Card className="shadow-md border-muted/60">
                    <CardHeader className="bg-muted/30 pb-4">
                      <div className="flex items-center gap-2 text-primary">
                        <PlusCircle className="h-5 w-5" />
                        <CardTitle className="text-xl">Novedades Manuales</CardTitle>
                      </div>
                      <CardDescription>
                        Añade eventos especiales que no estén en los reportes individuales.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-bold text-muted-foreground">Fecha</Label>
                          <DatePicker
                            value={format(newNovedadDate, 'yyyy-MM-dd')}
                            onChange={(val) => setNewNovedadDate(new Date(val + 'T00:00:00'))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-bold text-muted-foreground">Hora</Label>
                          <TimeHlvInput value={newNovedadTime} onChange={setNewNovedadTime} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Descripción del Evento</Label>
                        <Textarea
                          placeholder="Escribe aquí la novedad..."
                          value={newNovedadText}
                          onChange={(e) => setNewNovedadText(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddManualNovedad} className="w-full gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Añadir a la Cronología
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Cronología de Novedades Manuales */}
                  <Card className="shadow-md border-muted/60">
                    <CardHeader className="py-4 border-b">
                      <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Cronología de Novedades Manuales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[250px]">
                        {manualNovedades.length === 0 ? (
                          <p className="p-8 text-center text-sm text-muted-foreground italic">
                            No hay novedades manuales añadidas
                          </p>
                        ) : (
                          <div className="divide-y">
                            {sortedManualNovedades.map((n) => (
                              <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors group">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                      {format(n.date, 'dd/MM')} {n.time}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-tight text-foreground/80">{n.text}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                  onClick={() => handleRemoveManualNovedad(n.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultado - Responsive */}
      {isMobile ? (
        <Sheet open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Reporte de Cierre Generado</SheetTitle>
              <SheetDescription>
                Revisa el reporte consolidado. Puedes copiar el texto para usarlo donde necesites.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto mt-4 px-1">
              <Textarea
                readOnly
                value={generatedReport}
                className="w-full h-full min-h-[65vh] bg-muted/50 font-mono text-xs whitespace-pre-wrap rounded-lg p-3"
              />
            </div>
            <SheetFooter className="mt-4 flex flex-col gap-2">
              <Button className="w-full h-12" type="button" onClick={handleCopyToClipboard}>
                {copyButtonText === 'Copiar' ? (
                  <Save className="mr-2 h-4 w-4" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="secondary" className="w-full h-11">
                  Cerrar
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-4xl flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">Reporte de Cierre Generado</DialogTitle>
                  <DialogDescription className="text-primary-foreground/80">
                    Revisa y copia el reporte consolidado de la guardia.
                  </DialogDescription>
                </div>
                <FileText className="h-10 w-10 opacity-20 text-white" />
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden p-6 bg-muted/30">
              <Textarea
                readOnly
                value={generatedReport}
                className="w-full h-full min-h-[50vh] bg-background font-mono text-xs whitespace-pre-wrap rounded-xl border-muted p-6 shadow-inner focus-visible:ring-primary/20"
              />
            </div>

            <DialogFooter className="p-4 bg-background border-t gap-2 sm:gap-0">
              <div className="flex-1" />
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cerrar
                </Button>
              </DialogClose>
              <Button size="lg" onClick={handleCopyToClipboard} className="ml-2 min-w-[140px] gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                {copyButtonText === 'Copiar' ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                {copyButtonText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
