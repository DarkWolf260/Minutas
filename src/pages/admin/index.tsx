import { 
  ShieldCheck, 
  Users, 
  Settings, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Activity,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useCloudWorkspaces } from '@/hooks/use-cloud-workspaces';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { APP_VERSION } from '@/pages/settings/about/data';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { users, loading: loadingUsers } = useAdminUsers();
  const { workspaces, loading: loadingWorkspaces } = useCloudWorkspaces();
  const { config } = useGlobalConfig();

  const stats = [
    {
      label: 'Usuarios Totales',
      value: loadingUsers ? '...' : users.length,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Áreas en la Nube',
      value: loadingWorkspaces ? '...' : workspaces.length,
      icon: Globe,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Estado del Sistema',
      value: 'Activo',
      icon: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 backdrop-blur-md border border-muted/60 p-6 md:p-10 rounded-[2.5rem] shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2 border border-primary/20">
              <ShieldCheck className="h-3 w-3" />
              Acceso de Administrador
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Panel de Control
            </h1>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Gestiona los cimientos de la plataforma, supervisa usuarios y configura las áreas de trabajo globales desde un solo lugar.
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-tighter">Versión del Sistema</span>
              <span className="text-sm font-mono font-bold">v{APP_VERSION}</span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
              <Settings className="h-8 w-8 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-muted/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {stat.label}
                  </p>
                  <div className="text-3xl font-black tracking-tight flex items-baseline gap-2">
                    {stat.value}
                    {i === 0 && !loadingUsers && (
                      <span className="text-[10px] font-medium text-emerald-500 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                        +2 hoy
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Navigation Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Users Admin */}
          <NavCard 
            title="Gestión de Usuarios"
            description="Controla accesos, aprueba nuevas cuentas y asigna roles administrativos a los perfiles del sistema."
            icon={Users}
            count={loadingUsers ? null : users.length}
            color="blue"
            onClick={() => navigate('/admin/users')}
          />

          {/* Config Admin */}
          <NavCard 
            title="Configuración Global"
            description="Ajustes críticos que afectan a toda la plataforma: modo mantenimiento y políticas de registro."
            icon={Settings}
            label="Sistema"
            color="amber"
            onClick={() => navigate('/admin/config')}
          />

          {/* Workspace Admin */}
          <NavCard 
            title="Áreas de Trabajo"
            description="Supervisa y crea nuevas áreas de trabajo en la nube, gestionando su ubicación y disponibilidad."
            icon={Layers}
            count={loadingWorkspaces ? null : workspaces.length}
            color="emerald"
            onClick={() => navigate('/admin/workspaces')}
          />
        </div>

        {/* Footer info */}
        <div className="pt-8 flex items-center justify-center gap-6 opacity-40">
           <Separator className="flex-1" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Seguridad de Nivel Institucional</p>
           <Separator className="flex-1" />
        </div>
      </div>
    </div>
  );
}

interface NavCardProps {
  title: string;
  description: string;
  icon: any;
  count?: number | null;
  label?: string;
  color: 'blue' | 'amber' | 'emerald';
  onClick: () => void;
}

function NavCard({ title, description, icon: Icon, count, label, color, onClick }: NavCardProps) {
  const colorMap = {
    blue: "border-blue-500/20 hover:border-blue-500/50 bg-blue-500/5 group-hover:bg-blue-500/10",
    amber: "border-amber-500/20 hover:border-amber-500/50 bg-amber-500/5 group-hover:bg-amber-500/10",
    emerald: "border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5 group-hover:bg-emerald-500/10"
  };

  const iconColorMap = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500"
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-500 cursor-pointer border rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
        colorMap[color]
      )}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
        <Icon className="h-32 w-32 rotate-12" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", colorMap[color])}>
          <Icon className={cn("h-6 w-6", iconColorMap[color])} />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed min-h-[40px]">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
             {count !== undefined ? (
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black tracking-tighter">
                   {count === null ? '...' : count}
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Registros</span>
               </div>
             ) : (
               <div className="px-2 py-1 rounded-lg bg-background/50 border border-muted/50 text-[10px] font-bold uppercase tracking-widest">
                 {label}
               </div>
             )}
          </div>
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1", iconColorMap[color])}>
             <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-[1px] bg-muted/40", className)} />;
}
