'use client';

import React, { useState, useMemo, useRef, useEffect, forwardRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Building,
  Layers,
  Home,
  Check,
  Search,
  X,
  Copy,
  BookOpen,
  Edit3,
  Sparkles,
  Shield,
  RotateCcw,
  Link2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAddresses } from '@/hooks/direcciones';
import type { Address } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, normalizeString } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { LOCATION_TYPES, formatAddressToString } from '@/lib/constants/addresses';
import {
  getMunicipios,
  getParroquias,
  getSectores,
  getCircuitosComunales,
  getCircuitoComunalParaSector,
  formatUbicacionString,
  parseUbicacionString,
  findMunicipio,
} from '@/lib/constants/territorial';
import { toast } from 'sonner';

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onTypeChange?: (type: string) => void;
  typeValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  isTextarea?: boolean;
  name?: string;
  id?: string;
  label?: string;
  index?: number;
  defaultMunicipio?: string;
  required?: boolean;
}

const LOCATION_TYPE_BADGE: Record<string, string> = {
  centro_asistencial: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  residencia: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
  lugar_publico: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  institucion_comercio: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25',
  sede: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
};

export { formatAddressToString };

const CUSTOM_VALUE = '__custom__';

export const AddressInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, AddressInputProps>(
  (
    {
      value,
      onChange,
      onTypeChange,
      typeValue,
      placeholder,
      disabled,
      className,
      onBlur,
      isTextarea,
      name,
      id,
      label,
      index,
      defaultMunicipio = 'Diego Bautista Urbaneja',
      required,
    },
    ref
  ) => {
    const { addresses, isLoaded } = useAddresses();
    const [directoryOpen, setDirectoryOpen] = useState(false);
    const [directorySearch, setDirectorySearch] = useState('');
    const [mode, setMode] = useState<'menus' | 'manual'>('menus');
    const [copied, setCopied] = useState(false);

    // Resolve Card Title & Number badge (e.g., Destino #01, Ubicación, etc.)
    const { cardTitle, cardBadge } = useMemo(() => {
      let rawTitle = label;
      if (!rawTitle && name) {
        const parts = name.split('.');
        const last = parts[parts.length - 1];
        if (last && isNaN(Number(last))) {
          rawTitle = last;
        }
      }
      if (!rawTitle) {
        rawTitle = 'Ubicación';
      }

      // Check for index in props or in name (e.g. section_1.0.Destino or Destino[0])
      let badge: string | undefined;
      if (index !== undefined) {
        badge = `#${String(index + 1).padStart(2, '0')}`;
      } else if (name) {
        const match = name.match(/(?:\.|\[)(\d+)(?:\.|\s*\])/);
        if (match && match[1]) {
          const idx = parseInt(match[1], 10) + 1;
          badge = `#${String(idx).padStart(2, '0')}`;
        }
      }

      return {
        cardTitle: rawTitle,
        cardBadge: badge,
      };
    }, [label, name, index]);

    // Menus State
    const [municipio, setMunicipio] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      if (parsed.municipio) return parsed.municipio;
      const foundDefault = findMunicipio(defaultMunicipio);
      return foundDefault ? foundDefault.nombre : 'Diego Bautista Urbaneja';
    });

    const [parroquia, setParroquia] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      return parsed.parroquia || 'Lechería';
    });

    const [sector, setSector] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      return parsed.sector || '';
    });
    const [isCustomSector, setIsCustomSector] = useState(false);
    const [customSectorText, setCustomSectorText] = useState('');

    const [circuitoComunal, setCircuitoComunal] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      return parsed.circuitoComunal || '';
    });
    const [isCustomCircuito, setIsCustomCircuito] = useState(false);
    const [customCircuitoText, setCustomCircuitoText] = useState('');

    const [calle, setCalle] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      return parsed.calle || '';
    });

    const [lugar, setLugar] = useState<string>(() => {
      const parsed = parseUbicacionString(value);
      return parsed.lugar || '';
    });

    const internalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const isInternalUpdate = useRef(false);

    // List of municipalities
    const municipiosList = useMemo(() => getMunicipios(), []);

    // List of parishes for the selected municipality
    const parroquiasList = useMemo(() => {
      return getParroquias(municipio);
    }, [municipio]);

    // List of sectors for selected municipality and parish
    const sectoresList = useMemo(() => {
      return getSectores(municipio, parroquia);
    }, [municipio, parroquia]);

    // List of circuits for selected municipality and parish
    const circuitosList = useMemo(() => {
      return getCircuitosComunales(municipio, parroquia);
    }, [municipio, parroquia]);

    // Check if current circuito matches the auto-linked sector circuit
    const isCircuitoLinked = useMemo(() => {
      if (!sector || isCustomSector) return false;
      const autoCircuito = getCircuitoComunalParaSector(municipio, parroquia, sector);
      return autoCircuito && autoCircuito === circuitoComunal;
    }, [municipio, parroquia, sector, isCustomSector, circuitoComunal]);

    // Filtered addresses for directory search
    const filteredDirectoryAddresses = useMemo(() => {
      if (!directorySearch.trim()) return addresses;
      const q = normalizeString(directorySearch);
      return addresses.filter((addr) => {
        const nameMatch = normalizeString(addr.name).includes(q);
        const sectorMatch = addr.sector && normalizeString(addr.sector).includes(q);
        const parishMatch = addr.parish && normalizeString(addr.parish).includes(q);
        const munMatch = addr.municipality && normalizeString(addr.municipality).includes(q);
        const streetMatch = addr.street && normalizeString(addr.street).includes(q);
        const quadMatch = addr.peaceQuadrant && normalizeString(addr.peaceQuadrant).includes(q);
        const cirMatch = (addr as any).circuitoComunal && normalizeString((addr as any).circuitoComunal).includes(q);
        return nameMatch || sectorMatch || parishMatch || munMatch || streetMatch || quadMatch || cirMatch;
      });
    }, [addresses, directorySearch]);

    // Detect if current value matches an address in directory
    const matchedAddress = useMemo(() => {
      if (!value) return null;
      const normalized = normalizeString(value);
      return addresses.find((addr) => normalizeString(formatAddressToString(addr)) === normalized) ?? null;
    }, [value, addresses]);

    const resolvedType = matchedAddress?.locationType ?? null;
    const isManualType = !!value && !matchedAddress;

    // Auto-emit type if matched from directory
    useEffect(() => {
      if (matchedAddress?.locationType && onTypeChange) {
        onTypeChange(matchedAddress.locationType);
      }
    }, [matchedAddress, onTypeChange]);

    // Sync external value changes into local state if changed externally (e.g. form reset, draft load)
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      if (value) {
        const parsed = parseUbicacionString(value);
        if (parsed.municipio) setMunicipio(parsed.municipio);
        if (parsed.parroquia) setParroquia(parsed.parroquia);

        if (parsed.sector) {
          setSector(parsed.sector);
          setIsCustomSector(false);
        }

        if (parsed.circuitoComunal) {
          setCircuitoComunal(parsed.circuitoComunal);
          setIsCustomCircuito(false);
        }

        if (parsed.calle) setCalle(parsed.calle);
        if (parsed.lugar) setLugar(parsed.lugar);
      }
    }, [value]);

    // Emit formatted string to form
    const emitFormatted = useCallback(
      (parts: {
        municipioVal?: string;
        parroquiaVal?: string;
        sectorVal?: string;
        calleVal?: string;
        lugarVal?: string;
        circuitoVal?: string;
      }) => {
        const mun = parts.municipioVal !== undefined ? parts.municipioVal : municipio;
        const par = parts.parroquiaVal !== undefined ? parts.parroquiaVal : parroquia;
        const sec = parts.sectorVal !== undefined ? parts.sectorVal : (isCustomSector ? customSectorText : sector);
        const cal = parts.calleVal !== undefined ? parts.calleVal : calle;
        const lug = parts.lugarVal !== undefined ? parts.lugarVal : lugar;
        const cir = parts.circuitoVal !== undefined ? parts.circuitoVal : (isCustomCircuito ? customCircuitoText : circuitoComunal);

        const formatted = formatUbicacionString({
          municipio: mun,
          parroquia: par,
          sector: sec,
          calle: cal,
          lugar: lug,
          circuitoComunal: cir,
        });

        isInternalUpdate.current = true;
        onChange(formatted);
      },
      [municipio, parroquia, sector, isCustomSector, customSectorText, calle, lugar, circuitoComunal, isCustomCircuito, customCircuitoText, onChange]
    );

    // Handlers for menu selections
    const handleMunicipioChange = (newMun: string) => {
      setMunicipio(newMun);
      const newParishes = getParroquias(newMun);
      const firstParish = newParishes[0]?.nombre || '';
      setParroquia(firstParish);
      setSector('');
      setIsCustomSector(false);
      setCustomSectorText('');

      const availableCircuits = getCircuitosComunales(newMun, firstParish);
      const autoCircuito = availableCircuits.length === 1 ? (availableCircuits[0] ?? '') : '';
      setCircuitoComunal(autoCircuito);
      setIsCustomCircuito(false);

      emitFormatted({
        municipioVal: newMun,
        parroquiaVal: firstParish,
        sectorVal: '',
        circuitoVal: autoCircuito,
      });
    };

    const handleParroquiaChange = (newPar: string) => {
      setParroquia(newPar);
      setSector('');
      setIsCustomSector(false);
      setCustomSectorText('');

      const availableCircuits = getCircuitosComunales(municipio, newPar);
      const autoCircuito = availableCircuits.length === 1 ? (availableCircuits[0] ?? '') : '';
      setCircuitoComunal(autoCircuito);
      setIsCustomCircuito(false);

      emitFormatted({
        parroquiaVal: newPar,
        sectorVal: '',
        circuitoVal: autoCircuito,
      });
    };

    const handleSectorChange = (newSec: string) => {
      if (newSec === CUSTOM_VALUE) {
        setIsCustomSector(true);
        setSector('');
        return;
      }

      setIsCustomSector(false);
      setSector(newSec);

      // Auto-link circuito comunal based on selected sector!
      const linkedCircuito = getCircuitoComunalParaSector(municipio, parroquia, newSec);
      const nextCircuito = linkedCircuito || circuitoComunal;
      if (linkedCircuito) {
        setCircuitoComunal(linkedCircuito);
        setIsCustomCircuito(false);
      }

      emitFormatted({
        sectorVal: newSec,
        circuitoVal: nextCircuito,
      });
    };

    const handleCircuitoChange = (newCir: string) => {
      if (newCir === CUSTOM_VALUE) {
        setIsCustomCircuito(true);
        setCircuitoComunal('');
        return;
      }
      setIsCustomCircuito(false);
      setCircuitoComunal(newCir);
      emitFormatted({ circuitoVal: newCir });
    };

    // Quick selection from directory
    const handleSelectDirectoryAddress = (addr: Address) => {
      const parts = parseUbicacionString(formatAddressToString(addr));
      const targetMun = parts.municipio || addr.municipality;
      const targetPar = parts.parroquia || addr.parish;
      const targetSec = parts.sector || addr.sector || '';
      const targetCalle = parts.calle || [addr.street, addr.houseNumber].filter(Boolean).join(' ');
      const targetLugar = parts.lugar || addr.name;
      const targetCircuito = parts.circuitoComunal || (addr as any).circuitoComunal || addr.peaceQuadrant || '';

      setMunicipio(targetMun);
      setParroquia(targetPar);
      setSector(targetSec);
      setIsCustomSector(false);
      setCalle(targetCalle);
      setLugar(targetLugar);
      setCircuitoComunal(targetCircuito);
      setIsCustomCircuito(false);

      const formatted = formatAddressToString(addr);
      isInternalUpdate.current = true;
      onChange(formatted);

      if (onTypeChange && addr.locationType) {
        onTypeChange(addr.locationType);
      }

      setDirectoryOpen(false);
      setDirectorySearch('');
    };

    // Copy formatted result
    const handleCopy = () => {
      if (!value) return;
      navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Dirección copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    };

    // Quick summary string for header preview (e.g. "Lechería • Casco Central")
    const headerSummary = useMemo(() => {
      const items = [sector || customSectorText, lugar || calle].filter(Boolean);
      return items.join(' • ');
    }, [sector, customSectorText, lugar, calle]);

    if (!isLoaded) {
      return (
        <div className="space-y-2 p-3 border rounded-xl bg-card">
          <Skeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className={cn("space-y-2 w-full min-w-0", className)}>
        {/* Top Header: Etiqueta principal con icono de ubicación y controles alineados a la izquierda */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Etiqueta principal con icono de ubicación */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground shrink-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{cardTitle}</span>
            {required && <span className="text-destructive ml-0.5">*</span>}
            {cardBadge && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-bold tracking-wider bg-primary/10 text-primary border-primary/25 shrink-0">
                {cardBadge}
              </Badge>
            )}
            {headerSummary && (
              <span className="text-[11px] font-normal text-muted-foreground truncate max-w-[180px] sm:max-w-[260px]">
                ({headerSummary})
              </span>
            )}
          </div>

          {/* Alineados a la izquierda: Directorio y Texto libre */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Directory Button with Search Popover */}
            <Popover open={directoryOpen} onOpenChange={setDirectoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2.5 gap-1.5 rounded-lg border-primary/25 text-primary hover:bg-primary/10 font-medium"
                  disabled={disabled}
                >
                  <Search className="h-3 w-3" />
                  <span>Directorio</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96 p-0" align="start">
                {/* Search bar inside directory popover */}
                <div className="p-2.5 border-b border-border space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> Directorio de Direcciones
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {filteredDirectoryAddresses.length} de {addresses.length}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Buscar por nombre, sector, vía, municipio..."
                      className="h-8 pl-8 pr-7 text-xs rounded-lg bg-background"
                      autoFocus
                    />
                    {directorySearch && (
                      <button
                        type="button"
                        onClick={() => setDirectorySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable List of Addresses */}
                <ScrollArea className="h-72 w-full p-1" type="always">
                  {filteredDirectoryAddresses.length > 0 ? (
                    <div className="space-y-1">
                      {filteredDirectoryAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => handleSelectDirectoryAddress(address)}
                          className="w-full text-left p-2 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {address.name}
                            </span>
                            {address.locationType && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground uppercase font-semibold shrink-0">
                                {address.locationType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {address.sector ? `${address.sector} • ` : ''}{address.parish}, {address.municipality}
                          </span>
                          {address.street && (
                            <span className="text-[10px] text-muted-foreground/80 line-clamp-1">
                              📍 {address.street} {address.houseNumber || ''}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                      <Search className="h-6 w-6 mx-auto opacity-30 mb-2" />
                      <p className="font-semibold text-foreground/80">No se encontraron direcciones</p>
                      <p className="text-[11px]">Intenta buscar con otro término</p>
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Mode Toggle Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === 'menus' ? 'manual' : 'menus')}
              title={mode === 'menus' ? 'Editar texto libre directo' : 'Volver al selector por menús'}
            >
              <Edit3 className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">{mode === 'menus' ? 'Texto libre' : 'Menús'}</span>
            </Button>
          </div>
        </div>

        {/* Abajo: Tarjeta con los campos */}
        <div className="border border-border/80 border-l-4 border-l-primary/70 bg-card rounded-xl p-3 sm:p-3.5 shadow-2xs transition-all duration-200 w-full min-w-0 box-border">
          {mode === 'menus' ? (
            /* Menus Grid */
            <div className="space-y-2.5 w-full min-w-0">
              {/* Row 1: Municipio & Parroquia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Building className="h-3 w-3" /> Municipio
                  </label>
                  <Select value={municipio} onValueChange={handleMunicipioChange} disabled={disabled}>
                    <SelectTrigger className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0">
                      <SelectValue placeholder="Selecciona municipio..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {municipiosList.map((m) => (
                        <SelectItem key={m.id} value={m.nombre} className="text-xs">
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Parroquia
                  </label>
                  <Select value={parroquia} onValueChange={handleParroquiaChange} disabled={disabled || parroquiasList.length === 0}>
                    <SelectTrigger className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0">
                      <SelectValue placeholder="Selecciona parroquia..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {parroquiasList.map((p) => (
                        <SelectItem key={p.id} value={p.nombre} className="text-xs">
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Sector & Circuito Comunal (Linked!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                {/* Sector */}
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between min-w-0 gap-1">
                    <span className="flex items-center gap-1 truncate">
                      <Home className="h-3 w-3 shrink-0" /> <span className="truncate">Sector</span>
                    </span>
                    {isCustomSector && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSector(false);
                          setSector('');
                          emitFormatted({ sectorVal: '' });
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <RotateCcw className="h-2.5 w-2.5" /> lista
                      </button>
                    )}
                  </label>

                  {isCustomSector ? (
                    <Input
                      type="text"
                      placeholder="Escribe el nombre del sector..."
                      value={customSectorText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSectorText(val);
                        emitFormatted({ sectorVal: val });
                      }}
                      disabled={disabled}
                      className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0"
                    />
                  ) : (
                    <Select value={sector} onValueChange={handleSectorChange} disabled={disabled}>
                      <SelectTrigger className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0">
                        <SelectValue placeholder="Selecciona sector..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {sectoresList.map((s) => (
                          <SelectItem key={s.nombre} value={s.nombre} className="text-xs">
                            {s.nombre}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_VALUE} className="text-xs font-semibold text-primary">
                          + Otro sector personalizado...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Circuito Comunal */}
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between min-w-0 gap-1">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <Shield className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">Circuito Comunal</span>
                      {isCircuitoLinked && (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 lowercase shrink-0">
                          <Link2 className="h-2.5 w-2.5" /> enlazado
                        </span>
                      )}
                    </span>
                    {isCustomCircuito && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCircuito(false);
                          setCircuitoComunal('');
                          emitFormatted({ circuitoVal: '' });
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <RotateCcw className="h-2.5 w-2.5" /> lista
                      </button>
                    )}
                  </label>

                  {isCustomCircuito ? (
                    <Input
                      type="text"
                      placeholder="Escribe el circuito comunal..."
                      value={customCircuitoText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCircuitoText(val);
                        emitFormatted({ circuitoVal: val });
                      }}
                      disabled={disabled}
                      className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0"
                    />
                  ) : (
                    <Select value={circuitoComunal} onValueChange={handleCircuitoChange} disabled={disabled}>
                      <SelectTrigger className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0">
                        <SelectValue placeholder="Selecciona circuito..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {circuitosList.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_VALUE} className="text-xs font-semibold text-primary">
                          + Otro circuito personalizado...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Row 3: Calle y Ubicación/Lugar específico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Calle / Avenida (opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: calle Pampatar, Av. Principal..."
                    value={calle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCalle(val);
                      emitFormatted({ calleVal: val });
                    }}
                    disabled={disabled}
                    className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Ubicación / Lugar específico
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Residencias Las Palmeras, Casa N° 12..."
                    value={lugar}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLugar(val);
                      emitFormatted({ lugarVal: val });
                    }}
                    disabled={disabled}
                    className="h-8.5 text-xs rounded-lg bg-background border-border/80 w-full min-w-0"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Manual Free Text Mode */
            <div className="space-y-2 w-full min-w-0">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Edición de Texto Libre:
              </label>
              {isTextarea ? (
                <Textarea
                  ref={(node) => {
                    internalInputRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                  }}
                  id={id}
                  name={name}
                  value={value}
                  onChange={(e) => {
                    isInternalUpdate.current = true;
                    onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  disabled={disabled}
                  placeholder={placeholder || 'Escribe la ubicación completa...'}
                  className="min-h-[75px] text-xs rounded-lg w-full min-w-0 resize-y"
                />
              ) : (
                <Input
                  ref={(node) => {
                    internalInputRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                  }}
                  type="text"
                  id={id}
                  name={name}
                  value={value}
                  onChange={(e) => {
                    isInternalUpdate.current = true;
                    onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  disabled={disabled}
                  placeholder={placeholder || 'Escribe la ubicación completa...'}
                  className="h-8.5 text-xs rounded-lg w-full min-w-0"
                />
              )}
            </div>
          )}
        </div>

        {/* Location Type Badge (when matched in directory) */}
        {resolvedType && LOCATION_TYPE_BADGE[resolvedType] && (
          <span
            className={cn(
              'inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200',
              LOCATION_TYPE_BADGE[resolvedType]
            )}
          >
            {LOCATION_TYPES.find((t) => t.value === resolvedType)?.label ?? resolvedType}
          </span>
        )}

        {/* Manual Location Type Selector (when not matched from directory) */}
        {isManualType && onTypeChange && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0">
              Tipo de lugar:
            </span>
            <Select
              name={name ? `${name}_tipo` : undefined}
              value={typeValue ?? ''}
              onValueChange={onTypeChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs rounded-lg border-border/70 flex-1">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }
);

AddressInput.displayName = 'AddressInput';
