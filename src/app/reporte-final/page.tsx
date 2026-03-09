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
import { generateId } from '@/lib/utils/id';

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
  const { reports, isLoaded: reportsLoaded, clearAllReports } = useReports();
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
      ? String(findValueInFormData(settings.finalReportStaffSnapshot, 'Guardia') || activeGuard?.id || '')
      : activeGuard?.id || '';

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
    <div className="flex flex-col items-center justify-center p-8 h-full text-center space-y-4">
      <h2 className="text-2xl font-semibold">Generador de Reportes</h2>
      <p className="text-muted-foreground">Esta sección ha sido deshabilitada temporalmente a petición del administrador.</p>
    </div>
  );
}
