'use client';

import { useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Address } from '@/types';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-muted/50 shadow-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2 bg-muted/5 border-b border-muted/20">
          <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            {address ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Define los detalles geográficos y administrativos del punto de interés.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[85vh]" autoComplete="off">
            <ScrollArea className="flex-1 p-6 pt-4">
              <div className="space-y-8 pb-4">
                {/* Sección 1: Identificación */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-4 rounded-full bg-primary" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Identificación del Lugar</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nombre o Referencia Principal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Liceo Manuel Farías Luces" className="bg-muted/10 border-muted/40 focus:bg-background transition-all h-10" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección 2: Dirección Física */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-4 rounded-full bg-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Dirección Física</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Avenida / Calle</FormLabel>
                          <FormControl>
                            <Input placeholder="Opcional" className="bg-muted/10 border-muted/40 h-10" {...field} />
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
                            <Input placeholder="Opcional" className="bg-muted/10 border-muted/40 h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección 3: Ubicación Administrativa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-4 rounded-full bg-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ubicación Administrativa</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="municipality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Municipio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Simón Bolívar" className="bg-muted/10 border-muted/40 h-10" {...field} />
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
                            <Input placeholder="Ej: El Carmen" className="bg-muted/10 border-muted/40 h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Sector / Barrio</FormLabel>
                          <FormControl>
                            <Input placeholder="Opcional" className="bg-muted/10 border-muted/40 h-10" {...field} />
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
                          <FormLabel className="text-xs font-semibold">Cuadrante de Paz</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: #14" className="bg-muted/10 border-muted/40 h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección 4: Geoperimetraje (Coordenadas) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-4 rounded-full bg-emerald-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Coordenadas Geográficas</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Latitud</FormLabel>
                          <FormControl>
                            <Input placeholder="10.123456" className="bg-emerald-500/5 border-emerald-500/20 font-mono text-xs h-10" {...field} />
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
                          <FormLabel className="text-xs font-semibold">Longitud</FormLabel>
                          <FormControl>
                            <Input placeholder="-64.654321" className="bg-emerald-500/5 border-emerald-500/20 font-mono text-xs h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección 5: Detalles Extras */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-4 rounded-full bg-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Detalles Adicionales</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Observaciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ej: Portón negro, frente a la plaza..." 
                            className="bg-muted/10 border-muted/40 focus:bg-background transition-all min-h-[80px]" 
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
            <DialogFooter className="p-6 bg-muted/5 border-t border-muted-20 flex sm:justify-between items-center gap-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 px-8">
                {address ? 'Guardar Cambios' : 'Registrar Ubicación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
