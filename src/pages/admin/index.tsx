import { ShieldAlert, Users, Settings, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Administrador</h2>
          <p className="text-muted-foreground mt-1">
            Gestión centralizada del sistema y permisos.
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Users Card */}
        <Card 
          className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate('/admin/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gestión de Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximamente: Administrar roles y cuentas
            </p>
          </CardContent>
        </Card>

        {/* System Config Card */}
        <Card 
          className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-amber-500 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate('/admin/config')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Configuración Global
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sistema</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nombre de la organización y estados.
            </p>
          </CardContent>
        </Card>

        {/* Workspaces Management Card */}
        <Card 
          className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate('/admin/workspaces')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gestión de Áreas
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Crear y asignar áreas de trabajo en la nube.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
