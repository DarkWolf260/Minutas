import React, { useState } from 'react';
import { useAdminUsers, AdminUser } from '@/hooks/use-admin-users';
import {
  Search,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Filter,
  ChevronLeft,
  MoreVertical,
  RefreshCw,
  User,
  Mail,
  Fingerprint,
  Clock,
  ExternalLink,
  Shield,
  Loader2,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { users, loading, toggleAdmin, toggleApproval, deleteUser, refresh } = useAdminUsers();
  
  // States
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Edit Name states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!editingUserId) return;
    const trimmed = editingUserName.trim();
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', editingUserId);

      if (error) throw error;

      toast.success('Nombre de usuario actualizado con éxito');
      setIsEditOpen(false);
      setEditingUserId(null);
      setEditingUserName('');
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar el nombre del usuario');
    } finally {
      setIsSavingName(false);
    }
  };

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, approved, pending
  const [filterRole, setFilterRole] = useState<string>('all'); // all, admin, standard

  // Filtering logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (u.cedula_number || '').includes(search);

    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'approved' ? u.is_approved : !u.is_approved;

    const matchesRole = 
      filterRole === 'all' ? true :
      filterRole === 'admin' ? u.is_admin : !u.is_admin;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .in('id', selectedUserIds);

      if (error) throw error;
      toast.success(`Se aprobaron ${selectedUserIds.length} cuentas`);
      setSelectedUserIds([]);
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al aprobar las cuentas seleccionadas');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDisapprove = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .in('id', selectedUserIds);

      if (error) throw error;
      toast.success(`Se revocó la aprobación de ${selectedUserIds.length} cuentas`);
      setSelectedUserIds([]);
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al revocar las cuentas seleccionadas');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente estas ${selectedUserIds.length} cuentas de usuario?`)) return;
    
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', selectedUserIds);

      if (error) throw error;
      toast.success(`Se eliminaron ${selectedUserIds.length} perfiles`);
      setSelectedUserIds([]);
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al eliminar las cuentas seleccionadas');
    } finally {
      setBulkLoading(false);
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto flex flex-col gap-8 pb-32">
        
        {/* CABECERA (ESTÁNDAR APP) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Controla accesos, aprueba nuevas cuentas y asigna roles administrativos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                className="pl-10 h-10 rounded-lg bg-background border-muted/60 focus:ring-3 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg shrink-0 border-muted/60 hover:bg-muted"
              onClick={() => refresh()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>

            <Badge variant="outline" className="h-10 px-4 rounded-lg border-muted/60 bg-muted/20 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              {filteredUsers.length} Usuarios
            </Badge>
          </div>
        </div>

        {/* Advanced Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-muted-foreground/75 tracking-wider">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filtros:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedUserIds([]); // Clear selection
            }}
            className="h-9 px-3 rounded-lg border border-muted/60 bg-background text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los Estados</option>
            <option value="approved">Aprobados</option>
            <option value="pending">Pendientes de Aprobación</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setSelectedUserIds([]); // Clear selection
            }}
            className="h-9 px-3 rounded-lg border border-muted/60 bg-background text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="standard">Personal Estándar</option>
          </select>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2Spinner />
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">Cargando Personal...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5">
            <User className="h-16 w-16 text-muted/20 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-muted-foreground">Sin resultados</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">Prueba cambiando tu búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card/60 backdrop-blur-md overflow-hidden shadow-md border-primary/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30 uppercase text-[10px] font-black tracking-widest text-muted-foreground/70 select-none">
                    <th className="px-6 py-4 w-12 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos los usuarios"
                      />
                    </th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Cédula</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Admin</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={cn(
                      "hover:bg-muted/20 transition-colors group",
                      selectedUserIds.includes(user.id) && "bg-primary/5 hover:bg-primary/5"
                    )}>
                      <td className="px-6 py-4 text-center">
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                          aria-label={`Seleccionar usuario ${user.full_name}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground tracking-tight">{user.full_name || 'Sin Nombre'}</span>
                          <span className="text-xs text-muted-foreground">{user.email || 'Sin Email'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[11px] bg-muted/50 rounded-lg border-muted px-2">
                          {user.cedula_type}-{user.cedula_number}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleApproval(user.id)}
                            className="flex items-center gap-2 group/btn"
                          >
                            {user.is_approved ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 transition-all rounded-lg flex items-center gap-1.5 px-2">
                                <CheckCircle2 className="h-3 w-3" />
                                Aprobado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all rounded-lg flex items-center gap-1.5 px-2 animate-pulse">
                                <ShieldAlert className="h-3 w-3" />
                                Pendiente
                              </Badge>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Switch
                            checked={user.is_admin}
                            onCheckedChange={() => toggleAdmin(user.id)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-48 shadow-xl border-muted/60">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest px-3 py-2">
                              Opciones de Usuario
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer py-2.5"
                              onClick={() => setSelectedUser(user)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer py-2.5"
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditingUserName(user.full_name || '');
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar Nombre
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer py-2.5 text-red-500 focus:text-red-500 focus:bg-red-50"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary border border-primary/20 text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Acciones en lote</span>
            <span className="text-sm font-black whitespace-nowrap">{selectedUserIds.length} seleccionados</span>
          </div>
          
          <div className="flex gap-2 items-center">
            {bulkLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 rounded-lg font-bold bg-white text-primary hover:bg-white/90 active:scale-95 transition-all"
                  onClick={handleBulkApprove}
                >
                  Aprobar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 rounded-lg font-bold bg-white text-primary hover:bg-white/90 active:scale-95 transition-all"
                  onClick={handleBulkDisapprove}
                >
                  Revocar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 rounded-lg font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Eliminar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-lg text-white hover:bg-white/10"
                  onClick={() => setSelectedUserIds([])}
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-muted/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Detalles del Usuario
            </DialogTitle>
            <DialogDescription>
              Información completa del perfil registrado.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-muted/50">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">
                    {selectedUser.full_name || 'Sin Nombre'}
                  </h3>
                  <Badge variant={selectedUser.is_admin ? "default" : "secondary"} className="mt-1 text-[10px] uppercase font-black tracking-widest">
                    {selectedUser.is_admin ? 'Administrador' : 'Usuario Estándar'}
                  </Badge>
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Correo Electrónico</p>
                    <p className="text-sm font-medium">{selectedUser.email || 'No disponible'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Documento de Identidad</p>
                    <p className="text-sm font-medium">{selectedUser.cedula_type}-{selectedUser.cedula_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fecha de Registro</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Estado de Cuenta</p>
                    <div className="mt-1">
                      {selectedUser.is_approved ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-lg">
                          Cuenta Verificada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 rounded-lg">
                          Pendiente de Aprobación
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  variant="secondary"
                  className="rounded-xl font-bold"
                  onClick={() => setSelectedUser(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-muted/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Editar Nombre de Usuario
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre completo del perfil seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
                Nombre Completo
              </label>
              <Input
                value={editingUserName}
                onChange={(e) => setEditingUserName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="h-10 rounded-lg bg-background border-muted/60 focus:ring-3 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              disabled={isSavingName}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveName}
              disabled={isSavingName || !editingUserName.trim()}
              className="font-bold rounded-lg shadow-sm"
            >
              {isSavingName ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
  );
}
