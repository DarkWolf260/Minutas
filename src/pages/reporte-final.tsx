import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useReports } from '@/hooks/use-reports';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { Skeleton } from '@/components/ui/skeleton';
import { findValueInFormData, getReportDateTime } from '@/lib/report-sorter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { usePersonnel } from '@/hooks/use-personnel';
import { useTemplates } from '@/hooks/use-templates';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useIsMobile } from '@/hooks/use-mobile';
import { renderFinalReport } from '@/lib/template-parser';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Report, StaffMember } from '@/lib/types';
import { DatePicker } from '@/components/date-picker';
import { TimeHlvInput } from '@/components/time-hlv-input';
import { PlusCircle, Trash2, FileText, Save, TrendingUp, Users, X, ChevronLeft, Eye, RotateCcw, History, ClipboardCheck, Calendar, Clock, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LEADER_ROLES } from '@/lib/constants/roles';
import { generateId } from '@/lib/utils/id';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ManualNovedad {
  id: string;
  date: string; // ISO format
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
  // const { toast } = useToast(); -- Removed as we use sonner directly
  const { reports, clearAllReports, isLoaded: reportsLoaded } = useReports();
  const { reports: savedReports, isLoaded: historyLoaded, saveGuardReport, deleteGuardReport } = useGuardHistory();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editingManualId, setEditingManualId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const isMobile = useIsMobile();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { roles, isLoaded: rolesLoadedHook } = useRoles();
  const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
  const { personnel } = usePersonnel();
  const { definitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const navigate = useNavigate();

  const manualNovedades = useMemo(() => settings.finalReportManualNovedades || [], [settings.finalReportManualNovedades]);
  const statisticsText = settings.finalReportStatistics || '';
  
  
  const [generatedReport, setGeneratedReport] = useState('');
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  const isGuardOpen = settings.isGuardOpen || false;

  const handleFinalizeAndSave = async () => {
    if (!generatedReport || !activeGuard) {
      toast.error('No hay contenido de reporte o guardia activa para finalizar.');
      return;
    }

    try {
      const reportId = generateId();
      const now = new Date();
      // Ensure date is exactly 20 characters (no milliseconds) to stay within DB's maxLength: 20 limit
      const isoDate20 = now.toISOString().split('.')[0] + 'Z';
      const fullIsoDate = now.toISOString();
      
      await saveGuardReport({
        id: reportId,
        date: isoDate20,
        generatedAt: fullIsoDate,
        summary: settings.guardPeriod || `Reporte de Guardia ${activeGuard.id}`,
        content: generatedReport,
        guardGroup: activeGuard.id.split(' ')[0] || '',
        workspaceId: '', 
      });

      // After saving to history, close the actual guard data
      await saveSettings({ 
        isGuardOpen: false,
        guardPeriod: '', 
        activeGuardId: '', // Clear active guard
        finalReportManualNovedades: [], 
        finalReportStatistics: '', 
      });

      // Clear all individual reports (novedades) from the current guard session
      await clearAllReports();

      setIsConfirmSaveOpen(false);
      setIsResultDialogOpen(false);
      setActiveTab('history'); 
      toast.success('Guardia finalizada y reporte archivado con éxito.');
    } catch (error) {
      console.error('Failed to finalize and save', error);
      toast.error('Error al finalizar la guardia.');
    }
  };

  const [newNovedadDate, setNewNovedadDate] = useState(new Date());
  const [newNovedadTime, setNewNovedadTime] = useState('');
  const [newNovedadText, setNewNovedadText] = useState('');

  useEffect(() => {
    if (!settingsLoaded) return;

    // Only set defaults if manual novedades are empty
    if (settings.finalReportManualNovedades && settings.finalReportManualNovedades.length > 0) return;

    const startDate = new Date();
    startDate.setHours(8, 0, 0, 0);

    const endDate = new Date(new Date().setDate(new Date().getDate() + 1));
    endDate.setHours(8, 0, 0, 0);

    const defaultStartNovedad: ManualNovedad = {
      id: `${generateId('manual')}_start`,
      date: startDate.toISOString(),
      time: '08:00 HLV',
      text: 'Se inicia la guardia preventiva de 24 horas',
    };

    const defaultEndNovedad: ManualNovedad = {
      id: `${generateId('manual')}_end`,
      date: endDate.toISOString(),
      time: '08:00 HLV',
      text: 'Se da culminación a la guardia preventiva de 24 horas',
    };

    saveSettings({
      finalReportManualNovedades: [defaultStartNovedad, defaultEndNovedad]
    });
  }, [settingsLoaded, settings.finalReportManualNovedades?.length, saveSettings]);

  const globalSettings = useMemo(() => {
    // 1. Start with global definitions
    const settingsMap: Record<string, string> = {};
    Object.keys(definitions).forEach((key) => {
      if (definitions[key]?.value) {
        settingsMap[key] = definitions[key]!.value!;
      }
    });

    // 2. Merge/Override with template-specific configurations
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
      settingsMap
    );
  }, [configs, definitions]);

  const activeGuard = useMemo(() => {
    if (!settings.activeGuardId || !guards.length) return null;
    return guards.find((g) => g.id === settings.activeGuardId);
  }, [settings.activeGuardId, guards]);


  const handleAddManualNovedad = () => {
    if (!newNovedadTime || !newNovedadText) return;

    if (editingManualId) {
      // Update existing
      saveSettings({
        finalReportManualNovedades: manualNovedades.map(n => 
          n.id === editingManualId 
            ? { ...n, date: newNovedadDate.toISOString(), time: newNovedadTime, text: newNovedadText }
            : n
        )
      });
      setEditingManualId(null);
      toast.success('Novedad actualizada.');
    } else {
      // Add new
      const newNovedad: ManualNovedad = {
        id: generateId('manual'),
        date: newNovedadDate.toISOString(),
        time: newNovedadTime,
        text: newNovedadText,
      };
      saveSettings({
        finalReportManualNovedades: [...manualNovedades, newNovedad]
      });
    }
    setNewNovedadTime('');
    setNewNovedadText('');
  };

  const handleEditManualNovedad = (novedad: ManualNovedad) => {
    setEditingManualId(novedad.id);
    setNewNovedadDate(new Date(novedad.date));
    setNewNovedadTime(novedad.time);
    setNewNovedadText(novedad.text);
  };

  const handleCancelEdit = () => {
    setEditingManualId(null);
    setNewNovedadTime('');
    setNewNovedadText('');
  };

  const handleRemoveManualNovedad = (idToRemove: string) => {
    saveSettings({
      finalReportManualNovedades: manualNovedades.filter((n) => n.id !== idToRemove)
    });
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
      const sortDate = new Date(novedad.date);
      const timeMatch = novedad.time.match(/(\d{2}):(\d{2})/);
      
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          sortDate.setHours(hours, minutes, 0, 0);
        }
      }
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
    const now = new Date();
    // Ajustar a las 08:00 AM de hoy o de ayer dependiendo de la hora actual
    const shiftStart = new Date(now);
    if (now.getHours() < 8) {
      shiftStart.setDate(now.getDate() - 1);
    }
    shiftStart.setHours(8, 0, 0, 0);
    
    const currentGuardId = activeGuard?.id;
    
    return reports.filter((report) => {
      if (report.status !== 'Finalizado') return false;
      
      // 1. Filtrar por guardia si está definida
      const reportGuard = findValueInFormData(report.formData, 'Guardia');
      if (currentGuardId && reportGuard && String(reportGuard).trim().toUpperCase() !== String(currentGuardId).trim().toUpperCase()) {
        return false;
      }

      // 2. Filtrar por fecha
      const reportDate = getReportDateTime(report);
      if (reportDate) {
        // En tiempo real, desde el inicio del turno (08:00)
        if (reportDate < shiftStart) return false;
      }
      
      return true;
    });
  }, [reports, activeGuard?.id]);

  const handleGenerateReport = () => {
    if (finishedReports.length === 0 && !statisticsText.trim() && manualNovedades.length === 0) {
      setGeneratedReport('No hay novedades finalizadas ni estadísticas para reportar.');
      setIsResultDialogOpen(true);
      return;
    }

    const draft = settings.ordenDelDiaDraft;
    const staffForReport = (draft && draft.guardId === settings.activeGuardId)
      ? draft.staff
      : activeGuard?.staff;

    const guardIdForReport = (draft && draft.guardId === settings.activeGuardId)
      ? draft.guardId || ''
      : (activeGuard?.id || settings.activeGuardId || '');

    const getLeaderName = (roleName: string) => {
      if (staffForReport) {
        const key = Object.keys(staffForReport).find(
          (k) => k.toLowerCase() === roleName.toLowerCase()
        );
        if (key) {
          const members = staffForReport[key as keyof typeof staffForReport];
          const firstMember = members ? members[0] : undefined;
          if (firstMember) {
            return formatStaffMemberForReport(firstMember).trim();
          }
        }
      }

      // Fallback a personal global si no está en la guardia específica
      if (personnel) {
        const roleMatch = personnel.find(
          (p) => {
            const pRoleId = (p.roleId || '').toLowerCase();
            const pCargo = (p.cargo || '').toLowerCase();
            const target = roleName.toLowerCase();
            return pRoleId === target || pCargo === target || pRoleId.includes(target);
          }
        );
        if (roleMatch) {
          return formatStaffMemberForReport(roleMatch).trim();
        }
      }
      return '';
    };

    const director = getLeaderName(LEADER_ROLES.DIRECTOR);
    const jefeDeOperaciones = getLeaderName(LEADER_ROLES.JEFE_OPERACIONES);
    const municipio = findInsensitive(globalSettings, 'Municipio');

    const dateRangeString = (() => {
      // Prioritize manually entered period from Orden del Día
      if (settings.guardPeriod) {
        const periodStr = settings.guardPeriod.toUpperCase().trim();
        if (periodStr.includes(' AL ')) {
          const parts = periodStr.split(' AL ');
          const formatDatePart = (part: string) => {
            const dateMatch = part.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (dateMatch) {
              const [_, d, m, y] = dateMatch;
              const dateObj = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
              if (!isNaN(dateObj.getTime())) {
                const dayStr = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit' }).format(dateObj).replace(',', '').toUpperCase();
                return dayStr;
              }
            }
            return part;
          };
          
          const startStr = formatDatePart(parts[0] || '');
          const endStr = formatDatePart(parts[1] || '');
          const endDateRaw = parts[1]?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (endDateRaw) {
             const [_, d, m, y] = endDateRaw;
             const dateObj = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
             const monthLong = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(dateObj).toUpperCase();
             return `DESDE EL ${startStr} HASTA EL ${endStr} DE ${monthLong} DE ${y}`;
          }
          
          return `DESDE EL ${startStr} HASTA EL ${endStr}`;
        }
        return periodStr;
      }

      // Auto-calculate fallback based on shift rotation (08:00 to 08:00)
      const now = new Date();
      const shiftStart = new Date(now);
      if (now.getHours() < 8) {
        shiftStart.setDate(now.getDate() - 1);
      }
      shiftStart.setHours(8, 0, 0, 0);

      const shiftEnd = new Date(shiftStart);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(8, 0, 0, 0);

      const startDate = shiftStart;
      const endDate = shiftEnd;
      
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      
      const dayStart = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        day: '2-digit',
        month: startMonth !== endMonth ? 'long' : undefined
      }).format(startDate).replace(',', '');
      
      const dayEnd = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long' 
      }).format(endDate).replace(',', '');
      
      return `DESDE EL ${dayStart.toUpperCase()} HASTA EL ${dayEnd.toUpperCase()} DE ${endDate.getFullYear()}`;
    })();

    const headerParts = [
      `*INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()}*`,
      ``,
    ];

    if (director) {
      headerParts.push(`*DIRECTOR-PRESIDENTE*`, director, ``);
    }

    if (jefeDeOperaciones) {
      headerParts.push(`*JEFE DE OPERACIONES*`, jefeDeOperaciones, ``);
    }

    headerParts.push(`*REPORTE DE NOVEDADES ${dateRangeString}*`, ``);

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
            
            const isJefeServicios = role.name.toLowerCase() === 'jefe de los servicios';
            const displayRole = isJefeServicios && settings.ordenDelDiaDraft?.isJefeEncargado 
              ? `${role.name.toUpperCase()} (E)` 
              : role.name.toUpperCase();

            headerParts.push(`- *${displayRole}:* ${names}`);
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
          const timestampText = `${formattedDate} ${horaStr || format(sortDate, 'HH:mm')}`.trim();
          const template = templates.find((t) => t.id === report.templateId);
          const config = configs[report.templateId];

          let contentText = '';
          if (template && config) {
            const dynamicPredefinedValues = {
              ...globalSettings,
              Guardia: guardIdForReport,
              Estatus: report.status || 'En proceso',
              Enc: settings.ordenDelDiaDraft?.isJefeEncargado ? '(E)' : '',
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

  const handleCopyReport = () => {
    if (selectedSavedReport) {
      navigator.clipboard.writeText(selectedSavedReport.content);
      setCopyButtonText('¡Copiado!');
      setTimeout(() => setCopyButtonText('Copiar'), 2000);
    }
  };

  const handleViewSavedReport = (id: string) => {
    setSelectedReportId(id);
    setViewDialogOpen(true);
  };

  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGuardReport(id);
    if (selectedReportId === id) {
      setViewDialogOpen(false);
      setSelectedReportId(null);
    }
  };

  const sortedSavedReports = useMemo(() => {
    return [...savedReports].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }, [savedReports]);

  const selectedSavedReport = useMemo(() => 
    savedReports.find((r) => r.id === selectedReportId),
  [savedReports, selectedReportId]);

  const isLoaded =
    reportsLoaded && guardsLoaded && settingsLoaded && rolesLoadedHook && templatesLoaded && definitionsLoaded;

  return (
    <div className="flex flex-col min-h-screen md:h-full bg-background overflow-y-auto md:overflow-hidden relative">
      {/* Mobile Floating Action Button for Generating Report Final - Place here to ensure viewport fixed position */}
      {activeTab === 'generate' && (
        <div className="sm:hidden fixed bottom-24 right-6 z-[60] animate-in fade-in zoom-in duration-300 ease-out">
          <Button
            onClick={handleGenerateReport}
            disabled={!isLoaded}
            size="icon"
            className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary-foreground/10 hover:scale-105 active:scale-95 transition-all duration-300"
            title="Generar Reporte Final"
          >
            <FileText className="h-7 w-7" />
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col md:overflow-hidden">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-32 sm:pb-10 flex flex-col md:flex-1 md:min-h-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div className="flex items-center gap-4">
                <Link to="/" className="shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold tracking-tight">Reporte de Cierre</h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Gestiona y consulta los reportes de cierre de guardia.
                  </p>
                </div>
              </div>
              
                <div className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                  <TabsList className="grid w-[240px] grid-cols-2 shadow-sm">
                    <TabsTrigger value="generate">Generar</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                  </TabsList>
                
                {activeTab === 'generate' && !isMobile && isLoaded && (
                  <Button 
                    onClick={handleGenerateReport} 
                    size="sm"
                    className="hidden sm:flex gap-2 shadow-sm font-bold ml-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generar Reporte Final
                  </Button>
                )}
              </div>
            </div>

            <TabsContent 
              value="generate" 
              className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 ease-in-out"
            >
              {!isLoaded ? (
                <div className="space-y-8 flex-1">
                  <Skeleton className="h-[100px] w-full rounded-xl" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                  </div>
                </div>
              ) : (
                <div className="md:flex-1 md:min-h-0 flex flex-col gap-6 h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 px-1">
                    <Alert className="bg-primary/5 border-primary/20 shadow-sm leading-normal flex items-center h-full py-2.5 rounded-2xl">
                      <div className="flex items-center gap-4 w-full">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <AlertTitle className="font-bold text-sm tracking-tight uppercase">Información de Generación</AlertTitle>
                          <AlertDescription className="text-xs opacity-80 mt-0.5">
                            Consolidará <span className="font-bold text-primary">{finishedReports.length}</span> novedades y <span className="font-bold text-primary">{manualNovedades.length}</span> eventos manuales.
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>

                    {activeGuard ? (
                      <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm flex items-center h-full py-2.5 rounded-2xl">
                        <div className="flex items-center gap-4 w-full">
                          <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <AlertTitle className="font-bold text-sm tracking-tight uppercase">Estado de Guardia</AlertTitle>
                            <AlertDescription className="text-xs opacity-80 mt-0.5">
                              Guardia <strong className="uppercase">"{activeGuard.id}"</strong> activa y sincronizada.
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ) : (
                      <Alert variant="destructive" className="shadow-sm flex items-center h-full py-2.5 bg-destructive/5 border-destructive/20 rounded-2xl">
                        <div className="flex items-center gap-4 w-full">
                          <div className="bg-destructive/10 p-2.5 rounded-xl">
                            <Users className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <AlertTitle className="font-bold text-sm tracking-tight uppercase tracking-widest text-destructive">Atención: Sin Personal</AlertTitle>
                            <AlertDescription className="text-xs opacity-90 mt-0.5">
                              No hay una guardia activa detectada para el personal.
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch md:flex-1 md:min-h-0 pb-4 overflow-hidden">
                    <div className="flex flex-col gap-8 md:flex-1 md:min-h-0 md:h-full">
                      <Card className="border bg-card/50 backdrop-blur-sm md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0 shadow-sm">
                        <CardHeader className="py-3 border-b bg-background/50 backdrop-blur-sm shrink-0">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            Estadísticas del Día
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                          <Textarea
                            placeholder="Ej: - TRASLADOS URBANOS 5"
                            value={statisticsText}
                            onChange={(e) => saveSettings({ finalReportStatistics: e.target.value })}
                            className="font-mono text-xs leading-relaxed flex-1 w-full resize-none bg-muted/20 border-muted/30 focus-visible:ring-primary/20 p-3 rounded-md"
                          />
                        </CardContent>
                      </Card>

                      <Card className="border bg-card/50 backdrop-blur-sm md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0 shadow-sm">
                        <CardHeader className="py-3 border-b bg-background/50 backdrop-blur-sm shrink-0">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Novedades Automáticas a Consolidar ({finishedReports.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                          <ScrollArea className="h-full" type="always">
                            {finishedReports.length === 0 ? (
                              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <FileText className="h-8 w-8 mb-2 stroke-1" />
                                <p className="text-[11px] font-medium uppercase tracking-widest text-center px-4">
                                  No hay novedades automáticas<br/>finalizadas para este turno
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y divide-muted/40 p-4 space-y-3">
                                {finishedReports.map((report) => (
                                  <div key={report.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:bg-muted/5 transition-colors group">
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-muted rounded text-muted-foreground whitespace-nowrap">
                                          {findValueInFormData(report.formData, "Hora") as string}
                                        </span>
                                        <span className="text-xs font-bold opacity-70">
                                          {report.title}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-4">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => navigate(`/?selected=${report.id}`)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={() => {/* Reports are managed in novedades page, but we could add delete here too */}}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-col gap-6 flex-1 min-h-0 pb-2 h-full">
                      <Card className="border bg-card/50 backdrop-blur-sm shrink-0 shadow-sm">
                        <CardHeader className="py-3 border-b bg-background/50 backdrop-blur-sm shrink-0">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <PlusCircle className="h-3.5 w-3.5 text-primary" />
                            {editingManualId ? 'Editar Evento Manual' : 'Nuevo Evento Manual'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 shrink-0 overflow-hidden">
                            <div className="p-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Fecha</Label>
                              <DatePicker
                                value={format(newNovedadDate, 'yyyy-MM-dd')}
                                onChange={(val) => setNewNovedadDate(new Date(val + 'T00:00:00'))}
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Hora</Label>
                              <TimeHlvInput
                                value={newNovedadTime}
                                onChange={setNewNovedadTime}
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="sm:col-span-5 flex gap-2 items-end">
                              {editingManualId ? (
                                <>
                                  <Button 
                                    onClick={handleAddManualNovedad}
                                    disabled={!newNovedadText || !newNovedadTime}
                                    className="h-9 px-4 rounded-xl font-bold gap-2 text-xs"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    Guardar
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="h-9 px-4 rounded-xl font-bold gap-2 text-xs"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={handleAddManualNovedad}
                                  disabled={!newNovedadText || !newNovedadTime}
                                  className="w-fit h-9 px-6 rounded-xl font-bold gap-2 text-xs group"
                                >
                                  <PlusCircle className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                                  Agregar
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Textarea
                              placeholder="Descripción breve del evento..."
                              value={newNovedadText}
                              onChange={(e) => setNewNovedadText(e.target.value)}
                              className="min-h-[80px] bg-background border-muted-foreground/20 focus-visible:ring-primary/20 rounded-xl resize-none text-sm"
                            />
                          </div>
                        </div>
                    </CardContent>
                  </Card>

                      <Card className="border bg-card/50 backdrop-blur-sm md:overflow-hidden md:flex flex-col md:flex-1 md:min-h-0 shadow-sm">
                        <CardHeader className="py-3 border-b bg-background/50 backdrop-blur-sm shrink-0">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            Cronología de Eventos Manuales ({manualNovedades.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                          <ScrollArea className="h-full" type="always">
                            {manualNovedades.length === 0 ? (
                              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <PlusCircle className="h-8 w-8 mb-2 stroke-1" />
                                <p className="text-[11px] font-medium uppercase tracking-widest text-center px-4">Sin eventos manuales<br/>registrados para esta guardia</p>
                              </div>
                            ) : (
                              <div className="p-4 space-y-2">
                                  {sortedManualNovedades.map((novedad) => (
                                    <div key={novedad.id} className="flex items-center justify-between p-3 sm:p-4 bg-background border rounded-xl hover:bg-muted/5 transition-colors group gap-3">
                                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1 shrink-0">
                                            <div className="text-[9px] font-extrabold px-1.5 py-0.5 bg-primary/5 rounded text-primary/70 whitespace-nowrap uppercase tracking-wider">
                                              {format(new Date(novedad.date), 'dd/MM')}
                                            </div>
                                            <div className="text-[9px] font-extrabold px-1.5 py-0.5 bg-primary/10 rounded text-primary whitespace-nowrap uppercase tracking-wider">
                                              {novedad.time}
                                            </div>
                                          </div>
                                          {editingManualId === novedad.id && (
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 animate-pulse bg-primary/5 text-primary border-primary/20 shrink-0">
                                              Editando
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">{novedad.text}</p>
                                      </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => handleEditManualNovedad(novedad)}
                                        disabled={!!editingManualId}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={() => handleRemoveManualNovedad(novedad.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
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
            </TabsContent>

            <TabsContent 
              value="history" 
              className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-right-4 duration-500 ease-in-out"
            >
              <Card className="border bg-card/50 backdrop-blur-sm md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0 shadow-sm">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {!historyLoaded ? (
                    <div className="p-8 space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : savedReports.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground">
                      <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No hay reportes guardados</p>
                      <p className="text-sm opacity-70">Los reportes que generes aparecerán aquí.</p>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 w-full" type="always">
                        <div className="divide-y divide-muted/50">
                        {sortedSavedReports.map((report) => (
                          <div
                            key={report.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-muted/30 transition-colors gap-4"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="font-bold text-lg leading-none">
                                {report.summary || 'Reporte sin título'}
                              </div>
                              <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                                <span className="flex items-center bg-muted/30 px-2 py-0.5 rounded text-xs gap-1.5">
                                  <Clock className="h-3.5 w-3.5 opacity-70" />
                                  {format(new Date(report.generatedAt), "HH:mm 'hs'", { locale: es })}
                                </span>
                                {report.guardGroup && (
                                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] h-5 px-1.5 font-bold">
                                    {report.guardGroup}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none font-bold rounded-xl h-10 px-4"
                                onClick={() => handleViewSavedReport(report.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none font-bold rounded-xl h-10 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive border-muted/50">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-muted/50">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. El reporte se borrará permanentemente de tu historial.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDeleteSavedReport(report.id, e as any)} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

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
            <div className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[60vh] sm:h-[50vh] w-full rounded-md border bg-muted/30">
                <Textarea
                  readOnly
                  value={generatedReport}
                  className="w-full h-full min-h-[50vh] font-mono text-xs whitespace-pre-wrap border-none focus-visible:ring-0 p-4"
                />
              </ScrollArea>
            </div>
            <SheetFooter className="mt-4 flex flex-col gap-2 pb-6">
              <Button className="w-full h-12" type="button" onClick={handleCopyToClipboard}>
                {copyButtonText === 'Copiar' ? (
                  <Save className="mr-2 h-4 w-4" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              {isGuardOpen && (
                <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-12 font-bold uppercase tracking-tight shadow-lg">
                      <History className="mr-2 h-4 w-4" />
                      Finalizar y Guardar en Historial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-muted/50 mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar Cierre de Guardia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción archivará el reporte de la guardia "{activeGuard?.id}" y limpiará los datos actuales para la próxima jornada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-2">
                       <AlertDialogAction onClick={handleFinalizeAndSave} className="bg-primary hover:bg-primary/90 rounded-xl font-bold h-11">
                        Confirmar y Archivar
                      </AlertDialogAction>
                      <AlertDialogCancel className="rounded-xl font-bold h-11">Cancelar</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <SheetClose asChild>
                <Button type="button" variant="secondary" className="w-full h-10">
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
              <ScrollArea className="h-[50vh] w-full rounded-md border bg-background shadow-inner">
                <Textarea
                  readOnly
                  value={generatedReport}
                  className="w-full h-full min-h-[50vh] bg-transparent font-mono text-xs whitespace-pre-wrap border-none focus-visible:ring-0 p-6"
                />
              </ScrollArea>
            </div>

            <DialogFooter className="p-4 bg-background border-t gap-2 sm:gap-0">
              {isGuardOpen && (
                <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="font-bold gap-2 shadow-lg px-8">
                      <History className="h-4 w-4" />
                      Finalizar y Guardar Historial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-muted/50">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Cierre y Archivado</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de finalizar la guardia "{activeGuard?.id}"? El reporte se guardará de forma permanente en el historial.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalizeAndSave} className="bg-primary hover:bg-primary/90 rounded-xl font-bold px-6">
                        Confirmar y Cerrar Guardia
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex-1" />
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cerrar Pantalla
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

      {viewDialogOpen && selectedSavedReport && (
        isMobile ? (
          <Sheet open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6 overflow-hidden border-none">
              <SheetHeader className="text-left shrink-0">
                <SheetTitle className="text-xl font-bold">Detalle del Reporte</SheetTitle>
                <SheetDescription className="flex items-center gap-2 font-semibold text-primary">
                  <Calendar className="h-4 w-4" />
                  {selectedSavedReport.summary}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-hidden mt-6 pb-24">
                <ScrollArea className="h-full w-full rounded-xl border bg-muted/20">
                  <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedSavedReport.content}
                  </div>
                </ScrollArea>
              </div>
              <SheetFooter className="mt-auto shrink-0 flex flex-col gap-2 pb-6 border-t pt-4 bg-background z-50">
                <Button 
                  onClick={handleCopyReport}
                  className="w-full h-12 rounded-xl font-bold gap-2"
                >
                  <Save className="h-4 w-4" />
                  Copiar Texto
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="secondary" className="w-full h-10 rounded-xl">
                    Cerrar Detalle
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-3xl flex flex-col p-0 overflow-hidden rounded-3xl border-muted/50 shadow-2xl">
              <div className="p-6 border-b bg-muted/20 shrink-0">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold">Detalle del Reporte</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 font-medium text-primary uppercase">
                    <Calendar className="h-4 w-4" />
                    {selectedSavedReport.summary || format(new Date(selectedSavedReport.date), 'PPP', { locale: es })}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[60vh] bg-background border-y border-muted/50 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <div className="p-8 pb-12 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedSavedReport.content}
                </div>
              </div>
              <DialogFooter className="p-6 pt-2 border-t bg-background shrink-0 z-10 gap-3">
                <Button 
                  onClick={handleCopyReport}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold gap-2"
                >
                  <Save className="h-4 w-4" />
                  Copiar Texto
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="font-bold rounded-xl h-12 flex-1">
                    Cerrar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      )}

    </div>
  );
}
