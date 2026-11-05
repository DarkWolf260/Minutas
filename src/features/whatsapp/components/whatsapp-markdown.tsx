import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface WhatsAppMarkdownProps {
  text?: string | null;
  inline?: boolean;
  className?: string;
}

// Regex para detectar tokens de formato en línea de WhatsApp:
// 1. URLs (http/https o www.)
// 2. Monospace inline `código`
// 3. Negrita *texto*
// 4. Cursiva _texto_
// 5. Tachado ~texto~
const INLINE_TOKEN_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s]|`[^`\n]+`|\*[^\s*](?:[\s\S]*?[^\s*])?\*|_[^\s_](?:[\s\S]*?[^\s_])?_|~[^\s~](?:[\s\S]*?[^\s~])?~)/;

function parseInlineTokens(text: string, keyPrefix = ''): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(INLINE_TOKEN_REGEX);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    const key = `${keyPrefix}-${index}`;

    // 1. URLs clickeables
    if (/^https?:\/\//i.test(part) || /^www\./i.test(part)) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-emerald-700 dark:text-emerald-300 underline underline-offset-2 hover:opacity-80 transition-opacity break-all font-medium cursor-pointer"
        >
          {part}
        </a>
      );
      return;
    }

    // 2. Monospace en línea `código`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/30 font-mono text-[11px] sm:text-xs border border-black/5 dark:border-white/10 select-text"
        >
          {part.slice(1, -1)}
        </code>
      );
      return;
    }

    // 3. Negrita *texto* (permite anidación de cursiva/tachado interna)
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      nodes.push(
        <strong key={key} className="font-bold text-foreground">
          {parseInlineTokens(inner, `${key}-b`)}
        </strong>
      );
      return;
    }

    // 4. Cursiva _texto_ (permite anidación interna)
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      const inner = part.slice(1, -1);
      nodes.push(
        <em key={key} className="italic">
          {parseInlineTokens(inner, `${key}-i`)}
        </em>
      );
      return;
    }

    // 5. Tachado ~texto~ (permite anidación interna)
    if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
      const inner = part.slice(1, -1);
      nodes.push(
        <del key={key} className="line-through opacity-80">
          {parseInlineTokens(inner, `${key}-s`)}
        </del>
      );
      return;
    }

    // Texto plano
    nodes.push(<React.Fragment key={key}>{part}</React.Fragment>);
  });

  return nodes;
}

export const WhatsAppMarkdown = memo(function WhatsAppMarkdown({
  text,
  inline = false,
  className
}: WhatsAppMarkdownProps) {
  if (!text || typeof text !== 'string') return null;

  // Modo en línea (para mensajes citados, títulos o previsualizaciones compactas)
  if (inline) {
    const singleLine = text.replace(/\r?\n+/g, ' ');
    return (
      <span className={cn('whitespace-normal break-words', className)}>
        {parseInlineTokens(singleLine, 'inline')}
      </span>
    );
  }

  // Modo bloque completo:
  // 1. Separar bloques de código multilínea (```código```)
  const codeBlockSplit = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={cn('space-y-0.5 text-xs sm:text-sm leading-relaxed', className)}>
      {codeBlockSplit.map((section, sectionIdx) => {
        if (!section) return null;

        // Bloque de código con 3 comillas invertidas
        if (section.startsWith('```') && section.endsWith('```') && section.length >= 6) {
          const rawCode = section.slice(3, -3).replace(/^\r?\n/, '');
          return (
            <pre
              key={`code-${sectionIdx}`}
              className="my-1.5 p-2.5 rounded-xl bg-black/10 dark:bg-black/35 font-mono text-[11px] sm:text-xs overflow-x-auto border border-black/5 dark:border-white/10 select-text whitespace-pre text-foreground"
            >
              <code>{rawCode}</code>
            </pre>
          );
        }

        // Líneas normales de WhatsApp (agrupar citas y listas consecutivas)
        const rawLines = section.split(/\r?\n/);
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < rawLines.length) {
          const line = rawLines[i] ?? '';
          const lineKey = `sec-${sectionIdx}-line-${i}`;

          // Línea vacía
          if (line.trim() === '') {
            elements.push(<div key={lineKey} className="h-2" />);
            i++;
            continue;
          }

          // Citas consecutivas (> cita)
          if (line.startsWith('>') || line.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < rawLines.length) {
              const current = rawLines[i] ?? '';
              if (current.startsWith('>') || current.startsWith('> ')) {
                const textWithoutPrefix = current.startsWith('> ') ? current.slice(2) : current.slice(1);
                quoteLines.push(textWithoutPrefix);
                i++;
              } else {
                break;
              }
            }

            elements.push(
              <blockquote
                key={lineKey}
                className="border-l-[3.5px] border-emerald-600/80 dark:border-emerald-400/80 pl-2.5 py-1 my-1 bg-black/5 dark:bg-black/25 rounded-r text-xs sm:text-[13px] italic opacity-95 space-y-0.5"
              >
                {quoteLines.map((qText, qIdx) => (
                  <div key={qIdx} className="min-h-[1.25em] break-words">
                    {parseInlineTokens(qText, `${lineKey}-q-${qIdx}`)}
                  </div>
                ))}
              </blockquote>
            );
            continue;
          }

          // Lista con viñeta (- item o * item)
          const bulletMatch = line.match(/^[-*]\s+(.*)$/);
          if (bulletMatch && bulletMatch[1]) {
            elements.push(
              <div key={lineKey} className="flex items-start gap-2 my-0.5 pl-1 leading-relaxed">
                <span className="text-emerald-700 dark:text-emerald-400 select-none font-bold text-xs leading-5">
                  •
                </span>
                <span className="flex-1 min-w-0 break-words">
                  {parseInlineTokens(bulletMatch[1], lineKey)}
                </span>
              </div>
            );
            i++;
            continue;
          }

          // Lista numerada (1. item)
          const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
          if (numberMatch && numberMatch[1] && numberMatch[2]) {
            elements.push(
              <div key={lineKey} className="flex items-start gap-2 my-0.5 pl-1 leading-relaxed">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 min-w-[1.25rem] text-right select-none font-mono text-[11px] leading-5">
                  {numberMatch[1]}.
                </span>
                <span className="flex-1 min-w-0 break-words">
                  {parseInlineTokens(numberMatch[2], lineKey)}
                </span>
              </div>
            );
            i++;
            continue;
          }

          // Línea de texto estándar
          elements.push(
            <div key={lineKey} className="min-h-[1.25em] break-words">
              {parseInlineTokens(line, lineKey)}
            </div>
          );
          i++;
        }

        return <React.Fragment key={`sec-${sectionIdx}`}>{elements}</React.Fragment>;
      })}
    </div>
  );
});
