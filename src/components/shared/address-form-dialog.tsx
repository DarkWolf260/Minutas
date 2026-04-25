'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Address } from '@/lib/types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  MapPin,
  Home,
  Building2,
  Shield,
  Globe,
  FileText,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  address: Address | null;
  initialCoords?: { lat: string; lng: string } | null;
}

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  municipality: z.string().min(1, { message: 'El municipio es requerido.' }),
  parish: z.string().min(1, { message: 'La parroquia es requerida.' }),
  sector: z.string().optional(),
  peaceQuadrant: z.string().min(1, { message: 'El cuadrante de paz es requerido.' }),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  details: z.string().optional(),
});

export function AddressFormDialog({
  isOpen,
  onClose,
  onSave,
  address,
  initialCoords,
}: AddressFormDialogProps) {
  const isMobile = useIsMobile();
  const form = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      street: '',
      houseNumber: '',
      municipality: '',
      parish: '',
      sector: '',
      peaceQuadrant: '',
      latitude: '',
      longitude: '',
      details: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (address) {
        form.reset(address);
      } else {
        form.reset({
          id: undefined,
          name: '',
          street: '',
          houseNumber: '',
          municipality: '',
          parish: '',
          sector: '',
          peaceQuadrant: '',
          latitude: initialCoords?.lat || '',
          longitude: initialCoords?.lng || '',
          details: '',
        });
      }
    }
  }, [address, initialCoords, form, isOpen]);

  const onSubmit = (data: Address) => {
    onSave(data);
  };

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden" autoComplete="off">
        <ScrollArea className={cn(
          "flex-1",
          isMobile ? "px-6 py-4" : "p-6"
        )}>
          <div className="space-y-8 pb-10">
            {/* Sección 1: Identificación */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Identificación del Lugar</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Datos principales</p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Nombre o Referencia</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Liceo Manuel Farías Luces"
                        className="bg-background border-2 border-muted/50 focus:border-primary/50 transition-all h-10 rounded-xl px-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección 2: Dirección Física */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Home className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Dirección Física</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Vialidad y residencia</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Avenida / Calle</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de vía" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="houseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Nro. Casa / Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 14 o S/N" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Ubicación Administrativa */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">División Política</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Administración territorial</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Municipio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Simón Bolívar" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Parroquia</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: El Carmen" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Sector / Barrio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Casco Central" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peaceQuadrant"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-3 w-3 text-primary" />
                        <FormLabel className="text-xs font-semibold m-0">Cuadrante de Paz</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="Ej: 14" className="bg-background border-2 border-muted/30 h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 4: Coordenadas */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Geoposicionamiento</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Coordenadas exactas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-emerald-600/70">Latitud</FormLabel>
                      <FormControl>
                        <Input placeholder="10.123456" className="bg-background border-2 border-emerald-500/30 font-mono text-sm h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-emerald-600/70">Longitud</FormLabel>
                      <FormControl>
                        <Input placeholder="-64.654321" className="bg-background border-2 border-emerald-500/30 font-mono text-sm h-10 rounded-xl px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 5: Observaciones */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Observaciones</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Detalles adicionales</p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Portón negro, frente a la plaza Bolívar, punto de referencia..."
                        className="bg-background border-2 border-muted/50 focus:bg-background focus:border-primary/50 transition-all min-h-[100px] rounded-xl px-4 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>

        <div className={cn(
          "bg-muted/5 border-t border-muted/20 flex items-center gap-4 shrink-0",
          isMobile ? "p-4 pb-8" : "p-6 sm:justify-between"
        )}>
          {isMobile ? (
            <Button type="submit" className="w-full h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 rounded-xl font-bold gap-2">
              <Save className="h-5 w-5" />
              {address ? 'Guardar Cambios' : 'Registrar Ubicación'}
            </Button>
          ) : (
            <>
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="h-10 text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 px-8 font-bold gap-2">
                <Save className="h-4 w-4" />
                {address ? 'Guardar Cambios' : 'Registrar'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );

  const title = address ? 'Editar Ubicación' : 'Nueva Ubicación';
  const description = 'Define los detalles geográficos y administrativos del punto de interés.';

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[92vh] p-0 rounded-t-[2.5rem] overflow-hidden border-none shadow-2xl">
          <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mt-3 mb-1" />
          <SheetHeader className="px-6 py-4 text-left border-b border-muted/10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
                <SheetDescription className="text-xs">{description}</SheetDescription>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 h-10 w-10">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden h-full">
            <FormContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-muted/50 shadow-2xl overflow-hidden p-0 rounded-3xl">
        <DialogHeader className="p-8 pb-4 bg-muted/5 border-b border-muted/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {description}
              </DialogDescription>
            </div>
            <div className={cn(
              "p-3 rounded-2xl",
              address ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
            )}>
              {address ? <Building2 className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[75vh]">
          <FormContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
