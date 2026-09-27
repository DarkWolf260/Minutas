import React, { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  type FormCreatorField,
  getProtectedTagRanges,
  isFieldTagInText,
  isSystemFieldTag,
} from '../template-compiler';

interface TemplateTextEditorProps {
  templateText: string;
  allCurrentFields: FormCreatorField[];
  onTextChange: (newText: string) => void;
  onResetStandardFormat: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function TemplateTextEditor({
  templateText,
  allCurrentFields,
  onTextChange,
  onResetStandardFormat,
  textareaRef: externalTextareaRef,
}: TemplateTextEditorProps) {
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalTextareaRef || localTextareaRef;
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const handleScrollSync = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const ranges = getProtectedTagRanges(templateText, allCurrentFields);

    if (selectionStart !== selectionEnd) {
      const selectedRangeCollides = ranges.some(
        (r) =>
          (selectionStart < r.end && selectionEnd > r.start) &&
          !(selectionStart <= r.start && selectionEnd >= r.end)
      );

      if (selectedRangeCollides) {
        const allowedNavKeys = [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'Escape',
        ];
        if (!allowedNavKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toast.warning(
            'Tu selección corta una etiqueta protegida. Selecciona la etiqueta completa o modifícala desde los ajustes del campo.',
            { duration: 3000 }
          );
          return;
        }
      }
    } else {
      if (e.key === 'Backspace') {
        const tagEndingAtCursor = ranges.find((r) => r.end === selectionStart);
        if (tagEndingAtCursor) {
          e.preventDefault();
          toast.warning(
            `La etiqueta {${tagEndingAtCursor.label}} no se puede borrar porque está vinculada a un campo.`,
            { duration: 2500 }
          );
          return;
        }
      }

      if (e.key === 'Delete') {
        const tagStartingAtCursor = ranges.find((r) => r.start === selectionStart);
        if (tagStartingAtCursor) {
          e.preventDefault();
          toast.warning(
            `La etiqueta {${tagStartingAtCursor.label}} no se puede borrar porque está vinculada a un campo.`,
            { duration: 2500 }
          );
          return;
        }
      }

      const tagInside = ranges.find((r) => selectionStart > r.start && selectionStart < r.end);
      if (tagInside) {
        const navKeys = [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'Escape',
          'Tab',
        ];
        if (!navKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toast.warning(
            `No puedes modificar el interior de la etiqueta protegida {${tagInside.label}}. Para cambiar su nombre, usa los ajustes del campo.`,
            { duration: 2500 }
          );
          return;
        }
      }
    }
  };

  const renderHighlightedTemplateText = (text: string, currentFields: FormCreatorField[]) => {
    if (!text) return null;

    const tagRegex = /\{[^{}\n\r]+\}|\[""\]|\["[^"\n\r]+"\]/g;
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.substring(lastIdx, match.index));
      }

      const token = match[0];
      const matchedField = currentFields.find((f) => isFieldTagInText(token, f));

      if (token.startsWith('["')) {
        elements.push(
          <mark
            key={match.index}
            className="bg-slate-500/20 dark:bg-slate-400/25 text-slate-800 dark:text-slate-200 font-bold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      } else if (isSystemFieldTag(token)) {
        elements.push(
          <mark
            key={match.index}
            title="Etiqueta especial del sistema (se calcula automáticamente)"
            className="bg-emerald-500/20 dark:bg-emerald-400/25 text-emerald-700 dark:text-emerald-300 font-bold rounded-xs p-0 m-0 border-b border-emerald-500/50"
          >
            {token}
          </mark>
        );
      } else if (matchedField) {
        elements.push(
          <mark
            key={match.index}
            className="bg-indigo-500/20 dark:bg-indigo-400/25 text-indigo-700 dark:text-indigo-300 font-bold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      } else {
        elements.push(
          <mark
            key={match.index}
            className="bg-amber-500/20 dark:bg-amber-400/25 text-amber-700 dark:text-amber-300 font-semibold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      }

      lastIdx = match.index + token.length;
    }

    if (lastIdx < text.length) {
      elements.push(text.substring(lastIdx));
    }

    if (text.endsWith('\n')) {
      elements.push(' ');
    }

    return elements;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Text Mode Header with Standard Format Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Texto por defecto de la planilla
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetStandardFormat}
          className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
          title="Restablecer a formato por viñetas estándar"
        >
          <RotateCcw className="h-3 w-3" />
          Formato estándar
        </Button>
      </div>

      {/* Monospace Text Area with Synchronized Color Highlighting */}
      <div className="relative flex-1 min-h-[380px] rounded-2xl border border-border/80 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        {/* Layer 1: Background Highlighted Text */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-none text-foreground"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {renderHighlightedTemplateText(templateText, allCurrentFields)}
        </div>

        {/* Layer 2: Editable Transparent Textarea with Caret */}
        <textarea
          ref={textareaRef}
          value={templateText}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          onScroll={handleScrollSync}
          placeholder="Escribe el texto de tu planilla aquí..."
          spellCheck={false}
          className="relative z-10 w-full h-full p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border-0 focus-visible:ring-0 resize-none overflow-y-auto bg-transparent text-transparent caret-foreground selection:bg-indigo-500/25 selection:text-transparent outline-none"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        />
      </div>
    </div>
  );
}
