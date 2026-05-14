import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  User,
  UserPlus,
  UserMinus,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Layers,
  Plus,
  Search,
  Trash2,
  Loader2,
  Database,
  Calendar,
  MapPin,
  Save,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AjustesGeneralesForm } from '@/components/shared/ajustes-generales-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DbKeys } from '@/lib/repositories';
import { useCloudWorkspaces } from '@/hooks/use-cloud-workspaces';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function AdminWorkspacesPage() {
  const {
    workspaces,
    loading: fetchLoading,
    createCloudWorkspace,
    deleteCloudWorkspace
  } = useCloudWorkspaces();
  const [states, setStates] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [search, setSearch] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [customId, setCustomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [configWorkspace, setConfigWorkspace] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);
  
  // Settings management state
  const [activeTab, setActiveTab] = useState('personal');
  const [wsDefinitions, setWsDefinitions] = useState<Record<string, any>>({});
  const [wsConfig, setWsConfig] = useState<any>({ reportarole_ids: [] });
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Delete confirmation state
  const [wsToDelete, setWsToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      const [statesData, usersData, rolesData] = await Promise.all([
        supabase.from('states').select('*').order('name'),
        supabase.from('profiles').select('id, full_name, email, allowed_workspaces, is_admin').order('full_name'),
        supabase.from('roles').select('*').order('order')
      ]);
      if (statesData.data) setStates(statesData.data);
      if (usersData.data) setAllUsers(usersData.data);
      if (rolesData.data) setAllRoles(rolesData.data);
    };
    loadMetadata();
  }, []);

  // Fetch workspace settings when config dialog opens
  useEffect(() => {
    if (isConfigOpen && configWorkspace) {
      const loadSettings = async () => {
        setIsLoadingSettings(true);
        try {
          const [defData, confData] = await Promise.all([
            supabase.from('configs').select('*').eq('workspace_id', configWorkspace.id).eq('type', 'field_definition'),
            supabase.from('configs').select('data').eq('id', DbKeys.settings(configWorkspace.id)).maybeSingle()
          ]);

          const defs: Record<string, any> = {};
          if (defData.data && defData.data.length > 0) {
            defData.data.forEach(d => {
              defs[d.name] = d.data;
            });
          } else {
            // Default initial values
            defs['Municipio'] = { label: 'Municipio', type: 'predefined', value: configWorkspace.municipio || '', section_id: 'default' };
            defs['Estado'] = { label: 'Estado', type: 'predefined', value: configWorkspace.estado || 'Anzoátegui', section_id: 'default' };
            defs['REDAN'] = { label: 'REDAN', type: 'predefined', value: 'Oriente', section_id: 'default' };
            defs['ZOEDAN'] = { label: 'ZOEDAN', type: 'predefined', value: 'Anzoátegui', section_id: 'default' };
          }
          setWsDefinitions(defs);

          if (confData.data && confData.data.data) {
            const rawData = confData.data.data;
            const reportarole_ids = rawData.reportarole_ids || rawData.reportaroleIds || [];
            setWsConfig({ ...rawData, reportarole_ids });
          } else {
            setWsConfig({ reportarole_ids: [] });
          }
        } catch (err) {
          console.error('Error loading settings:', err);
        } finally {
          setIsLoadingSettings(false);
        }
      };
      loadSettings();
    } else {
      setActiveTab('personal');
    }
  }, [isConfigOpen, configWorkspace]);

  const handleSaveSettings = async () => {
    if (!configWorkspace) return;
    setIsSavingSettings(true);
    try {
      // 1. Save definitions
      const defPromises = Object.entries(wsDefinitions).map(([name, data]) => 
        supabase.from('configs').upsert({
          id: DbKeys.fieldDefinition(configWorkspace.id, name),
          workspace_id: configWorkspace.id,
          type: 'field_definition',
          name,
          data
        }, { onConflict: 'id' })
      );

      // 2. Save config
      const configPromise = supabase.from('configs').upsert({
        id: DbKeys.settings(configWorkspace.id),
        workspace_id: configWorkspace.id,
        type: 'settings',
        data: wsConfig
      }, { onConflict: 'id' });

      await Promise.all([...defPromises, configPromise]);

      // 3. Sync with workspaces table for Name/Estado/Municipio
      const muni = wsDefinitions['Municipio']?.value;
      const estado = wsDefinitions['Estado']?.value;
      const wsName = configWorkspace.name; // Keep tracking if we want to allow name edit
      
      await supabase.from('workspaces').update({
        name: configWorkspace.name, // In case it was edited in local state
        municipio: muni || configWorkspace.municipio,
        estado: estado || configWorkspace.estado
      }).eq('id', configWorkspace.id);
      
      toast.success('Configuración y tabla maestra actualizadas');
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (selectedState) {
      loadMunicipalities(selectedState);
    } else {
      setMunicipalities([]);
    }
    setSelectedMunicipality('');
    setCustomId(selectedState ? selectedState + '-' : '');
  }, [selectedState]);

  useEffect(() => {
    if (selectedMunicipality) {
      setCustomId(selectedMunicipality);
    }
  }, [selectedMunicipality]);

  const loadMunicipalities = async (stateId: string) => {
    const { data } = await supabase
      .from('municipalities')
      .select('*')
      .eq('state_id', stateId)
      .order('name');
    if (data) setMunicipalities(data);
  };

  const handleCreate = async () => {
    if (!newWorkspaceName.trim() || !selectedMunicipality || !customId.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const stateName = states.find((s: any) => s.id === selectedState)?.name;
    const muniName = municipalities.find((m: any) => m.id === selectedMunicipality)?.name;

    setIsCreating(true);
    const success = await createCloudWorkspace(
      newWorkspaceName,
      stateName || selectedState,
      muniName || selectedMunicipality,
      customId.toUpperCase().trim()
    );

    if (success) {
      setNewWorkspaceName('');
      setCustomId('');
      setIsOpen(false);
    }
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!wsToDelete) return;
    await deleteCloudWorkspace(wsToDelete.id, wsToDelete.name);
    setWsToDelete(null);
  };

  const toggleUserAccess = async (user: any, workspace_id: string) => {
    setIsUpdatingUser(user.id);
    const currentAllowed = user.allowed_workspaces || [];
    const isAdding = !currentAllowed.includes(workspace_id);
    const newAllowed = isAdding
      ? [...currentAllowed, workspace_id]
      : currentAllowed.filter((id: string) => id !== workspace_id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ allowed_workspaces: newAllowed })
        .eq('id', user.id);
      if (error) throw error;
      toast.success(isAdding ? `Acceso concedido a ${user.full_name}` : `Acceso revocado a ${user.full_name}`);
      setAllUsers((prev: any[]) => prev.map((u: any) => u.id === user.id ? { ...u, allowed_workspaces: newAllowed } : u));
    } catch (err: any) {
      toast.error('Error al actualizar acceso: ' + err.message);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const filtered = workspaces.filter((ws: any) =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    ws.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto flex flex-col gap-8">

        {/* CABECERA (ESTÁNDAR APP) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Áreas de Trabajo</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Administra la infraestructura cloud y autoriza personal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-sm gap-2">
                  <Plus className="h-4 w-4" /> Nueva Área
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl border-muted/60 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Crear área en la Nube</DialogTitle>
                  <DialogDescription>
                    Define la ubicación y el identificador único para el área de trabajo.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
                        Estado
                      </label>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="h-10 rounded-xl shadow-sm border-muted/60">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-muted/60 shadow-xl z-[100]">
                          {states.map((s: any) => (
                            <SelectItem key={s.id} value={s.id} className="rounded-lg">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
                        Municipio
                      </label>
                      <Select
                        value={selectedMunicipality}
                        onValueChange={setSelectedMunicipality}
                        disabled={!selectedState}
                      >
                        <SelectTrigger className="h-10 rounded-xl shadow-sm border-muted/60">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] rounded-xl border-muted/60 shadow-xl z-[100]">
                          {municipalities.map((m: any) => (
                            <SelectItem key={m.id} value={m.id} className="rounded-lg">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-muted/30">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
                        Nombre del Área (Visible)
                      </label>
                      <Input
                        placeholder="Ej: Guanta, Anzoátegui"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="h-10 rounded-xl shadow-sm border-muted/60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
                        ID del Área (Automático)
                      </label>
                      <Input
                        value={customId}
                        disabled
                        className="h-10 rounded-xl bg-muted/50 font-mono font-bold text-primary border-muted/40"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !newWorkspaceName.trim() || !selectedMunicipality || !customId.trim()}
                    className="font-bold shadow-sm"
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear área de trabajo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* BUSCADOR Y CONTROLES */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ID..."
              className="pl-10 h-10 rounded-lg bg-background border-muted/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="h-8 px-4 rounded-lg border-muted/60 bg-muted/20 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
            {filtered.length} Áreas de Trabajo
          </Badge>
        </div>

        {/* GRILLA DE ÁREAS */}
        {fetchLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">Sincronizando Nube...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((ws: any) => (
              <Card key={ws.id} className="group shadow-md border-primary/10 hover:border-primary/30 overflow-hidden relative bg-card/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                <CardHeader className="py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                        <Database className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold tracking-tight capitalize">{ws.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-2 md:group-hover:translate-x-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-background/50 backdrop-blur-md border shadow-sm hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          setConfigWorkspace(ws);
                          setIsConfigOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setWsToDelete({ id: ws.id, name: ws.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">ID Área</p>
                      <p className="font-mono text-[11px] font-bold text-primary/80">{ws.id}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">Ubicación</p>
                      <p className="text-[11px] font-bold truncate">{ws.estado} • {ws.municipio}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {allUsers.filter((u: any) => u.allowed_workspaces?.includes(ws.id)).slice(0, 4).map((u: any) => (
                        <div key={u.id} className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-black overflow-hidden shadow-sm ring-1 ring-primary/5">
                          {u.full_name?.charAt(0)}
                        </div>
                      ))}
                      {allUsers.filter((u: any) => u.allowed_workspaces?.includes(ws.id)).length > 4 && (
                        <div className="h-7 w-7 rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black shadow-sm">
                          +{allUsers.filter((u: any) => u.allowed_workspaces?.includes(ws.id)).length - 4}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="h-5 px-2 text-[9px] font-bold bg-primary/5 text-primary border-none rounded-md">
                      {allUsers.filter((u: any) => u.allowed_workspaces?.includes(ws.id)).length} Personal
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5">
                <Layers className="h-16 w-16 text-muted/20 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-muted-foreground">No se encontraron áreas de trabajo</h3>
                <p className="text-sm text-muted-foreground/60 mt-2">Prueba ajustando tu búsqueda o crea una nueva área.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DIÁLOGO DE CONFIGURACIÓN DE ÁREA VIRTUAL (PATRÓN APP) */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl border-muted/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Configurar Área de Trabajo</DialogTitle>
            <DialogDescription className="text-sm">Gestión de accesos y personal autorizado.</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 p-1 bg-muted/50 border border-muted/60">
              <TabsTrigger value="personal" className="rounded-lg font-bold text-xs uppercase tracking-wider">
                Personal Autorizado
              </TabsTrigger>
              <TabsTrigger value="ajustes" className="rounded-lg font-bold text-xs uppercase tracking-wider">
                Ajustes Generales
              </TabsTrigger>
            </TabsList>

            <div className="py-6 min-h-[400px]">
              <TabsContent value="personal" className="space-y-6 mt-0">
                {/* Listado de Usuarios */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] uppercase font-bold text-muted-foreground/70">
                      Gestionar Accesos
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-bold">
                      {allUsers.filter(u => u.allowed_workspaces?.includes(configWorkspace?.id)).length} Autorizados
                    </Badge>
                  </div>

                  <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {allUsers.map((user: any) => {
                      const hasAccess = user.allowed_workspaces?.includes(configWorkspace?.id);
                      const isLoading = isUpdatingUser === user.id;

                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                            hasAccess
                              ? "bg-primary/5 border-primary/20 shadow-sm"
                              : "bg-background border-muted/60"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded flex items-center justify-center transition-colors shadow-sm border",
                              hasAccess ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              {user.is_admin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold leading-none truncate">{user.full_name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">{user.email}</p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={hasAccess ? "destructive" : "secondary"}
                            className="h-8 w-8 rounded-lg p-0 shrink-0"
                            disabled={isLoading || user.is_admin}
                            onClick={() => toggleUserAccess(user, configWorkspace.id)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : hasAccess ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ajustes" className="space-y-0 mt-0">
                {isLoadingSettings ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Cargando Ajustes...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[50vh]" type="always">
                    <div className="p-1 space-y-8 pb-10">
                      {/* Valores Institucionales */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold tracking-tight">Valores Institucionales</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Define los valores que se utilizarán automáticamente en los reportes de esta área.
                          </p>
                        </div>
                        
                        <AjustesGeneralesForm
                          values={Object.fromEntries(Object.entries(wsDefinitions).map(([k, v]) => [k, v.value]))}
                          onChange={(key, val) => setWsDefinitions(prev => ({
                            ...prev,
                            [key]: { ...(prev[key] || { label: key, type: 'predefined', section_id: 'default' }), value: val }
                          }))}
                          definitions={wsDefinitions}
                          fieldKeys={['Municipio', 'Estado', 'REDAN', 'ZOEDAN']}
                          columns={2}
                        />
                      </div>

                      <Separator />

                      {/* Personal que Reporta */}
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Personal que Reporta</h4>
                          <p className="text-xs text-muted-foreground">
                            Gestiona los cargos que se usarán para rellenar la etiqueta [Reporta] en esta área.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2 max-w-sm">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Añadir Cargo
                            </Label>
                            <Select onValueChange={(roleName) => {
                              if (roleName && !wsConfig.reportarole_ids?.includes(roleName)) {
                                setWsConfig((prev: any) => ({
                                  ...prev,
                                  reportarole_ids: [...(prev.reportarole_ids || []), roleName]
                                }));
                              }
                            }}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecciona un cargo..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] z-[200]">
                                {allRoles.filter(r => !wsConfig.reportarole_ids?.includes(r.name)).map(role => (
                                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Cargos Seleccionados (Prioridad)
                            </Label>
                            <div className="space-y-2 rounded-xl border border-dashed p-3 bg-muted/5 min-h-[100px]">
                              {wsConfig.reportarole_ids && wsConfig.reportarole_ids.length > 0 ? (
                                wsConfig.reportarole_ids.map((roleName: string, index: number) => (
                                  <div key={roleName} className="flex items-center justify-between p-2 rounded-lg bg-background border shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                        {index + 1}
                                      </span>
                                      <span className="text-xs font-medium">{roleName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={index === 0}
                                        onClick={() => {
                                          const newRoles = [...wsConfig.reportarole_ids];
                                          [newRoles[index], newRoles[index - 1]] = [newRoles[index - 1], newRoles[index]];
                                          setWsConfig((prev: any) => ({ ...prev, reportarole_ids: newRoles }));
                                        }}
                                      >
                                        <ChevronUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={index === wsConfig.reportarole_ids.length - 1}
                                        onClick={() => {
                                          const newRoles = [...wsConfig.reportarole_ids];
                                          [newRoles[index], newRoles[index + 1]] = [newRoles[index + 1], newRoles[index]];
                                          setWsConfig((prev: any) => ({ ...prev, reportarole_ids: newRoles }));
                                        }}
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                      <Separator orientation="vertical" className="h-4 mx-1" />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          setWsConfig((prev: any) => ({
                                            ...prev,
                                            reportarole_ids: prev.reportarole_ids.filter((r: string) => r !== roleName)
                                          }));
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-8 text-center text-xs text-muted-foreground italic">
                                  No hay cargos seleccionados.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4 mt-2">
            <Button
              variant="outline"
              className="font-bold rounded-xl"
              onClick={() => setIsConfigOpen(false)}
            >
              Cerrar
            </Button>
            {activeTab === 'ajustes' && (
              <Button
                className="font-bold rounded-xl gap-2 shadow-lg shadow-primary/20"
                onClick={handleSaveSettings}
                disabled={isSavingSettings || isLoadingSettings}
              >
                {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Ajustes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ELIMINACIÓN (PREMIUM) */}
      <AlertDialog open={!!wsToDelete} onOpenChange={(open) => !open && setWsToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-muted/60 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              ¿Eliminar Área de Trabajo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm pt-2">
              Estás a punto de eliminar <span className="font-bold text-foreground">"{wsToDelete?.name}"</span>. 
              Esta acción es irreversible y eliminará toda la configuración asociada en la nube.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold border-muted/60">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



