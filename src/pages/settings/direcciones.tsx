import { useState, useEffect, useMemo } from 'react';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css'; // Import leaflet css
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  PlusCircle,
  Trash2,
  Edit,
  MapPin,
  NotebookPen,
  Eye,
  ClipboardCopy,
  Check,
  Search,
  ExternalLink,
  Navigation,
  Globe,
  Filter,
  ChevronLeft,
} from 'lucide-react';
import { useAddresses } from '@/hooks/use-addresses';
import type { Address } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressFormDialog } from '@/components/shared/address-form-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { generateId } from '@/lib/utils/id';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AddressMap = lazy(() => import('@/components/shared/address-map').then((mod) => ({ default: mod.AddressMap })));

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
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    if (isLoaded && addresses.length > 0 && !selectedForMap) {
      const firstWithCoords = addresses.find((addr) => !!addr.latitude && !!addr.longitude);
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
      const newAddress = { ...address, id: generateId('address') };
      addAddress(newAddress);
      if (newAddress.latitude && newAddress.longitude) {
        setSelectedForMap(newAddress);
      }
    }
    handleCloseForm();
  };

  const handleConfirmDelete = () => {
    if (addressToDelete) {
      removeAddress(addressToDelete.id);
      if (selectedForMap?.id === addressToDelete.id) {
        const nextAddress =
          addresses.find(
            (addr) => addr.id !== addressToDelete.id && !!addr.latitude && !!addr.longitude
          ) || null;
        setSelectedForMap(nextAddress);
      }
      setAddressToDelete(null);
    }
  };

  const handleCopyAddress = (address: Address, withCoords: boolean) => {
    const parts = [`Municipio ${address.municipality}`, `parroquia ${address.parish}`];

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
    const municipalities = new Set(addresses.map((addr) => addr.municipality));
    return ['Todos los municipios', ...Array.from(municipalities).sort()];
  }, [addresses]);

  const filteredAddresses = useMemo(() => {
    return addresses
      .filter((addr) => {
        if (municipalityFilter === 'all') return true;
        return addr.municipality === municipalityFilter;
      })
      .filter((addr) => {
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
      <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8 pb-32 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      <div className="flex flex-col h-full w-full bg-background overflow-hidden flex-1 pb-32 sm:pb-0">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-6 flex flex-col flex-1 min-h-0">
          <div className="flex flex-col gap-4 mb-6 shrink-0 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
               <Link to="/settings">
                 <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                 </Button>
               </Link>
               <div className="flex flex-col">
                 <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">Gestor de Direcciones</h1>
                 <p className="text-muted-foreground mt-1 text-sm sm:text-base">Administración central de puntos de interés y ubicaciones.</p>
               </div>
            </div>
            <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all active:scale-95 gap-2 h-10">
              <PlusCircle className="h-4 w-4" />
              Nueva Dirección
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full space-y-4 min-h-0"
          >
            <div className="md:hidden w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/20 backdrop-blur-sm">
                <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Lista de Direcciones</TabsTrigger>
                <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ver en Mapa</TabsTrigger>
              </TabsList>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
            {/* Left Column - List */}
            <div
              className={cn(
                'm-0 h-full flex flex-col min-h-0',
                activeTab !== 'list' && 'hidden md:flex'
              )}
            >
              <Card className="shadow-lg flex flex-col h-full overflow-hidden bg-background/60 backdrop-blur-md border-muted/50">
                <CardHeader className="pb-4 border-b bg-muted/5 shrink-0 hidden md:block">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold">Base de Datos de Direcciones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 min-h-0 pt-0">
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1.5 flex-1">
                      <Label
                        htmlFor="search"
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1"
                      >
                        Búsqueda Inteligente
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="search"
                          name="address-search"
                          placeholder="Nombre, parroquia, sector..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 pl-10 bg-background/50 border-muted/40 focus:bg-background transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="municipality-filter"
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1"
                      >
                        Filtrar por Municipio
                      </Label>
                      <div className="relative">
                        <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                          <SelectTrigger id="municipality-filter" className="h-10 bg-background/50 border-muted/40 pl-10 focus:bg-background transition-all">
                            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-xl">
                            {uniqueMunicipalities.map((mun) => (
                              <SelectItem
                                key={mun}
                                value={mun === 'Todos los municipios' ? 'all' : mun}
                              >
                                {mun}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 -mx-2 px-2" type="always">
                    {filteredAddresses.length > 0 ? (
                      <div className="space-y-4 pb-4">
                        {filteredAddresses.map((address) => (
                          <Card
                            key={address.id}
                            className={cn(
                              'group flex flex-col transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md border-muted/60',
                              selectedForMap?.id === address.id
                                ? 'border-primary ring-1 ring-primary bg-primary/5'
                                : 'hover:border-primary/40'
                            )}
                          >
                            <CardHeader className="p-4 bg-muted/10 group-hover:bg-muted/20 transition-colors">
                              <div className="flex justify-between items-start gap-3">
                                <CardTitle className="flex items-start gap-2.5 text-base font-bold tracking-tight leading-snug">
                                  <MapPin className={cn(
                                    "h-4 w-4 mt-0.5 shrink-0 transition-colors",
                                    selectedForMap?.id === address.id ? "text-primary" : "text-muted-foreground/70"
                                  )} />
                                  <span className="flex-1">{address.name}</span>
                                </CardTitle>
                                {address.latitude && address.longitude && (
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] mt-1.5 shrink-0" title="Coordenadas disponibles" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 text-sm text-muted-foreground space-y-3">
                              {(address.street || address.houseNumber) && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Dirección</p>
                                  <p className="text-foreground/90 font-medium">
                                    {`${address.street || ''}${address.street && address.houseNumber ? ', ' : ''}${address.houseNumber || ''}`}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Ubicación</p>
                                  <p className="text-foreground/80 text-xs">
                                    {[
                                      `Mcp. ${address.municipality}`,
                                      `Pqa. ${address.parish}`,
                                      address.sector ? `Sctor. ${address.sector}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Cuadrante</p>
                                  <p className="text-foreground/80 text-xs">
                                    {address.peaceQuadrant}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap justify-end gap-2 bg-muted/10 p-2.5 border-t border-muted/30">
                              <div className="mr-auto flex items-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-background/80">
                                      {copiedAddressId === address.id ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                      ) : (
                                        <ClipboardCopy className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="backdrop-blur-xl">
                                    <DropdownMenuItem
                                      onClick={() => handleCopyAddress(address, false)}
                                      className="text-xs"
                                    >
                                      Copiar dirección texto
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCopyAddress(address, true)}
                                      disabled={!address.latitude || !address.longitude}
                                      className="text-xs"
                                    >
                                      Copiar con coordenadas
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {address.latitude && address.longitude && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 hover:bg-background/80 text-blue-500"
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`, '_blank')}
                                    title="Abrir en Google Maps"
                                  >
                                    <Globe className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>

                              <Button
                                variant={selectedForMap?.id === address.id ? "secondary" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 text-xs font-semibold px-3 transition-all",
                                  selectedForMap?.id === address.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                                )}
                                onClick={() => {
                                  setSelectedForMap(address);
                                  if (window.innerWidth < 768) setActiveTab('map');
                                }}
                                disabled={!address.latitude || !address.longitude}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-3 bg-background hover:bg-muted"
                                onClick={() => handleOpenForm(address)}
                              >
                                <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => setAddressToDelete(address)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Sin resultados</h3>
                        <p className="mt-1 text-sm text-muted-foreground px-4">
                          {searchQuery || municipalityFilter !== 'all'
                            ? 'Prueba con otra búsqueda o filtro.'
                            : 'Empieza añadiendo una nueva dirección.'}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Map */}
            <div
              className={cn(
                'm-0 h-full flex flex-col min-h-0',
                activeTab !== 'map' && 'hidden md:flex'
              )}
            >
              <div className="h-full rounded-xl overflow-hidden border shadow-inner relative group bg-muted/5">
                <AddressMap
                  latitude={selectedForMap?.latitude}
                  longitude={selectedForMap?.longitude}
                  name={selectedForMap?.name}
                  addresses={addresses}
                  onMapClick={handleMapClick}
                />
                
                {/* Floating Map Control Info */}
                <div className="absolute bottom-4 left-4 z-[40] max-w-[200px] pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-md p-2.5 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Mapa Interactivo</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Pulsa en cualquier punto para registrar una nueva ubicación.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>

      <AddressFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveAddress}
        address={editingAddress}
        initialCoords={initialCoords}
      />

      <AlertDialog
        open={!!addressToDelete}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La dirección "{addressToDelete?.name}" será
              eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddressToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

