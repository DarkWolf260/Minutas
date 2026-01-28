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
import { useReports } from '@/hooks/use-reports';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { Skeleton } from '@/components/ui/skeleton';
import { findValueInFormData } from '@/lib/report-sorter';
import { getReportCategory } from '@/lib/statistics-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { usePersonnel } from '@/hooks/use-personnel';
import { useTemplates } from '@/hooks/use-templates';
import { renderFinalReport } from '@/lib/template-parser';
import { format } from 'date-fns';
import type { Report, StaffMember } from '@/types';
import { DatePicker } from '@/components/date-picker';
import { TimeHlvInput } from '@/components/time-hlv-input';
import { PlusCircle, Trash2, Calculator, FileText, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DEFAULT_STATISTICS_CATEGORIES } from '@/constants/statistics';
import { LEADER_ROLES } from '@/constants/roles';
import { PERSONNEL_STATUS } from '@/constants/personnel';
import { ATTENDANCE_STATUS } from '@/constants/attendance';

interface ManualNovedad {
  id: string;
  date: Date;
  time: string;
  text: string;
}

const formatStaffMemberForReport = (member: StaffMember, showCedula: boolean): string => {
  const rank = member.rank ? `${member.rank} ` : '';
  if (showCedula && member.cedula) {
    return `${rank}${member.name} ${member.cedula}`;
  }
  return `${rank}${member.name}`;
};

const findInsensitive = (obj: Record<string, string>, key: string): string => {
  const keyLower = key.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyLower);
  return foundKey ? (obj[foundKey] ?? '') : '';
};

export default function ReporteFinalPage() {
  const { reports, isLoaded: reportsLoaded, getLatestReports, clearAllReports } = useReports();
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { roles, isLoaded: rolesLoadedHook } = useRoles();
  const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
  const { personnel } = usePersonnel();
  const { saveGuardReport } = useGuardHistory();
  const router = useRouter();

  const [statisticsText, setStatisticsText] = useState(
    DEFAULT_STATISTICS_CATEGORIES.map((c) => `- ${c} 0`).join('\n')
  );
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
      id: `manual_${Date.now()}_start`,
      date: startDate,
      time: '09:00 HLV',
      text: 'Se inicia la guardia preventiva de 24 horas',
    };

    const defaultEndNovedad: ManualNovedad = {
      id: `manual_${Date.now()}_end`,
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
      id: `manual_${Date.now()}`,
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

      if (!fechaStr || !horaStr) return null;

      const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
      if (!timeMatch) return null;

      const mappedValues = timeMatch.slice(1).map(Number);
      const hours = mappedValues[0];
      const minutes = mappedValues[1];
      if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes))
        return null;

      const sortDate = new Date(`${fechaStr}T00:00:00`);
      if (isNaN(sortDate.getTime())) return null;

      sortDate.setHours(hours, minutes);
      return sortDate;
    } else {
      // It's a ManualNovedad
      const horaStr = novedad.time;
      const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
      if (!timeMatch) return null;
      const mappedValues = timeMatch.slice(1).map(Number);
      const hours = mappedValues[0];
      const minutes = mappedValues[1];
      if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes))
        return null;

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
      ? findValueInFormData(settings.finalReportStaffSnapshot, 'Guardia') || activeGuard?.id
      : activeGuard?.id;

    // Resolve Leaders from Staff
    const getLeaderName = (roleName: string) => {
      // Priority 1: If snapshot, trust the snapshot as historical record
      if (hasSnapshot && staffForReport) {
        const key = Object.keys(staffForReport).find(
          (k) => k.toLowerCase() === roleName.toLowerCase()
        );
        if (key) {
          const members = staffForReport[key];
          const firstMember = members ? members[0] : undefined;
          if (firstMember) {
            return formatStaffMemberForReport(firstMember, false).trim();
          }
        }
      }

      // Priority 2: Use Global Personnel (Live mode or fallback)
      if (personnel) {
        const globalMatch = personnel.find(
          (p) => p.roleId?.toLowerCase() === roleName.toLowerCase()
        );
        if (globalMatch) {
          return formatStaffMemberForReport(globalMatch, false).trim();
        }
      }
      return '';
    };

    const director = getLeaderName(LEADER_ROLES.DIRECTOR);
    const jefeDeOperaciones = getLeaderName(LEADER_ROLES.JEFE_OPERACIONES);
    const municipio = findInsensitive(globalSettings, 'Municipio');
    const estado = findInsensitive(globalSettings, 'Estado');

    const dateRangeString = (() => {
      const startDate = hasSnapshot ? new Date(settings.finalReportStartDate!) : new Date();
      const endDate = hasSnapshot
        ? new Date(settings.finalReportEndDate!)
        : new Date(new Date().setDate(new Date().getDate() + 1));

      const formatDatePart = (date: Date) =>
        new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'long' }).format(
          date
        );
      return `DESDE EL ${formatDatePart(startDate)} HASTA EL ${formatDatePart(endDate)} DE ${startDate.getFullYear()}`.toUpperCase();
    })();

    // Use the Orden del Día header format
    const headerParts = [
      `*ORDEN DEL DÍA DEL INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
      ``,
      `*DIRECTOR*`,
      director,
      ``,
      `*JEFE DE OPERACIONES*`,
      jefeDeOperaciones,
      ``,
    ];

    if (guardIdForReport && staffForReport) {
      headerParts.push(`*GRUPO DE GUARDIA:* “${guardIdForReport}”`, ``);
      headerParts.push(`*PERIODO:* ${dateRangeString}`, ``);

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
            const showCedula = !!settings.reportaRoleIds?.some(
              (id) => id.toLowerCase() === role.name.toLowerCase()
            );
            // Match Orden del Día format: Vertical list with Role Header
            headerParts.push(
              ``,
              `*${role.name.toUpperCase()}*`,
              staffList.map((member) => formatStaffMemberForReport(member, showCedula)).join('\n')
            );
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
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(item.sortDate!);
          const horaStr = findValueInFormData(report.formData, 'Hora') as string | undefined;
          const timestampText = `${formattedDate} ${horaStr || ''}`.trim();

          const template = templates.find((t) => t.id === report.templateId);
          const config = configs[report.templateId];

          let contentText = '';
          if (template && config) {
            const dynamicPredefinedValues = {
              ...globalSettings,
              Guardia: guardIdForReport || '',
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
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(item.sortDate!);
          const timestampText = `${formattedDate} ${novedad.time}`;
          return ` - *${timestampText}* - *${novedad.text}*`;
        }
      })
      .filter(Boolean)
      .join('\n\n');

    const finalReportParts = [...headerParts];
    if (statisticsText.trim())
      finalReportParts.push(``, `*ESTADÍSTICAS DEL DÍA*`, ``, statisticsText.trim());
    if (reportContent.trim()) finalReportParts.push(``, `*NOVEDADES DEL DÍA*`, ``, reportContent);
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
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Generador de Reporte de Cierre de Guardia</CardTitle>
            <CardDescription>
              Añade las estadísticas y recopila todas las novedades del día para generar el reporte
              final.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {hasSnapshot ? (
                  <Alert variant="default">
                    <AlertTitle>Usando Datos de Orden del Día</AlertTitle>
                    <AlertDescription className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span>
                          El reporte se generará con el personal y periodo de la última orden del
                          día emitida.
                        </span>
                        <Button
                          variant="link"
                          className="p-0 h-auto whitespace-nowrap"
                          onClick={handleClearSnapshot}
                        >
                          Anular y usar valores actuales
                        </Button>
                      </div>

                      <div className="rounded-md bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border">
                        {(() => {
                          const municipio = findInsensitive(globalSettings, 'Municipio');
                          const estado = findInsensitive(globalSettings, 'Estado');

                          const guardIdForReport = hasSnapshot
                            ? findValueInFormData(settings.finalReportStaffSnapshot, 'Guardia') ||
                            activeGuard?.id
                            : activeGuard?.id;
                          const staffForReport = hasSnapshot
                            ? settings.finalReportStaffSnapshot
                            : activeGuard?.staff;

                          // Resolve Leaders from Staff locally for preview
                          const getLeaderName = (roleName: string) => {
                            if (staffForReport) {
                              const key = Object.keys(staffForReport).find(
                                (k) => k.toLowerCase() === roleName.toLowerCase()
                              );
                              if (key) {
                                const members = staffForReport[key];
                                const firstMember = members ? members[0] : undefined;
                                if (firstMember) {
                                  return formatStaffMemberForReport(firstMember, false).trim();
                                }
                              }
                            }
                            if (personnel) {
                              const globalMatch = personnel.find(
                                (p) => p.roleId?.toLowerCase() === roleName.toLowerCase()
                              );
                              if (globalMatch)
                                return formatStaffMemberForReport(globalMatch, false).trim();
                            }
                            return '';
                          };

                          const director = getLeaderName(LEADER_ROLES.DIRECTOR);
                          const jefeDeOperaciones = getLeaderName(LEADER_ROLES.JEFE_OPERACIONES);

                          const dateRangeString = (() => {
                            const startDate = hasSnapshot
                              ? new Date(settings.finalReportStartDate!)
                              : new Date();
                            const endDate = hasSnapshot
                              ? new Date(settings.finalReportEndDate!)
                              : new Date(new Date().setDate(new Date().getDate() + 1));
                            const formatDatePart = (date: Date) =>
                              new Intl.DateTimeFormat('es-ES', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                              }).format(date);
                            return `DESDE EL ${formatDatePart(startDate)} HASTA EL ${formatDatePart(endDate)} DE ${startDate.getFullYear()}`.toUpperCase();
                          })();

                          const parts = [
                            `*ORDEN DEL DÍA DEL INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
                            ``,
                            `*DIRECTOR*`,
                            director,
                            ``,
                            `*JEFE DE OPERACIONES*`,
                            jefeDeOperaciones,
                            ``,
                          ];

                          if (guardIdForReport && staffForReport) {
                            parts.push(`*GRUPO DE GUARDIA:* “${guardIdForReport}”`, ``);
                            parts.push(`*PERIODO:* ${dateRangeString}`, ``);

                            roles
                              .filter((r) => !r.isHidden)
                              .forEach((role) => {
                                if (
                                  role.name.toLowerCase() === LEADER_ROLES.DIRECTOR.toLowerCase() ||
                                  role.name.toLowerCase() ===
                                  LEADER_ROLES.JEFE_OPERACIONES.toLowerCase()
                                )
                                  return;
                                const staffKey = Object.keys(staffForReport).find(
                                  (k) => k.toLowerCase() === role.name.toLowerCase()
                                );
                                const staffList = staffKey
                                  ? staffForReport[staffKey as keyof typeof staffForReport]
                                  : undefined;
                                if (
                                  staffList &&
                                  staffList.length > 0 &&
                                  staffList.some((s) => s.name.trim() !== '')
                                ) {
                                  const showCedula = !!settings.reportaRoleIds?.some(
                                    (id) => id.toLowerCase() === role.name.toLowerCase()
                                  );
                                  parts.push(
                                    ``,
                                    `*${role.name.toUpperCase()}*`,
                                    staffList
                                      .map((member) =>
                                        formatStaffMemberForReport(member, showCedula)
                                      )
                                      .join('\n')
                                  );
                                }
                              });
                          }
                          return parts.join('\n');
                        })()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default">
                    <AlertTitle>Aviso</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4">
                      <span>
                        No se ha emitido una Orden del Día. El reporte se generará con la guardia
                        activa y fecha actuales.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/orden-del-dia')}
                      >
                        Ir a Orden del Día
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="statistics-text">Estadísticas del Día</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setStatisticsText(
                            DEFAULT_STATISTICS_CATEGORIES.map((c) => `- ${c} 0`).join('\n')
                          );
                        }}
                        title="Cargar lista completa de categorías en 0"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Cargar Estándar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => {
                          // 1. Calculate counts from actual reports
                          const reportCounts = new Map<string, number>();
                          finishedReports.forEach((report) => {
                            const template = templates.find((t) => t.id === report.templateId);

                            if (template) {
                              let category = template.statisticsCategory?.toUpperCase().trim();

                              // Evaluate Rules
                              if (template.statisticsRules && template.statisticsRules.length > 0) {
                                for (const rule of template.statisticsRules) {
                                  // Get value from report data using the field ID (Label)
                                  // Note: findValueInFormData searches loosely by label/key
                                  const rawValue = findValueInFormData(
                                    report.formData,
                                    rule.fieldId
                                  );
                                  const val = String(rawValue || '')
                                    .trim()
                                    .toLowerCase();
                                  const targetVal = rule.condition.trim().toLowerCase();

                                  if (val === targetVal) {
                                    category = rule.category.toUpperCase().trim();
                                    break; // Stop at first match
                                  }
                                }
                              }

                              if (category) {
                                reportCounts.set(category, (reportCounts.get(category) || 0) + 1);
                              }
                            }
                          });

                          // 2. Parse existing text or load default if empty
                          let workingMap = new Map<string, number>();
                          const currentLines = statisticsText
                            .trim()
                            .split('\n')
                            .filter((l) => l.trim());

                          if (currentLines.length === 0) {
                            // If empty, load defaults at 0
                            DEFAULT_STATISTICS_CATEGORIES.forEach((cat) => workingMap.set(cat, 0));
                          } else {
                            // Parse existing lines
                            currentLines.forEach((line) => {
                              const match = line.match(/^-\s+(.*)\s+(\d+)$/);
                              if (match && match[1] !== undefined && match[2] !== undefined) {
                                workingMap.set(match[1].trim(), parseInt(match[2]));
                              }
                            });
                          }

                          // 3. Update with calculated counts
                          reportCounts.forEach((count, category) => {
                            workingMap.set(category, count);
                          });

                          // 4. Render back to text
                          const sortedKeys = Array.from(workingMap.keys()).sort((a, b) => {
                            const idxA = DEFAULT_STATISTICS_CATEGORIES.indexOf(a);
                            const idxB = DEFAULT_STATISTICS_CATEGORIES.indexOf(b);
                            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                            if (idxA !== -1) return -1;
                            if (idxB !== -1) return 1;
                            return a.localeCompare(b);
                          });

                          const newText = sortedKeys
                            .map((key) => `- ${key} ${workingMap.get(key)}`)
                            .join('\n');
                          setStatisticsText(newText);

                          if (
                            reportCounts.size === 0 &&
                            currentLines.length === 0 &&
                            DEFAULT_STATISTICS_CATEGORIES.length === 0
                          ) {
                            // no op
                          }
                        }}
                        title="Actualizar conteo basado en reportes"
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Autocalcular
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="statistics-text"
                    value={statisticsText}
                    onChange={(e) => setStatisticsText(e.target.value)}
                    placeholder="Introduce las estadísticas del día, una por línea. Ejemplo:&#10;- ATENCIONES PREHOSPITALARIAS 06"
                    rows={5}
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    Novedades Registradas ({finishedReports.length} de {reports.length} finalizadas)
                  </h4>
                  <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50">
                    {reports.length > 0 ? (
                      <ul className="space-y-2">
                        {reports.map((report) => (
                          <li key={report.id} className="text-sm">
                            - {report.title}
                            {report.status === 'Finalizado' ? (
                              <span className="ml-2 text-xs text-green-600 font-semibold">
                                (Finalizado)
                              </span>
                            ) : (
                              <span className="ml-2 text-xs text-amber-600">(En proceso)</span>
                            )}
                            {findValueInFormData(report.formData, 'Hora') && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({String(findValueInFormData(report.formData, 'Hora'))})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        No hay novedades para mostrar.
                      </p>
                    )}
                  </ScrollArea>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Añadir Novedad Manual</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <DatePicker
                          value={format(newNovedadDate, 'yyyy-MM-dd')}
                          onChange={(val) => setNewNovedadDate(new Date(val + 'T00:00:00'))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora</Label>
                        <TimeHlvInput
                          value={newNovedadTime}
                          onChange={setNewNovedadTime}
                          showHelperText={false}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texto de la Novedad</Label>
                      <Textarea
                        value={newNovedadText}
                        onChange={(e) => setNewNovedadText(e.target.value)}
                        placeholder="Ej: Se envía primer corte de novedades..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleAddManualNovedad}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir
                      </Button>
                    </div>
                  </div>

                  {manualNovedades.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <Label>Novedades Manuales ({manualNovedades.length})</Label>
                      <div className="space-y-2 rounded-md border p-2 bg-muted/50 max-h-48 overflow-y-auto">
                        {sortedManualNovedades.map((novedad) => (
                          <div
                            key={novedad.id}
                            className="flex items-center justify-between rounded-md p-2 text-sm bg-background"
                          >
                            <span>{`${format(novedad.date, 'dd/MM/yyyy')} ${novedad.time} - ${novedad.text}`}</span>
                            {!novedad.id.includes('_start') && !novedad.id.includes('_end') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleRemoveManualNovedad(novedad.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={
                      finishedReports.length === 0 &&
                      !statisticsText.trim() &&
                      manualNovedades.length === 0
                    }
                  >
                    Generar Reporte de Cierre
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle>Reporte de Cierre de Guardia Generado</DialogTitle>
            <DialogDescription>Puedes copiar el texto generado.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <Textarea
              readOnly
              value={generatedReport}
              className="w-full h-full min-h-[50vh] text-sm whitespace-pre-wrap font-mono"
            />
          </div>
          <DialogFooter className="mt-auto pt-4">
            <Button type="button" onClick={handleCopyToClipboard}>
              {copyButtonText}
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                saveGuardReport({
                  id: `report-${Date.now()}`,
                  date: settings.finalReportStartDate
                    ? new Date(settings.finalReportStartDate).toISOString()
                    : new Date().toISOString(),
                  generatedAt: new Date().toISOString(),
                  guardGroup: settings.activeGuardId || '',
                  content: generatedReport,
                  summary: `Reporte de Cierre - ${format(new Date(), 'dd/MM/yyyy')}`,
                });
                setIsResultDialogOpen(false);
                clearAllReports();
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar en Historial
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
