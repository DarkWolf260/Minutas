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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{address ? 'Editar Dirección' : 'Añadir Nueva Dirección'}</DialogTitle>
          <DialogDescription>
            Rellena los detalles de la dirección. Las coordenadas son opcionales.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 pr-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre o Lugar Específico</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Liceo Manuel Farías Luces" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Av. Principal" {...field} />
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
                      <FormLabel>Nro. de Casa (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 123-A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Simón Bolívar" {...field} />
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
                      <FormLabel>Parroquia</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: San Cristóbal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Casco Central" {...field} />
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
                    <FormLabel>Cuadrante de Paz</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: #14 (PoliBolívar)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitud (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 10.128376" {...field} />
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
                      <FormLabel>Longitud (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: -64.693620" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles Adicionales (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: Portón negro, casa de dos pisos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Guardar Dirección</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
