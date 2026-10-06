import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings2,
  LayoutGrid,
  FileText,
  MapPin,
  Layers,
  Wifi,
  AlertTriangle,
  MessageSquarePlus,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Sliders,
  ShieldCheck,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/pages/settings/about/data';

export interface SettingsSidebarProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  isDataRestricted?: boolean;
  mobileView: 'sidebar' | 'detail';
}

interface SettingsItemDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  isRestricted?: boolean;
}

interface SettingsGroupDef {
  title: string;
  icon: React.ElementType;
  items: SettingsItemDef[];
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSelectSection,
  isDataRestricted = false,
  mobileView,
}) => {
  const [search, setSearch] = useState('');

  const groups: SettingsGroupDef[] = useMemo(
    () => [
      {
        title: 'Principal',
        icon: Sliders,
        items: [
          {
            id: 'general',
            title: 'Ajustes Generales',
            description: 'Valores institucionales, personal que reporta y opciones de visualización',
            icon: Settings2,
            path: '/settings/general',
          },
        ],
      },
      {
        title: 'Personalización y Operativa',
        icon: FolderTree,
        items: [
          {
            id: 'modules',
            title: 'Módulos',
            description: 'Activa o desactiva secciones del sistema',
            icon: LayoutGrid,
            path: '/settings/modules',
          },
          {
            id: 'templates',
            title: 'Plantillas de Reporte',
            description: 'Crear, editar y organizar formatos de novedades',
            icon: FileText,
            path: '/plantillas',
          },
          {
            id: 'direcciones',
            title: 'Gestor de Direcciones',
            description: 'Administrar ubicaciones y cuadrantes frecuentes',
            icon: MapPin,
            path: '/settings/direcciones',
          },
        ],
      },
      {
        title: 'Espacios y Datos',
        icon: Layers,
        items: [
          {
            id: 'workspaces',
            title: 'Áreas de Trabajo',
            description: 'Gestiona entornos locales o remotos independientes',
            icon: Layers,
            path: '/settings/workspaces',
          },
          {
            id: 'sync',
            title: 'Sincronización',
            description: 'Transferencia de datos entre dispositivos en tiempo real',
            icon: Wifi,
            path: '/settings/sync',
          },
          {
            id: 'borrar-datos',
            title: 'Borrar datos de la app',
            description: 'Limpieza de caché y restablecimiento de datos locales',
            icon: AlertTriangle,
            path: '/settings/borrar-datos',
            isRestricted: isDataRestricted,
            badge: isDataRestricted ? 'Bloqueado' : undefined,
          },
        ],
      },
      {
        title: 'Sistema y Soporte',
        icon: ShieldCheck,
        items: [
          {
            id: 'feedback',
            title: 'Enviar Comentarios',
            description: 'Sugerencias, reporte de errores o retroalimentación',
            icon: MessageSquarePlus,
            path: '/settings/feedback',
          },
          {
            id: 'about',
            title: 'Acerca de',
            description: 'Información del sistema, créditos y novedades',
            icon: Info,
            path: '/settings/about',
            badge: `v${APP_VERSION}`,
          },
        ],
      },
    ],
    [isDataRestricted]
  );

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups
      .map((group) => {
        const matchingItems = group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        );
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [groups, search]);

  return (
    <aside
      id="settings-sidebar"
      className={cn(
        'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none shrink-0 select-none',
        mobileView === 'detail' ? 'hidden sm:flex' : 'flex'
      )}
    >
      {/* Header matching NovedadSidebar */}
      <div className="flex items-center justify-between border-b p-3 sm:p-4 min-h-[60px] sm:min-h-[73px]">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
              title="Volver al Inicio"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Configuración</h2>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Preferencias del sistema y entorno activo
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b bg-card/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Buscar ajuste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 h-8 sm:h-9 text-xs bg-muted/40 border-muted-foreground/20 rounded-xl focus-visible:ring-1"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full" type="always">
          <div className="p-3 space-y-5 pb-24 sm:pb-8">
            {filteredGroups.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Search className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">Sin resultados</p>
                <p className="text-xs text-muted-foreground/60">
                  No se encontraron opciones para &quot;{search}&quot;
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  {/* Category separator header matching NovedadSidebar */}
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <group.icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 truncate">
                      {group.title}
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-[10px] text-muted-foreground/40 shrink-0 font-medium">
                      {group.items.length}
                    </span>
                  </div>

                  {/* Group items */}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;

                      // If it's a subroute link
                      if (item.path) {
                        if (item.isRestricted) {
                          return (
                            <div
                              key={item.id}
                              className="w-full rounded-2xl p-3 text-left opacity-50 cursor-not-allowed border border-dashed border-border/60 bg-muted/20"
                              title="Acción bloqueada para usuarios en la nube"
                            >
                              <div className="flex w-full items-start gap-3">
                                <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-xs font-semibold text-destructive truncate">
                                      {item.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-border/80 h-4 px-1"
                                    >
                                      Bloqueado
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground/70 line-clamp-1">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={() => onSelectSection(item.id)}
                            className="block w-full group rounded-2xl transition-all duration-200 outline-none"
                          >
                            <div
                              className={cn(
                                'w-full rounded-2xl p-3 text-left transition-all duration-200 border outline-none',
                                isSelected
                                  ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
                                  : 'border-transparent hover:bg-muted/50 hover:border-border/40'
                              )}
                            >
                              <div className="flex w-full items-start gap-3">
                                <div
                                  className={cn(
                                    'p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105',
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-sm'
                                      : 'bg-primary/10 text-primary'
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span
                                      className={cn(
                                        'text-xs font-semibold truncate',
                                        isSelected
                                          ? 'text-primary'
                                          : 'text-foreground group-hover:text-primary transition-colors'
                                      )}
                                    >
                                      {item.title}
                                    </span>
                                    {item.badge ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] font-bold tracking-tight h-4 px-1.5"
                                      >
                                        {item.badge}
                                      </Badge>
                                    ) : (
                                      <ChevronRight
                                        className={cn(
                                          'h-3.5 w-3.5 shrink-0 transition-colors',
                                          isSelected
                                            ? 'text-primary'
                                            : 'text-muted-foreground/40 group-hover:text-foreground'
                                        )}
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      }

                      // Embedded action (e.g. Ajustes Generales)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectSection(item.id)}
                          className={cn(
                            'w-full rounded-2xl p-3 text-left transition-all duration-200 group border outline-none',
                            isSelected
                              ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
                              : 'border-transparent hover:bg-muted/50 hover:border-border/40'
                          )}
                        >
                          <div className="flex w-full items-start gap-3">
                            <div
                              className={cn(
                                'p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105',
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span
                                  className={cn(
                                    'text-xs font-semibold truncate',
                                    isSelected ? 'text-primary' : 'text-foreground'
                                  )}
                                >
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-bold tracking-tight h-4 px-1.5"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
