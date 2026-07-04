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
  MoreVertical,
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
  DropdownMenuSeparator,
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

const parseQuadrant = (peaceQuadrant: string, entity?: string) => {
  if (entity) {
    return { quadrant: peaceQuadrant, entity };
  }
  if (!peaceQuadrant) return { quadrant: '', entity: '' };
  const match = peaceQuadrant.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (match) {
    return {
      quadrant: (match[1] || '').trim(),
      entity: (match[2] || '').trim()
    };
  }
  return { quadrant: peaceQuadrant, entity: '' };
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

      {/* Floating action button at bottom on mobile devices, floating above BottomNav */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 px-4 z-[45] pointer-events-none flex justify-center">
        <Button
          onClick={() => manejarAbrirForm()}
          className="w-full max-w-sm pointer-events-auto shadow-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-primary-foreground/10"
        >
          <PlusCircle className="h-5 w-5" />
          Nueva Dirección
        </Button>
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
      <Button onClick={() => alAbrirForm()} className="hidden md:flex shadow-md hover:shadow-lg transition-all active:scale-95 gap-2 h-10">
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

          <div className="border-t border-border/30 pt-4 mb-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Todas las ubicaciones ({direccionesFiltradas.length})
            </span>
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2" type="always">
            {direccionesFiltradas.length > 0 ? (
              <div className="divide-y divide-border/40 pb-4">
                {direccionesFiltradas.map((direccion: any) => {
                  const esSeleccionada = seleccionadaParaMapa?.id === direccion.id;
                  return (
                    <div
                      key={direccion.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 gap-3 transition-all duration-200 hover:bg-muted/40 cursor-pointer relative rounded-lg my-0.5",
                        esSeleccionada ? "bg-primary/5 pl-7" : ""
                      )}
                      onClick={() => {
                        if (direccion.latitude && direccion.longitude) {
                          setSeleccionadaParaMapa(direccion);
                          if (window.innerWidth < 768) setTabActiva('map');
                        }
                      }}
                    >
                      {esSeleccionada && (
                        <div className="absolute left-2.5 top-3.5 bottom-3.5 w-1 bg-primary rounded-full" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-bold text-base text-foreground tracking-tight leading-snug">
                            {direccion.name}
                          </span>
                          {direccion.locationType && (() => {
                            const typeConfig = LOCATION_TYPE_CONFIG[direccion.locationType!];
                            if (!typeConfig) return null;
                            return (
                              <span className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase',
                                typeConfig.className
                              )}>
                                {typeConfig.label}
                              </span>
                            );
                          })()}
                        </div>
                        
                        <div className="flex flex-col space-y-0.5 text-sm">
                          {(direccion.street || direccion.houseNumber) && (
                            <p className="text-foreground/90 font-medium leading-normal">
                              {`${direccion.street || ''}${direccion.street && direccion.houseNumber ? ', ' : ''}${direccion.houseNumber || ''}`}
                            </p>
                          )}
                          <p className="text-muted-foreground leading-normal">
                            {[
                              `Mcp. ${direccion.municipality}`,
                              `Pqa. ${direccion.parish}`,
                              direccion.sector ? `Sctor. ${direccion.sector}` : null,
                            ].filter(Boolean).join(', ')}
                          </p>
                          {direccion.peaceQuadrant && (() => {
                            const { quadrant, entity } = parseQuadrant(direccion.peaceQuadrant, direccion.entity);
                            return (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/80 pt-0.5">
                                <span>
                                  Cuadrante: <span className="text-foreground/85 font-medium">{quadrant}</span>
                                </span>
                                {entity && (
                                  <>
                                    <span className="hidden sm:inline text-muted-foreground/45">•</span>
                                    <span>
                                      Ente encargado: <span className="text-foreground/85 font-medium">{entity}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-1 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/80 rounded-full" title="Opciones de dirección">
                              <MoreVertical className="h-4.5 w-4.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl">
                            {direccion.latitude && direccion.longitude && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${direccion.latitude},${direccion.longitude}`, '_blank')}
                                  className="gap-2 cursor-pointer text-blue-500 hover:text-blue-600 focus:text-blue-500"
                                >
                                  <Globe className="h-4 w-4" />
                                  <span>Abrir en Google Maps</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="opacity-45 my-1" />
                              </>
                            )}

                            <DropdownMenuItem
                              onClick={() => manejarCopiarDireccion(direccion, false)}
                              className="gap-2 cursor-pointer"
                            >
                              {idCopiado === direccion.id ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ClipboardCopy className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>{idCopiado === direccion.id ? '¡Copiado!' : 'Copiar dirección texto'}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => manejarCopiarDireccion(direccion, true)}
                              disabled={!direccion.latitude || !direccion.longitude}
                              className="gap-2 cursor-pointer"
                            >
                              <ClipboardCopy className="h-4 w-4 text-muted-foreground" />
                              <span>Copiar con coordenadas</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="opacity-45 my-1" />

                            <DropdownMenuItem
                              onClick={() => manejarAbrirForm(direccion)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                              <span>Editar dirección</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDireccionAEliminar(direccion)}
                              className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Eliminar dirección</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
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
