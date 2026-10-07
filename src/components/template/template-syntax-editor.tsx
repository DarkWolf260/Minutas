import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Code2,
  Copy,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronDown,
  Layers,
  GitBranch,
  Calendar,
  UserCheck,
  FileText,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateTemplateSyntax } from '@/lib/validators';

interface TemplateSyntaxEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onSave?: () => void;
  readOnly?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

// Convert numbers 0-9 to unicode subscripts (e.g. 1 -> ₁, 12 -> ₁₂)
export const toSubscript = (num: number): string => {
  const subDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  return String(num)
    .split('')
    .map((d) => subDigits[parseInt(d, 10)] || d)
    .join('');
};

// Rotating color palettes for paired blocks with circular badges
const BLOCK_PALETTES = [
  {
    name: 'purple',
    circleBg: 'bg-purple-600 dark:bg-purple-500',
    circleText: 'text-white',
    circleRing: 'ring-purple-400 dark:ring-purple-300',
    colonText: 'text-purple-600 dark:text-purple-400 font-extrabold',
    badge: 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border-b border-purple-500/50',
    hoverGlow: 'ring-1 ring-purple-500/80 bg-purple-500/25',
  },
  {
    name: 'amber',
    circleBg: 'bg-amber-600 dark:bg-amber-500',
    circleText: 'text-white',
    circleRing: 'ring-amber-400 dark:ring-amber-300',
    colonText: 'text-amber-600 dark:text-amber-400 font-extrabold',
    badge: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-b border-amber-500/50',
    hoverGlow: 'ring-1 ring-amber-500/80 bg-amber-500/25',
  },
  {
    name: 'emerald',
    circleBg: 'bg-emerald-600 dark:bg-emerald-500',
    circleText: 'text-white',
    circleRing: 'ring-emerald-400 dark:ring-emerald-300',
    colonText: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
    badge: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b border-emerald-500/50',
    hoverGlow: 'ring-1 ring-emerald-500/80 bg-emerald-500/25',
  },
  {
    name: 'sky',
    circleBg: 'bg-sky-600 dark:bg-sky-500',
    circleText: 'text-white',
    circleRing: 'ring-sky-400 dark:ring-sky-300',
    colonText: 'text-sky-600 dark:text-sky-400 font-extrabold',
    badge: 'bg-sky-500/15 text-sky-900 dark:text-sky-200 border-b border-sky-500/50',
    hoverGlow: 'ring-1 ring-sky-500/80 bg-sky-500/25',
  },
  {
    name: 'pink',
    circleBg: 'bg-pink-600 dark:bg-pink-500',
    circleText: 'text-white',
    circleRing: 'ring-pink-400 dark:ring-pink-300',
    colonText: 'text-pink-600 dark:text-pink-400 font-extrabold',
    badge: 'bg-pink-500/15 text-pink-900 dark:text-pink-200 border-b border-pink-500/50',
    hoverGlow: 'ring-1 ring-pink-500/80 bg-pink-500/25',
  },
  {
    name: 'indigo',
    circleBg: 'bg-indigo-600 dark:bg-indigo-500',
    circleText: 'text-white',
    circleRing: 'ring-indigo-400 dark:ring-indigo-300',
    colonText: 'text-indigo-600 dark:text-indigo-400 font-extrabold',
    badge: 'bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 border-b border-indigo-500/50',
    hoverGlow: 'ring-1 ring-indigo-500/80 bg-indigo-500/25',
  },
  {
    name: 'teal',
    circleBg: 'bg-teal-600 dark:bg-teal-500',
    circleText: 'text-white',
    circleRing: 'ring-teal-400 dark:ring-teal-300',
    colonText: 'text-teal-600 dark:text-teal-400 font-extrabold',
    badge: 'bg-teal-500/15 text-teal-900 dark:text-teal-200 border-b border-teal-500/50',
    hoverGlow: 'ring-1 ring-teal-500/80 bg-teal-500/25',
  },
  {
    name: 'orange',
    circleBg: 'bg-orange-600 dark:bg-orange-500',
    circleText: 'text-white',
    circleRing: 'ring-orange-400 dark:ring-orange-300',
    colonText: 'text-orange-600 dark:text-orange-400 font-extrabold',
    badge: 'bg-orange-500/15 text-orange-900 dark:text-orange-200 border-b border-orange-500/50',
    hoverGlow: 'ring-1 ring-orange-500/80 bg-orange-500/25',
  },
];

// System predefined keywords for classification
const SYSTEM_VARS = new Set([
  'fecha',
  'hora',
  'municipio',
  'estado',
  'redan',
  'zoedan',
  'usuario',
  'guardia',
  'grupo',
  'grupo de guardia',
  'guardia de servicio',
]);

const STAFF_PROTOCOL_NAMES = new Set([
  'reporta',
  'analista',
  'director',
  'directora',
  'jefe de operaciones',
  'jefe de los servicios',
  'técnico',
  'tecnico',
  'auxiliar',
  'conductor',
]);

function isInlineConditional(insideContent: string): boolean {
  const rest = insideContent.replace(/^if\s+/i, '').trim();
  let inQuotes = false;
  let quoteChar = '';
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (!inQuotes && (c === '"' || c === "'")) {
      inQuotes = true;
      quoteChar = c;
    } else if (inQuotes && c === quoteChar) {
      inQuotes = false;
    } else if (!inQuotes && c === ':') {
      const after = rest.slice(i + 1).trim().toLowerCase();
      if (after === 'show' || after === 'hide') return false;
      return true; // Has body after colon
    }
  }
  return false;
}

interface BlockMeta {
  id: number;
  label: string;
  kind: 'if' | 'repeatable' | 'section' | 'map' | 'separator';
  startIndex: number;
  endIndex?: number;
}

export function TemplateSyntaxEditor({
  value,
  onChange,
  placeholder = 'Escribe el contenido de tu plantilla aquí...',
  className = '',
  minHeight = 'min-h-[420px]',
  onSave,
  readOnly = false,
  textareaRef: externalTextareaRef,
}: TemplateSyntaxEditorProps) {
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalTextareaRef || localTextareaRef;
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [showBlockNumbers, setShowBlockNumbers] = useState(true);
  const [hoveredBlockId, setHoveredBlockId] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, charOffset: 0 });

  // Sync scroll from textarea to backdrop
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Track cursor position for status bar and breadcrumbs
  const updateCursorPosition = () => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const lines = el.value.substring(0, pos).split('\n');
    setCursorPos({
      line: lines.length,
      col: (lines[lines.length - 1]?.length || 0) + 1,
      charOffset: pos,
    });
  };

  // Keyboard enhancements: Tab for indent, Ctrl+S for save
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) {
        onSave();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const indent = '  '; // 2 spaces
      const newValue = value.substring(0, start) + indent + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  // Text insertion helper at current cursor position
  const insertSnippet = (snippet: string, cursorOffset?: number) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value ? `${value}\n\n${snippet}` : snippet);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newValue = before + snippet + after;
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      const newPos = cursorOffset !== undefined ? start + cursorOffset : start + snippet.length;
      el.setSelectionRange(newPos, newPos);
      updateCursorPosition();
    }, 10);
  };

  // Real-time syntax validation
  const validation = useMemo(() => {
    if (!value.trim()) return { valid: true };
    return validateTemplateSyntax(value);
  }, [value]);

  // Statistics
  const stats = useMemo(() => {
    const lines = value ? value.split('\n').length : 0;
    const chars = value.length;
    return { lines, chars };
  }, [value]);

  // ─── Block Pairing Pass ──────────────────────────────────────────────
  // Identifies every opening block and pairs it with its exact closing :::
  const blockPairs = useMemo(() => {
    const regex =
      /(:::(?!\s*:::)([^\n\r:]|:(?!::))+?:::|:::|<<|>>|\\[*{}[\]:\\]|\{[^{}\n\r]+\}\*?|\[\?[^\]\n\r]*\]|\[\/\]|\["[^"\n\r]*"\]\*?)/g;


    const stack: BlockMeta[] = [];
    const completedBlocks: BlockMeta[] = [];
    const tokenMetadata = new Map<
      number,
      {
        blockId: number | null;
        label: string;
        kind: 'if' | 'repeatable' | 'section' | 'map' | 'separator';
        isOpening?: boolean;
        isClosing?: boolean;
        isSelfContained?: boolean;
        isError?: boolean;
      }
    >();

    let blockCounter = 1;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(value)) !== null) {
      const token = match[0];
      const matchIndex = match.index;

      if (token.startsWith(':::')) {
        const trimmed = token.trim();
        const isClosing = token === ':::';

        if (isClosing) {
          if (stack.length > 0) {
            const openBlock = stack.pop()!;
            openBlock.endIndex = matchIndex + token.length;
            completedBlocks.push(openBlock);

            tokenMetadata.set(matchIndex, {
              blockId: openBlock.id,
              label: openBlock.label,
              kind: openBlock.kind,
              isClosing: true,
            });
          } else {
            // Orphan closing tag
            tokenMetadata.set(matchIndex, {
              blockId: null,
              label: 'Cierre huérfano',
              kind: 'section',
              isClosing: true,
              isError: true,
            });
          }
        } else {
          // Opening directive
          const inside = trimmed.replace(/^:::/, '').replace(/:::\s*$/, '').trim();
          const lower = inside.toLowerCase();
          const isSeparator =
            inside === '---';
          const isInline =
            (lower.startsWith('if ') || lower.startsWith('if:')) && isInlineConditional(inside);

          let kind: BlockMeta['kind'] = 'section';
          if (lower.startsWith('if ') || lower.startsWith('if:')) kind = 'if';
          else if (lower.startsWith('map ') || lower.startsWith('map:')) kind = 'map';
          else if (inside.includes('*')) kind = 'repeatable';
          else if (isSeparator) kind = 'separator';

          if (isSeparator || isInline) {
            tokenMetadata.set(matchIndex, {
              blockId: null,
              label: inside,
              kind,
              isSelfContained: true,
            });
          } else {
            const id = blockCounter++;
            const meta: BlockMeta = {
              id,
              label: inside,
              kind,
              startIndex: matchIndex,
            };
            stack.push(meta);

            tokenMetadata.set(matchIndex, {
              blockId: id,
              label: inside,
              kind,
              isOpening: true,
            });
          }
        }
      }
    }

    // Any remaining blocks in stack are unclosed
    while (stack.length > 0) {
      completedBlocks.push(stack.pop()!);
    }

    return { tokenMetadata, completedBlocks, totalBlocks: blockCounter - 1 };
  }, [value]);

  // Current active block trail at cursor position (Breadcrumbs)
  const activeBreadcrumbs = useMemo(() => {
    const offset = cursorPos.charOffset;
    if (!offset || !blockPairs.completedBlocks.length) return [];

    return blockPairs.completedBlocks
      .filter((b) => b.startIndex <= offset && (b.endIndex === undefined || offset <= b.endIndex))
      .sort((a, b) => a.startIndex - b.startIndex);
  }, [cursorPos.charOffset, blockPairs.completedBlocks]);

  // Innermost block where cursor currently is, or hovered block
  const currentActiveBlockId = useMemo(() => {
    if (hoveredBlockId !== null) return hoveredBlockId;
    if (activeBreadcrumbs.length > 0) {
      return activeBreadcrumbs[activeBreadcrumbs.length - 1]!.id;
    }
    return null;
  }, [hoveredBlockId, activeBreadcrumbs]);

  // ─── Render Colons with Circular Number Badges (: ① :) ──────────────────
  // Uses exact 3 monospace characters (: : :) in DOM flow + absolute centered badge.
  // This guarantees 100% mathematical zero-drift character alignment with textarea!
  const renderColons = useCallback(
    (
      blockId: number | null,
      isOpening: boolean,
      suffixText: string = ''
    ) => {
      if (!showBlockNumbers || blockId === null) {
        return (
          <span className="font-mono font-bold tracking-tight">
            :::{suffixText}
          </span>
        );
      }

      const palette = BLOCK_PALETTES[(blockId - 1) % BLOCK_PALETTES.length]!;
      const isHighlighted = currentActiveBlockId === blockId;

      return (
        <span
          className={cn(
            'relative inline font-mono select-none',
            palette.colonText
          )}
          style={{ lineHeight: '22px' }}
          title={`Sección #${blockId} (${isOpening ? 'Apertura' : 'Cierre'})`}
        >
          {/* Exact 3 monospace characters in DOM flow to guarantee zero-drift */}
          <span className="font-bold opacity-60">:</span>
          <span className="opacity-0 font-bold select-none">:</span>
          <span className="font-bold opacity-60">:</span>

          {/* Absolutely centered circular badge (takes 0px in flow) */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: '22px', top: 0 }}>
            <span
              className={cn(
                'w-[13px] h-[13px] rounded-full flex items-center justify-center font-sans font-extrabold leading-none text-white shadow-2xs transition-transform',
                palette.circleBg,
                isHighlighted && `${palette.circleRing} ring-1 ring-offset-1 ring-offset-background scale-110 shadow-sm`,
                blockId >= 10 ? 'text-[6.5px]' : 'text-[8px]'
              )}
            >
              {blockId}
            </span>
          </span>
          {suffixText}
        </span>
      );
    },
    [showBlockNumbers, currentActiveBlockId]
  );

  // ─── Parse and Render Highlighted Tokens ───────────────────────────────
  const highlightedNodes = useMemo(() => {
    if (!isHighlightEnabled || !value) {
      return value ? <span>{value}</span> : null;
    }

    const masterRegex =
      /(:::(?!\s*:::)([^\n\r:]|:(?!::))+?:::|:::|<<|>>|\\[*{}[\]:\\]|\{[^{}\n\r]+\}\*?|\[\?[^\]\n\r]*\]|\[\/\]|\["[^"\n\r]*"\]\*?)/g;


    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = masterRegex.exec(value)) !== null) {
      // Plain text before token
      if (match.index > lastIdx) {
        elements.push(
          <span key={`txt_${lastIdx}`} className="text-foreground">
            {value.substring(lastIdx, match.index)}
          </span>
        );
      }

      const token = match[0];
      const matchIndex = match.index;
      const key = `tok_${matchIndex}`;
      const meta = blockPairs.tokenMetadata.get(matchIndex);

      if (token.startsWith(':::')) {
        const blockId = meta?.blockId ?? null;
        const palette = blockId ? BLOCK_PALETTES[(blockId - 1) % BLOCK_PALETTES.length]! : null;
        const isHighlighted = blockId !== null && currentActiveBlockId === blockId;

        if (meta?.isClosing) {
          // Closing directive: :::
          elements.push(
            <span
              key={key}
              onMouseEnter={() => blockId && setHoveredBlockId(blockId)}
              onMouseLeave={() => setHoveredBlockId(null)}
              title={
                meta.isError
                  ? '⚠️ Directiva de cierre ::: huérfana (sin bloque de apertura correspondiente)'
                  : `Cierre de Sección #${blockId}: ${meta.label}`
              }
              className={cn(
                'inline font-bold rounded-xs transition-colors duration-150 cursor-pointer',
                meta.isError
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-b border-rose-500/50'
                  : palette
                  ? `${palette.badge}`
                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-b border-purple-500/40',
                isHighlighted && palette && `${palette.hoverGlow}`
              )}
            >
              {meta.isError ? (
                <span className="relative inline font-mono select-none text-rose-600 dark:text-rose-400" style={{ lineHeight: '22px' }}>
                  <span className="font-bold opacity-60">:</span>
                  <span className="opacity-0 font-bold select-none">:</span>
                  <span className="font-bold opacity-60">:</span>
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: '22px', top: 0 }}>
                    <span className="w-[13px] h-[13px] rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] font-extrabold leading-none shadow-2xs">
                      !
                    </span>
                  </span>
                </span>
              ) : (
                renderColons(blockId, false)
              )}
            </span>
          );
        } else if (meta?.isSelfContained) {

          // Self-contained directives (separators, inline conditionals)
          const lower = token.toLowerCase();
          const isSeparator = token.includes('---');
          elements.push(
            <span
              key={key}
              title={isSeparator ? 'Separador visual' : 'Condicional inline'}
              className={cn(
                'inline font-medium rounded-xs border-b',
                isSeparator
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
              )}
            >
              {token}
            </span>
          );
        } else if (meta?.isOpening) {
          // Opening directives: ::: NOMBRE :::
          // Split into: opening colons (3 chars), content inside, and closing colons (3 chars)
          const endsWithThreeColons = token.endsWith(':::');
          const inside = endsWithThreeColons ? token.slice(3, -3) : token.slice(3);

          elements.push(
            <span
              key={key}
              onMouseEnter={() => blockId && setHoveredBlockId(blockId)}
              onMouseLeave={() => setHoveredBlockId(null)}
              title={`Apertura de Sección #${blockId}: ${meta.label}`}
              className={cn(
                'inline font-semibold rounded-xs transition-colors duration-150 cursor-pointer',
                palette ? palette.badge : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-b border-purple-500/40',
                isHighlighted && palette && `${palette.hoverGlow}`
              )}
            >
              {renderColons(blockId, true)}
              <span>{inside}</span>
              {endsWithThreeColons && renderColons(blockId, true)}
            </span>
          );
        } else {
          // Default directive fallback
          elements.push(
            <span
              key={key}
              className="inline font-bold rounded-xs bg-purple-500/15 text-purple-700 dark:text-purple-300 border-b border-purple-500/40"
            >
              {token}
            </span>
          );
        }
      } else if (token === '<<' || token === '>>') {
        // Summary markers
        elements.push(
          <span
            key={key}
            title="Marcador de Resumen Ejecutivo"
            className="inline font-extrabold rounded-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 border-b border-blue-500/40"
          >
            {token}
          </span>
        );
      } else if (token.startsWith('\\')) {
        // Escaped characters (\* \: \{ etc.)
        elements.push(
          <span
            key={key}
            title={`Carácter escapado literal: ${token.slice(1)}`}
            className="inline font-mono font-bold rounded-xs bg-muted text-muted-foreground border-b border-muted-foreground/30"
          >
            {token}
          </span>
        );
      } else if (token.startsWith('{') && token.includes('}')) {
        // Fields {FieldName:...}
        const inner = token.slice(1, token.endsWith('}*') ? -2 : -1);
        const fieldId = inner.split(/[:|]/)[0]?.trim().toLowerCase() || '';
        const isRepeatableField = token.endsWith('}*');

        if (fieldId === 'photos' || fieldId === 'fotos') {
          // Photo marker
          elements.push(
            <span
              key={key}
              title="Marcador de fotos adjuntas"
              className="inline font-semibold rounded-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 border-b border-rose-500/40"
            >
              {token}
            </span>
          );
        } else if (SYSTEM_VARS.has(fieldId)) {
          // System predefined variable
          elements.push(
            <span
              key={key}
              title="Variable predefinida del sistema / Espacio de trabajo"
              className="inline font-semibold rounded-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/40"
            >
              {token}
            </span>
          );
        } else if (fieldId.includes('.') || STAFF_PROTOCOL_NAMES.has(fieldId)) {
          // Staff member property / protocol
          elements.push(
            <span
              key={key}
              title="Campo de personal institucional / Notación de protocolo"
              className="inline font-semibold rounded-xs bg-teal-500/15 text-teal-700 dark:text-teal-300 border-b border-teal-500/40"
            >
              {token}
            </span>
          );
        } else {
          // Dynamic form field
          elements.push(
            <span
              key={key}
              title={isRepeatableField ? 'Campo repetible inline' : 'Campo interactivo de formulario'}
              className="inline font-semibold rounded-xs bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-b border-indigo-500/40"
            >
              {token}
            </span>
          );
        }
      } else if (token.startsWith('[')) {
        // Legacy bracket tags [...]
        elements.push(
          <span
            key={key}
            title="Sintaxis legada [...] (se recomienda migrar a :::)"
            className="inline font-mono rounded-xs bg-slate-500/15 text-slate-600 dark:text-slate-400 border-b border-slate-500/30"
          >
            {token}
          </span>
        );
      } else {
        elements.push(
          <span key={key} className="text-foreground">
            {token}
          </span>
        );
      }

      lastIdx = match.index + token.length;
    }

    if (lastIdx < value.length) {
      elements.push(
        <span key={`txt_end`} className="text-foreground">
          {value.substring(lastIdx)}
        </span>
      );
    }

    // Trailing newline spacer so height matches textarea caret
    if (value.endsWith('\n')) {
      elements.push(<br key="br_end" />);
    }

    return elements;
  }, [value, isHighlightEnabled, blockPairs, showBlockNumbers, currentActiveBlockId, renderColons]);

  return (
    <div
      className={cn(
        'relative flex-1 flex flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all',
        className
      )}
    >
      {/* ─── Compact Top Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b border-border/80 text-xs shrink-0 select-none">
        {/* Left: Quick Insertions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 bg-background shadow-xs hover:bg-muted gap-1 border-border/80 font-medium"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Insertar Directiva</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estructura del Reporte
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => insertSnippet('::: NOMBRE SECCIÓN :::\n\n:::\n', 4)}>
                <Layers className="mr-2 h-3.5 w-3.5 text-purple-500" />
                <span>Sección Estándar</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  insertSnippet('::: section Novedades* :::\n- *DESCRIPCIÓN:* {descripcion:textarea}\n:::\n', 12)
                }
              >
                <Layers className="mr-2 h-3.5 w-3.5 text-violet-500" />
                <span>Sección Repetible (*)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  insertSnippet(
                    '::: section Novedades | Novedad* :::\n- *DESCRIPCIÓN:* {descripcion:textarea}\n:::\n',
                    12
                  )
                }
              >
                <Layers className="mr-2 h-3.5 w-3.5 text-violet-500" />
                <span>Sección Singular / Plural</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('::: --- :::\n')}>
                <FileText className="mr-2 h-3.5 w-3.5 text-sky-500" />
                <span>Separador Visual</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('<<\n\n>>\n', 3)}>
                <FileText className="mr-2 h-3.5 w-3.5 text-blue-500" />
                <span>Resumen Ejecutivo &lt;&lt; &gt;&gt;</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Condicionales
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  insertSnippet(
                    '::: if Director.sex == "F" :::\n*DIRECTORA*\n{Director}\n:::\n::: if Director.sex == "M" :::\n*DIRECTOR*\n{Director}\n:::\n'
                  )
                }
              >
                <GitBranch className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Condicional de Género</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('::: if Campo != "" :::\n\n:::\n', 7)}>
                <GitBranch className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Condicional Presencia ( != &quot;&quot; )</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('::: if Estatus == "Finalizado":show :::\n\n:::\n', 7)}>
                <GitBranch className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Condicional Formulario (:show)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 bg-background shadow-xs hover:bg-muted gap-1 border-border/80 font-medium"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-500" />
                <span>Insertar Campo</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Variables del Sistema
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => insertSnippet('{Fecha:req}')}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <span>Fecha Actual ({'{Fecha}'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Hora:req}')}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <span>Hora Actual ({'{Hora}'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Municipio:upper}')}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <span>Municipio ({'{Municipio}'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Estado:upper}\\*')}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <span>Estado ({'{Estado}\\*'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('“{Guardia}”')}>
                <UserCheck className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                <span>Guardia Activa ({'{Guardia}'})</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Personal y Protocolo
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => insertSnippet('{Reporta}')}>
                <UserCheck className="mr-2 h-3.5 w-3.5 text-teal-500" />
                <span>Firma Protocolar ({'{Reporta}'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Analista}')}>
                <UserCheck className="mr-2 h-3.5 w-3.5 text-teal-500" />
                <span>Analista con CI ({'{Analista}'})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Director}')}>
                <UserCheck className="mr-2 h-3.5 w-3.5 text-teal-500" />
                <span>Director ({'{Director}'})</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Campos Dinámicos
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => insertSnippet('{NombreCampo:req}', 1)}>
                <FileText className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                <span>Texto Requerido (:req)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Descripcion:textarea:req}', 1)}>
                <FileText className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                <span>Texto Largo (:textarea)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Tipo:dropdown(Opcion1=Valor1|Opcion2=Valor2)}', 1)}>
                <FileText className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                <span>Desplegable (:dropdown)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertSnippet('{Campo}*', 1)}>
                <FileText className="mr-2 h-3.5 w-3.5 text-amber-500" />
                <span>Campo Repetible ({'{Campo}*'})</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Section Numbers Toggle + Legend Popover + Highlight Toggle + Copy */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Section Numbering Toggle in Circle */}
          <Button
            type="button"
            variant={showBlockNumbers ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowBlockNumbers(!showBlockNumbers)}
            className="h-7 px-2 text-xs gap-1.5"
            title={
              showBlockNumbers
                ? 'Desactivar círculos numerados de sección'
                : 'Activar círculos numerados de sección'
            }
          >
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-extrabold leading-none shadow-2xs">
              1
            </span>
            <span className="hidden sm:inline">
              {showBlockNumbers ? 'Círculos' : 'Sin Círculos'}
            </span>
          </Button>

          {/* Color Legend Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Ver leyenda de colores de sintaxis"
              >
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Colores</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3 space-y-2.5 text-xs shadow-md">
              <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Leyenda de Sintaxis</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Numeración en círculo:</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="opacity-60">:</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold leading-none">
                      1
                    </span>
                    <span className="opacity-60">: ... :</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold leading-none">
                      1
                    </span>
                    <span className="opacity-60">:</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Secciones estándar:</span>
                  <Badge variant="outline" className="bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                    ::: SECCIÓN :::
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Secciones repetibles:</span>
                  <Badge variant="outline" className="bg-violet-500/15 text-violet-700 dark:text-violet-300 font-mono text-[10px]">
                    ::: section Novedad* :::
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Condicionales lógicos:</span>
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px]">
                    ::: if Condición :::
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Variables de sistema:</span>
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                    {'{Fecha}'}, {'{Municipio}'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Personal y protocolo:</span>
                  <Badge variant="outline" className="bg-teal-500/15 text-teal-700 dark:text-teal-300 font-mono text-[10px]">
                    {'{Director.sex}'}, {'{Reporta}'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Campos interactivos:</span>
                  <Badge variant="outline" className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                    {'{Nombre:req}'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resumen ejecutivo:</span>
                  <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
                    &lt;&lt; ... &gt;&gt;
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Asterisco literal:</span>
                  <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-[10px]">
                    \*
                  </Badge>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle Highlight */}
          <Button
            type="button"
            variant={isHighlightEnabled ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsHighlightEnabled(!isHighlightEnabled)}
            className="h-7 px-2 text-xs gap-1"
            title={isHighlightEnabled ? 'Desactivar resaltado' : 'Activar resaltado'}
          >
            {isHighlightEnabled ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Resaltado</span>
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Plano</span>
              </>
            )}
          </Button>

          {/* Copy Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!value) return;
              navigator.clipboard.writeText(value);
              toast.success('Plantilla copiada al portapapeles');
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Copiar contenido"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Synchronized Editor Surface ───────────────────────────────── */}
      <div className={cn('relative flex-1 w-full bg-background overflow-hidden min-h-0', minHeight)}>
        {/* Layer 1: Background Highlighted Text */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words select-none overflow-y-scroll overflow-x-hidden [scrollbar-color:transparent_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '22px',
            letterSpacing: '0px',
            tabSize: 2,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            padding: '16px',
            margin: 0,
            border: 0,
            boxSizing: 'border-box',
            scrollbarGutter: 'stable',
            scrollbarColor: 'transparent transparent',
            fontVariantLigatures: 'none',
            fontFeatureSettings: '"liga" 0, "calt" 0',
          }}
        >
          {highlightedNodes}
        </div>

        {/* Layer 2: Editable Transparent Textarea with Caret */}
        <textarea
          ref={textareaRef}
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorPosition();
          }}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          className={cn(
            'relative z-10 w-full h-full whitespace-pre-wrap break-words border-0 focus-visible:ring-0 resize-none overflow-y-scroll overflow-x-hidden outline-none',
            isHighlightEnabled
              ? 'bg-transparent text-transparent caret-foreground selection:bg-primary/25 selection:text-transparent'
              : 'bg-background text-foreground selection:bg-primary/25'
          )}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '22px',
            letterSpacing: '0px',
            tabSize: 2,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            padding: '16px',
            margin: 0,
            border: 0,
            boxSizing: 'border-box',
            scrollbarGutter: 'stable',
            fontVariantLigatures: 'none',
            fontFeatureSettings: '"liga" 0, "calt" 0',
          }}
        />
      </div>

      {/* ─── Bottom Status, Breadcrumbs & Validation Bar ────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t border-border/60 text-[11px] text-muted-foreground select-none flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span>
            Lín {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="opacity-40">•</span>
          <span className="hidden sm:inline">
            {stats.lines} {stats.lines === 1 ? 'línea' : 'líneas'}, {stats.chars} caracteres
          </span>
          {blockPairs.totalBlocks > 0 && (
            <>
              <span className="opacity-40">•</span>
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {blockPairs.totalBlocks} {blockPairs.totalBlocks === 1 ? 'bloque' : 'bloques'}
              </span>
            </>
          )}

          {/* Live Breadcrumb Trail */}
          {activeBreadcrumbs.length > 0 && (
            <>
              <span className="opacity-40 hidden md:inline">•</span>
              <div className="hidden md:flex items-center gap-1 text-[10px] bg-background/80 px-2 py-0.5 rounded border border-border/60">
                {activeBreadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.id}>
                    {idx > 0 && <span className="opacity-40">&gt;</span>}
                    <span
                      onMouseEnter={() => setHoveredBlockId(bc.id)}
                      onMouseLeave={() => setHoveredBlockId(null)}
                      className="inline-flex items-center gap-1 cursor-pointer hover:underline text-[10px] font-medium"
                      title={`Bloque #${bc.id}: ${bc.label}`}
                    >
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-bold text-white shrink-0 shadow-2xs',
                          BLOCK_PALETTES[(bc.id - 1) % BLOCK_PALETTES.length]?.circleBg
                        )}
                      >
                        {bc.id}
                      </span>
                      <span className="truncate max-w-[120px]">{bc.label}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {validation.valid ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Sintaxis válida</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium truncate max-w-[200px] sm:max-w-none"
              title={validation.error}
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{validation.error || 'Error de sintaxis'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
