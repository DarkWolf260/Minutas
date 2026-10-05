'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Newspaper,
  ClipboardList,
  History,
  Users,
  BarChart2,
  FileText,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  Eclipse,
  Monitor,
  Search,
  BookOpen,
  Briefcase,
  HelpCircle,
  CornerDownLeft,
  PanelLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { useAdmin } from '@/hooks/admin';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { toggleSidebarGlobal } from '@/hooks/ui';

export const OPEN_COMMAND_MENU_EVENT = 'minutas-open-command-menu';

export function openCommandMenu() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU_EVENT));
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceManager();
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle on Ctrl+K / Cmd+K and listen for open event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // If menu is open, handle arrows and enter
      if (open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + Math.max(1, filteredItems.length)) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
            setOpen(false);
          }
        }
        return;
      }

      // Fast single-key / sequence shortcuts when not in input
      if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === '?') {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_MENU_EVENT, handleCustomOpen);
    };
  }, [open, selectedIndex]);

  // Sequential shortcuts: g then n, g then o, etc.
  useEffect(() => {
    let pendingG = false;
    let timer: any = null;

    const handleKey = (e: KeyboardEvent) => {
      if (open) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      if (!pendingG) {
        if (key === 'g') {
          pendingG = true;
          clearTimeout(timer);
          timer = setTimeout(() => { pendingG = false; }, 800);
        }
      } else {
        pendingG = false;
        clearTimeout(timer);
        if (key === 'n') { e.preventDefault(); navigate('/'); }
        else if (key === 'o') { e.preventDefault(); navigate('/orden-del-dia'); }
        else if (key === 'r') { e.preventDefault(); navigate('/reporte-final'); }
        else if (key === 'p') { e.preventDefault(); navigate('/personal'); }
        else if (key === 't') { e.preventDefault(); navigate('/plantillas'); }
        else if (key === 'e') { e.preventDefault(); navigate('/estadisticas'); }
        else if (key === 's') { e.preventDefault(); navigate('/settings'); }
        else if (key === 'a' && isAdmin) { e.preventDefault(); navigate('/admin'); }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [open, navigate, isAdmin]);

  // Reset query and selectedIndex when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Ensure selected item is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: 'nav-novedades',
        label: 'Ir a Novedades',
        category: 'Navegación',
        icon: Newspaper,
        shortcut: 'G+N',
        action: () => navigate('/'),
        keywords: ['inicio', 'dashboard', 'feed', 'reportes', 'g+n', 'gn'],
      },
      {
        id: 'nav-orden',
        label: 'Ir a Orden del Día',
        category: 'Navegación',
        icon: ClipboardList,
        shortcut: 'G+O',
        action: () => navigate('/orden-del-dia'),
        keywords: ['guardia', 'lista', 'asistencia', 'personal', 'g+o', 'go'],
      },
      {
        id: 'nav-reporte',
        label: 'Ir a Reporte Final',
        category: 'Navegación',
        icon: History,
        shortcut: 'G+R',
        action: () => navigate('/reporte-final'),
        keywords: ['minuta', 'exportar', 'cierre', 'resumen', 'g+r', 'gr'],
      },
      {
        id: 'nav-personal',
        label: 'Ir a Personal',
        category: 'Navegación',
        icon: Users,
        shortcut: 'G+P',
        action: () => navigate('/personal'),
        keywords: ['oficiales', 'usuarios', 'roles', 'g+p', 'gp'],
      },
      {
        id: 'nav-estadisticas',
        label: 'Ir a Estadísticas',
        category: 'Navegación',
        icon: BarChart2,
        shortcut: 'G+E',
        action: () => navigate('/estadisticas'),
        keywords: ['gráficos', 'métricas', 'análisis', 'g+e', 'ge'],
      },
      {
        id: 'nav-plantillas',
        label: 'Ir a Plantillas',
        category: 'Navegación',
        icon: FileText,
        shortcut: 'G+T',
        action: () => navigate('/plantillas'),
        keywords: ['templates', 'formatos', 'formularios', 'editor', 'g+t', 'gt'],
      },
      {
        id: 'nav-settings',
        label: 'Ir a Configuración',
        category: 'Navegación',
        icon: Settings,
        shortcut: 'G+S',
        action: () => navigate('/settings'),
        keywords: ['ajustes', 'preferencias', 'opciones', 'g+s', 'gs'],
      },
    ];

    if (isAdmin) {
      list.push({
        id: 'nav-admin',
        label: 'Ir a Panel de Administración',
        category: 'Navegación',
        icon: ShieldAlert,
        shortcut: 'G+A',
        action: () => navigate('/admin'),
        keywords: ['admin', 'administrador', 'seguridad', 'usuarios', 'g+a', 'ga'],
      });
    }

    // Toggle Sidebar Action
    list.push({
      id: 'nav-toggle-sidebar',
      label: 'Alternar Barra Lateral (Expandir / Colapsar)',
      category: 'Navegación',
      icon: PanelLeft,
      shortcut: 'Ctrl+B',
      action: () => toggleSidebarGlobal(),
      keywords: ['sidebar', 'barra', 'lateral', 'expandir', 'colapsar', 'menú', 'toggle'],
    });

    // Workspaces
    if (workspaces && workspaces.length > 0) {
      workspaces.forEach((ws: string) => {
        list.push({
          id: `ws-${ws}`,
          label: `Cambiar a Área: ${ws}`,
          category: 'Áreas de Trabajo',
          icon: Briefcase,
          action: () => switchWorkspace(ws),
          keywords: ['workspace', 'área', 'sucursal', ws],
        });
      });
    }

    // Themes
    list.push(
      {
        id: 'theme-light',
        label: 'Cambiar a Tema Claro',
        category: 'Apariencia',
        icon: Sun,
        action: () => setTheme('light'),
        keywords: ['modo claro', 'blanco', 'luz'],
      },
      {
        id: 'theme-facebook',
        label: 'Cambiar a Modo Gris (Facebook Slate)',
        category: 'Apariencia',
        icon: Eclipse,
        action: () => setTheme('facebook'),
        keywords: ['modo gris', 'slate', 'bajo contraste'],
      },
      {
        id: 'theme-dark',
        label: 'Cambiar a Modo Oscuro (OLED)',
        category: 'Apariencia',
        icon: Moon,
        action: () => setTheme('dark'),
        keywords: ['modo oscuro', 'negro', 'oled', 'noche'],
      },
      {
        id: 'theme-system',
        label: 'Cambiar a Tema del Sistema',
        category: 'Apariencia',
        icon: Monitor,
        action: () => setTheme('system'),
        keywords: ['automático', 'sistema', 'os'],
      }
    );

    // Help & Docs
    list.push(
      {
        id: 'help-guide',
        label: 'Abrir Guía Rápida y Manual de Usuario',
        category: 'Ayuda',
        icon: BookOpen,
        action: () => navigate('/settings/about/guide'),
        keywords: ['ayuda', 'manual', 'documentación', 'tutorial'],
      },
      {
        id: 'help-tour',
        label: 'Reiniciar Tour Interactivo de Bienvenida',
        category: 'Ayuda',
        icon: HelpCircle,
        action: () => {
          localStorage.setItem('minutas-trigger-tour', 'true');
          window.location.reload();
        },
        keywords: ['tour', 'onboarding', 'recorrido', 'introducción'],
      }
    );

    return list;
  }, [navigate, isAdmin, workspaces, switchWorkspace, setTheme]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase().trim();
    return items.filter((item) => {
      if (item.label.toLowerCase().includes(lower)) return true;
      if (item.category.toLowerCase().includes(lower)) return true;
      if (item.keywords?.some((k) => k.toLowerCase().includes(lower))) return true;
      return false;
    });
  }, [items, query]);

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filteredItems.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  const handleSelectItem = useCallback((item: CommandItem) => {
    item.action();
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        <DialogTitle className="sr-only">Paleta de Comandos</DialogTitle>
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar módulo, acción o atajos (ej: G+N Novedades, G+O Orden, Ctrl+B barra)..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron comandos para "{query}"
            </div>
          ) : (
            grouped.map(([category, categoryItems]) => (
              <div key={category} className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {category}
                </div>
                {categoryItems.map((item) => {
                  const globalIdx = filteredItems.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors select-none",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-muted rounded border border-border">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-primary opacity-80" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border">↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border">↵</kbd>
              Seleccionar
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/80">
            Atajos: pulsa <kbd className="px-1 py-0.5 rounded bg-muted border font-mono">G</kbd> y luego la letra (<kbd className="px-1 py-0.5 rounded bg-muted border font-mono">G+N</kbd>, <kbd className="px-1 py-0.5 rounded bg-muted border font-mono">G+O</kbd>, <kbd className="px-1 py-0.5 rounded bg-muted border font-mono">Ctrl+B</kbd>)
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
