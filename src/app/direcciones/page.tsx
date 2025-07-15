
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css'; // Import leaflet css
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit, MapPin, NotebookPen, Eye, ClipboardCopy, Check } from 'lucide-react';
import { useAddresses } from '@/hooks/use-addresses';
import type { Address } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressFormDialog } from '@/components/address-form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const AddressMap = dynamic(() => import('@/components/address-map').then(mod => mod.AddressMap), { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />
});

export default function DireccionesPage() {
    const { addresses, addAddress, updateAddress, removeAddress, isLoaded } = useAddresses();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [municipalityFilter, setMunicipalityFilter] = useState('all');
    const [selectedForMap, setSelectedForMap] = useState<Address | null>(null);
    const [initialCoords, setInitialCoords] = useState<{ lat: string; lng: string } | null>(null);
    const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && addresses.length > 0 && !selectedForMap) {
            const firstWithCoords = addresses.find(addr => !!addr.latitude && !!addr.longitude);
            if (firstWithCoords) {
                setSelectedForMap(firstWithCoords);
            }
        }
    }, [isLoaded, addresses, selectedForMap]);

    const handleOpenForm = (address: Address | null = null) => {
        setEditingAddress(address);
        setInitialCoords(null);
        setIsFormOpen(true);
    };

    const handleMapClick = (coords: { lat: number; lng: number }) => {
        setEditingAddress(null);
        setInitialCoords({ lat: coords.lat.toFixed(6), lng: coords.lng.toFixed(6) });
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingAddress(null);
        setInitialCoords(null);
    };

    const handleSaveAddress = (address: Address) => {
        if (editingAddress) {
            updateAddress(address);
             if (selectedForMap?.id === address.id) {
                setSelectedForMap(address);
            }
        } else {
            const newAddress = { ...address, id: `address_${Date.now()}` };
            addAddress(newAddress);
            if(newAddress.latitude && newAddress.longitude) {
                setSelectedForMap(newAddress);
            }
        }
        handleCloseForm();
    };

    const handleConfirmDelete = () => {
        if (addressToDelete) {
            removeAddress(addressToDelete.id);
            if (selectedForMap?.id === addressToDelete.id) {
                const nextAddress = addresses.find(addr => addr.id !== addressToDelete.id && !!addr.latitude && !!addr.longitude) || null;
                setSelectedForMap(nextAddress);
            }
            setAddressToDelete(null);
        }
    };
    
    const handleCopyAddress = (address: Address, withCoords: boolean) => {
        const parts = [
            `Municipio ${address.municipality}`,
            `parroquia ${address.parish}`,
        ];

        if (address.sector) {
            parts.push(`sector ${address.sector}`);
        }
        
        const calle = [address.street, address.houseNumber].filter(Boolean).join(' ');
        if (calle) {
            parts.push(`calle ${calle}`);
        }
        
        parts.push(address.name);
        parts.push(`Cuadrante de Paz ${address.peaceQuadrant}`);
        
        let textToCopy = parts.join(', ');

        if (withCoords && address.latitude && address.longitude) {
            textToCopy += `\nCoordenadas: ${address.latitude}, ${address.longitude}`;
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedAddressId(address.id);
            setTimeout(() => setCopiedAddressId(null), 2000);
        });
    };

    const uniqueMunicipalities = useMemo(() => {
        const municipalities = new Set(addresses.map(addr => addr.municipality));
        return ['Todos los municipios', ...Array.from(municipalities).sort()];
    }, [addresses]);

    const filteredAddresses = useMemo(() => {
        return addresses
            .filter(addr => {
                if (municipalityFilter === 'all') return true;
                return addr.municipality === municipalityFilter;
            })
            .filter(addr => {
                if (!searchQuery) return true;
                const lowerCaseQuery = searchQuery.toLowerCase();
                return (
                    addr.name.toLowerCase().includes(lowerCaseQuery) ||
                    (addr.street && addr.street.toLowerCase().includes(lowerCaseQuery)) ||
                    (addr.houseNumber && addr.houseNumber.toLowerCase().includes(lowerCaseQuery)) ||
                    addr.parish.toLowerCase().includes(lowerCaseQuery) ||
                    (addr.sector && addr.sector.toLowerCase().includes(lowerCaseQuery)) ||
                    addr.peaceQuadrant.toLowerCase().includes(lowerCaseQuery)
                );
            });
    }, [addresses, searchQuery, municipalityFilter]);

    if (!isLoaded) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <Skeleton className="h-12 w-1/3 mb-4" />
                        <Skeleton className="h-10 w-full mb-6" />
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                     <div className="h-96 md:h-auto">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-4rem)]">
                    {/* Left Column */}
                    <Card className="shadow-lg flex flex-col h-full overflow-hidden">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <CardTitle>Gestor de Direcciones</CardTitle>
                                    <CardDescription>Añade, edita y visualiza direcciones.</CardDescription>
                                </div>
                                <Button onClick={() => handleOpenForm()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Dirección
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 min-h-0">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="search">Buscar</Label>
                                    <Input 
                                        id="search"
                                        placeholder="Por nombre, parroquia..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="municipality-filter">Filtrar por Municipio</Label>
                                    <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                                        <SelectTrigger id="municipality-filter">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueMunicipalities.map(mun => (
                                                <SelectItem key={mun} value={mun === 'Todos los municipios' ? 'all' : mun}>
                                                    {mun}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <ScrollArea className="flex-1 pr-1">
                            {filteredAddresses.length > 0 ? (
                                <div className="space-y-4 pr-3">
                                    {filteredAddresses.map(address => (
                                        <Card key={address.id} className={cn("flex flex-col transition-all", selectedForMap?.id === address.id && 'border-primary ring-1 ring-primary')}>
                                            <CardHeader>
                                                <CardTitle className="flex items-start gap-2 text-lg">
                                                    <NotebookPen className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                                                    <span className="flex-1">{address.name}</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm text-muted-foreground flex-grow space-y-3">
                                                {(address.street || address.houseNumber) && (
                                                    <div>
                                                        <p className="font-semibold text-card-foreground/90">Dirección Específica:</p>
                                                        <p>
                                                            {`${address.street || ''}${address.street && address.houseNumber ? ', ' : ''}${address.houseNumber || ''}`}
                                                        </p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-card-foreground/90">Ubicación:</p>
                                                    <p>
                                                        {[
                                                            `Mcp. ${address.municipality}`,
                                                            `Pqa. ${address.parish}`,
                                                            address.sector ? `Sctor. ${address.sector}` : null,
                                                            address.peaceQuadrant
                                                        ].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                                {(address.latitude && address.longitude) && (
                                                    <div>
                                                        <p className="font-semibold text-card-foreground/90">Coordenadas:</p>
                                                        <p className="font-mono text-xs">{address.latitude}, {address.longitude}</p>
                                                    </div>
                                                )}
                                                {address.details && (
                                                    <div>
                                                        <p className="font-semibold text-card-foreground/90">Detalles Adicionales:</p>
                                                        <p className="italic">"{address.details}"</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 bg-muted/50 p-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            {copiedAddressId === address.id ? (
                                                                <>
                                                                    <Check className="mr-2 h-4 w-4" /> Copiado
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar
                                                                </>
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleCopyAddress(address, false)}>
                                                            Sin coordenadas
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleCopyAddress(address, true)}
                                                            disabled={!address.latitude || !address.longitude}
                                                        >
                                                            Con coordenadas
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedForMap(address)} disabled={!address.latitude || !address.longitude}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenForm(address)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setAddressToDelete(address)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No se encontraron direcciones</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {searchQuery || municipalityFilter !== 'all' ? 'Prueba con otra búsqueda o filtro.' : 'Empieza añadiendo una nueva dirección.'}
                                    </p>
                                </div>
                            )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    {/* Right Column */}
                    <div className="h-96 md:h-full">
                        <AddressMap 
                            latitude={selectedForMap?.latitude}
                            longitude={selectedForMap?.longitude}
                            name={selectedForMap?.name}
                            onMapClick={handleMapClick}
                        />
                    </div>
                </div>
            </div>
            
            <AddressFormDialog
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSaveAddress}
                address={editingAddress}
                initialCoords={initialCoords}
            />

            <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La dirección "{addressToDelete?.name}" será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAddressToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
