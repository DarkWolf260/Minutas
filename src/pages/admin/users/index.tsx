import React, { useState } from 'react';
import { useAdminUsers, AdminUser } from '@/hooks/use-admin-users';
import {
  Search,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Fingerprint,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
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
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { users, loading, toggleAdmin, toggleApproval, deleteUser, refresh } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = users.filter(u =>
    (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (u.cedula_number || '').includes(search)
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="p-4 md:p-8 border-b bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-sm text-muted-foreground">
                {users.length} usuarios registrados en el sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                className="pl-10 h-10 rounded-xl bg-background/50 border-muted"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => refresh()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-progress w-full" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                Cargando Usuarios...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
                <p className="text-muted-foreground">No se encontraron usuarios que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card/30 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30 uppercase text-[10px] font-black tracking-widest text-muted-foreground/70">
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Cédula</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-center">Admin</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
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
        )}
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-muted/60 shadow-2xl">
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
    </div>
  );
}
