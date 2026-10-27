import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/configuracion';
import { Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBarActionPortal } from '@/components/layout/app-bar-action-portal';

export default function ProfilePage() {
  const { profile, saveProfile, isLoaded } = useProfile();
  const [form_data, setform_data] = useState({
    name: '',
    cedula: '',
    rank: '',
    department: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [profile.avatarUrl]);

  useEffect(() => {
    if (isLoaded) {
      setform_data({
        name: profile.name || '',
        cedula: profile.cedula || '',
        rank: profile.rank || '',
        department: profile.department || '',
      });
    }
  }, [profile, isLoaded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setform_data((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveProfile(form_data);
      toast('Perfil guardado', {
        description: 'Tu información local ha sido actualizada exitosamente.',
      });
    } catch (error) {
      toast.error('Error al guardar', {
        description: 'Ocurrió un error al intentar guardar tu perfil.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
        <AppBarActionPortal>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </AppBarActionPortal>
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Generate initials for the avatar placeholder
  const initials = getInitials(form_data.name || 'U');

  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      <AppBarActionPortal>
        <Button
          form="profile-form"
          type="submit"
          disabled={isSaving}
          size="sm"
          className="gap-2 shrink-0 shadow-2xs font-semibold h-9 rounded-xl"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar Perfil'}</span>
          <span className="sm:hidden">{isSaving ? '...' : 'Guardar'}</span>
        </Button>
      </AppBarActionPortal>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          <Card className="shadow-xs border-muted/60 overflow-hidden">
            {/* Cover / Banner background element */}
            <div className="h-28 sm:h-32 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b" />

            <CardContent className="pt-0 relative px-4 sm:px-8 pb-6 sm:pb-8">
              {/* Avatar floating over banner */}
              <div className="flex justify-between items-end mb-6 -mt-12">
                <div className="flex items-end gap-5 rounded-full ring-4 ring-background bg-background">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl sm:text-4xl font-semibold text-primary overflow-hidden shadow-inner border border-primary/20">
                    {profile.avatarUrl && !avatarError ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                </div>
              </div>

              <form id="profile-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Nombre y Apellidos
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ej. Juan Pérez"
                        value={form_data.name}
                        onChange={handleChange}
                        className="pl-10 h-10 rounded-xl bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cedula" className="text-sm font-semibold">
                      Cédula de Identidad
                    </Label>
                    <Input
                      id="cedula"
                      name="cedula"
                      placeholder="Ej. V-12345678"
                      value={form_data.cedula}
                      onChange={handleChange}
                      className="h-10 rounded-xl bg-muted/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rank" className="text-sm font-semibold">
                      Cargo o Jerarquía
                    </Label>
                    <Input
                      id="rank"
                      name="rank"
                      placeholder="Ej. Jefe de Servicio, Inspector..."
                      value={form_data.rank}
                      onChange={handleChange}
                      className="h-10 rounded-xl bg-muted/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold">
                      Departamento / Área
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="Ej. Operaciones, Investigaciones..."
                      value={form_data.department}
                      onChange={handleChange}
                      className="h-10 rounded-xl bg-muted/20"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
