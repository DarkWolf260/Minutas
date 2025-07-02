'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useGuards } from '@/hooks/use-guards';
import { OrdenDelDiaForm } from '@/components/orden-del-dia';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdenDelDiaPage() {
    const { guards, isLoaded } = useGuards();
    const [selectedGuardId, setSelectedGuardId] = useState<string>('');

    const selectedGuard = guards.find(g => g.id === selectedGuardId);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>Generador de Orden del Día</CardTitle>
                    <CardDescription>
                        Selecciona una guardia y completa el personal para generar el reporte.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isLoaded ? (
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2 max-w-xs">
                                <Label htmlFor="guard-select">Seleccionar Guardia</Label>
                                <Select value={selectedGuardId} onValueChange={setSelectedGuardId}>
                                    <SelectTrigger id="guard-select">
                                        <SelectValue placeholder="Selecciona una guardia..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {guards.map((guard) => (
                                            <SelectItem key={guard.id} value={guard.id}>
                                                Guardia "{guard.id}"
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {selectedGuardId ? (
                            <OrdenDelDiaForm selectedGuard={selectedGuardId} initialData={selectedGuard?.staff} />
                            ) : (
                                <div className="text-center text-muted-foreground pt-10">
                                    Por favor, selecciona una guardia para empezar.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
