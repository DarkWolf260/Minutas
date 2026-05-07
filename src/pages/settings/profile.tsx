import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';
import { Save, User, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProfilePage() {
  const { profile, saveProfile, isLoaded } = useProfile();
  const [form_data, setform_data] = useState({
    name: '',
    cedula: '',
    rank: '',
    department: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

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
      // Optionally navigate back after saving 
      // navigate('/settings');
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  // Generate initials for the avatar placeholder
  const initials = getInitials(form_data.name || 'U');

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32 sm:pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with back button */}
      <div className="flex items-center gap-4">
        <Link to="/settings" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil de Usuario</h1>
          <p className="text-muted-foreground mt-1">
            Información personal que se utilizará de firma en los reportes locales.
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-muted/50 overflow-hidden">
        {/* Cover / Banner background element */}
        <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b" />
        
        <CardContent className="pt-0 relative px-6 sm:px-8 pb-8">
          {/* Avatar floating over banner */}
          <div className="flex justify-between items-end mb-8 -mt-12">
            <div className="flex items-end gap-5 rounded-full ring-4 ring-background bg-background">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-semibold text-primary overflow-hidden shadow-inner">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            {/* Future placement for avatar upload button 
            <Button size="sm" variant="outline" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cambiar Foto</span>
            </Button>
             */}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre y Apellidos</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Ej. Juan Pérez" 
                    value={form_data.name}
                    onChange={handleChange}
                    className="pl-10 bg-muted/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula de Identidad</Label>
                <Input 
                  id="cedula" 
                  name="cedula" 
                  placeholder="Ej. V-12345678" 
                  value={form_data.cedula}
                  onChange={handleChange}
                  className="bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank">Cargo o Jerarquía</Label>
                <Input 
                  id="rank" 
                  name="rank" 
                  placeholder="Ej. Jefe de Servicio, Inspector..." 
                  value={form_data.rank}
                  onChange={handleChange}
                  className="bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento / Área</Label>
                <Input 
                  id="department" 
                  name="department" 
                  placeholder="Ej. Operaciones, Investigaciones..." 
                  value={form_data.department}
                  onChange={handleChange}
                  className="bg-muted/20"
                />
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2 shadow-md">
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Perfil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  );
}

