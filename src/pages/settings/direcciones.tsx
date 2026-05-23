'use client';

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  PlusCircle,
  Trash2,
  Edit,
  MapPin,
  Eye,
  ClipboardCopy,
  Check,
  Search,
  Globe,
  Navigation,
  ChevronLeft,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDirecciones } from '@/hooks/use-direcciones';

const LOCATION_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  centro_asistencial: {
    label: 'Centro Asistencial',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  },
  residencia: {
    label: 'Residencia',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
  },
  lugar_publico: {
    label: 'Lugar Público',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  },
  institucion_comercio: {
    label: 'Institución / Comercio',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25',
  },
  sede: {
    label: 'Sede',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
  },
};

const AddressMap = lazy(() => import('@/components/shared/address-map').then((mod) => ({ default: mod.AddressMap })));

export default function DireccionesPage() {
  const hook = useDirecciones();
  const { estaCargado, tabActiva, setTabActiva, manejarAbrirForm } = hook;

  if (!estaCargado) {
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
    <div className="flex flex-col h-full w-full bg-background overflow-hidden flex-1 pb-32 sm:pb-0">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-6 flex flex-col flex-1 min-h-0">
        <CabeceraDirecciones alAbrirForm={manejarAbrirForm} />

        <Tabs
          value={tabActiva}
          onValueChange={setTabActiva}
          className="flex flex-col h-full space-y-4 min-h-0"
        >
          <div className="md:hidden w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/20 backdrop-blur-sm">
              <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Lista de Direcciones</TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ver en Mapa</TabsTrigger>
            </TabsList>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
            <ListaDirecciones hook={hook} />
            <MapaDirecciones hook={hook} />
          </div>
        </Tabs>
      </div>

      <ModalesDirecciones hook={hook} />
    </div>
  );
}

function CabeceraDirecciones({ alAbrirForm }: { alAbrirForm: () => void }) {
  return (
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
      <Button onClick={() => alAbrirForm()} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all active:scale-95 gap-2 h-10">
        <PlusCircle className="h-4 w-4" />
        Nueva Dirección
      </Button>
    </div>
  );
}

function ListaDirecciones({ hook }: { hook: any }) {
  const { 
    tabActiva, 
    busqueda, 
    setBusqueda, 
    filtroMunicipio, 
    setFiltroMunicipio, 
    municipiosUnicos, 
    direccionesFiltradas,
    seleccionadaParaMapa,
    setSeleccionadaParaMapa,
    setTabActiva,
    manejarAbrirForm,
    manejarCopiarDireccion,
    setDireccionAEliminar,
    idCopiado
  } = hook;

  return (
    <div
      className={cn(
        'm-0 h-full flex flex-col min-h-0',
        tabActiva !== 'list' && 'hidden md:flex'
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
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
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
                <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
                  <SelectTrigger id="municipality-filter" className="h-10 bg-background/50 border-muted/40 pl-10 focus:bg-background transition-all">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl">
                    {municipiosUnicos.map((mun: string) => (
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
            {direccionesFiltradas.length > 0 ? (
              <div className="space-y-4 pb-4">
                {direccionesFiltradas.map((direccion: any) => (
                  <Card
                    key={direccion.id}
                    className={cn(
                      'group flex flex-col transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md border-muted/60',
                      seleccionadaParaMapa?.id === direccion.id
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'hover:border-primary/40'
                    )}
                  >
                    <CardHeader className="p-4 bg-muted/10 group-hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <CardTitle className="flex items-start gap-2.5 text-base font-bold tracking-tight leading-snug">
                            <MapPin className={cn(
                              "h-4 w-4 mt-0.5 shrink-0 transition-colors",
                              seleccionadaParaMapa?.id === direccion.id ? "text-primary" : "text-muted-foreground/70"
                            )} />
                            <span className="flex-1">{direccion.name}</span>
                          </CardTitle>
                          {direccion.locationType && (() => {
                            const typeConfig = LOCATION_TYPE_CONFIG[direccion.locationType!];
                            if (!typeConfig) return null;
                            return (
                              <span className={cn(
                                'ml-6 inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200',
                                typeConfig.className
                              )}>
                                {typeConfig.label}
                              </span>
                            );
                          })()}
                        </div>
                        {direccion.latitude && direccion.longitude && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] mt-1.5 shrink-0" title="Coordenadas disponibles" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 text-sm text-muted-foreground space-y-3">
                      {(direccion.street || direccion.houseNumber) && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Dirección</p>
                          <p className="text-foreground/90 font-medium">
                            {`${direccion.street || ''}${direccion.street && direccion.houseNumber ? ', ' : ''}${direccion.houseNumber || ''}`}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Ubicación</p>
                          <p className="text-foreground/80 text-xs">
                            {[
                              `Mcp. ${direccion.municipality}`,
                              `Pqa. ${direccion.parish}`,
                              direccion.sector ? `Sctor. ${direccion.sector}` : null,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Cuadrante</p>
                          <p className="text-foreground/80 text-xs">
                            {direccion.peaceQuadrant}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap justify-end gap-2 bg-muted/10 p-2.5 border-t border-muted/30">
                      <div className="mr-auto flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-background/80">
                              {idCopiado === direccion.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <ClipboardCopy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="backdrop-blur-xl">
                            <DropdownMenuItem
                              onClick={() => manejarCopiarDireccion(direccion, false)}
                              className="text-xs"
                            >
                              Copiar dirección texto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => manejarCopiarDireccion(direccion, true)}
                              disabled={!direccion.latitude || !direccion.longitude}
                              className="text-xs"
                            >
                              Copiar con coordenadas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {direccion.latitude && direccion.longitude && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-background/80 text-blue-500"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${direccion.latitude},${direccion.longitude}`, '_blank')}
                            title="Abrir en Google Maps"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <Button
                        variant={seleccionadaParaMapa?.id === direccion.id ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 text-xs font-semibold px-3 transition-all",
                          seleccionadaParaMapa?.id === direccion.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                        )}
                        onClick={() => {
                          setSeleccionadaParaMapa(direccion);
                          if (window.innerWidth < 768) setTabActiva('map');
                        }}
                        disabled={!direccion.latitude || !direccion.longitude}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-3 bg-background hover:bg-muted"
                        onClick={() => manejarAbrirForm(direccion)}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => setDireccionAEliminar(direccion)}
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
                  {busqueda || filtroMunicipio !== 'all'
                    ? 'Prueba con otra búsqueda o filtro.'
                    : 'Empieza añadiendo una nueva dirección.'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MapaDirecciones({ hook }: { hook: any }) {
  const { tabActiva, seleccionadaParaMapa, direcciones, manejarClickMapa } = hook;

  return (
    <div
      className={cn(
        'm-0 h-full flex flex-col min-h-0',
        tabActiva !== 'map' && 'hidden md:flex'
      )}
    >
      <div className="h-full rounded-xl overflow-hidden border shadow-inner relative group bg-muted/5">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <AddressMap
            latitude={seleccionadaParaMapa?.latitude}
            longitude={seleccionadaParaMapa?.longitude}
            name={seleccionadaParaMapa?.name}
            addresses={direcciones}
            onMapClick={manejarClickMapa}
          />
        </Suspense>
        
        <div className="absolute bottom-4 left-4 z-[40] max-w-[200px] pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md p-2.5 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Mapa Interactivo</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Pulsa en cualquier punto para registrar una nueva ubicación.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalesDirecciones({ hook }: { hook: any }) {
  const { 
    esFormOpen, 
    manejarCerrarForm, 
    manejarGuardarDireccion, 
    direccionEditando, 
    coordenadasIniciales,
    direccionAEliminar,
    setDireccionAEliminar,
    manejarConfirmarEliminacion
  } = hook;

  return (
    <>
      <AddressFormDialog
        isOpen={esFormOpen}
        onClose={manejarCerrarForm}
        onSave={manejarGuardarDireccion}
        address={direccionEditando}
        initialCoords={coordenadasIniciales}
      />

      <AlertDialog
        open={!!direccionAEliminar}
        onOpenChange={(open) => !open && setDireccionAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La dirección "{direccionAEliminar?.name}" será
              eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDireccionAEliminar(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={manejarConfirmarEliminacion}>Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
