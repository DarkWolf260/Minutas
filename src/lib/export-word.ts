import { Document, Packer, Paragraph, TextRun, AlignmentType, ShadingType } from 'docx';

// --- CONFIGURACIÓN DE ESTILO ---
const FONT_FAMILY = 'Calibri'; // Puedes cambiar a 'Times New Roman', 'Calibri', etc.
const FONT_SIZE = 22;        // 22 = 11pt, 24 = 12pt
const LINE_SPACING = 150;    // Espaciado entre párrafos
// -------------------------------

export interface WordLine {
  text: string;
  bold?: boolean;
  color?: string;
  isSeparator?: boolean;
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'BOTH';
  pageBreakBefore?: boolean;
}

/**
 * Exports a report to a Word (.docx) document with optional styling.
 * Configured with standard US Letter (Carta) paper dimensions and 1-inch margins.
 */
export async function exportReportToWord(content: string | WordLine[], filename: string) {
  // Convert string content to WordLine array if needed
  const lines: WordLine[] = typeof content === 'string'
    ? content.split('\n').map(line => ({ text: line }))
    : content;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,  // 8.5 x 11 in (Carta / US Letter en DXA)
              height: 15840,
            },
            margin: {
              top: 1440,     // 1 pulgada (1440 DXA)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: lines.map((lineObj) => {
          const { text, bold: forceBold, color, isSeparator, alignment, pageBreakBefore } = lineObj;
          const trimmedLine = text.trim();

          // Basic formatting based on markdown-like indicators
          const isFullBold = trimmedLine.startsWith('*') && trimmedLine.endsWith('*');
          const parts = text.split(/(\*.*?\*)/g);

          return new Paragraph({
            alignment: alignment ? AlignmentType[alignment] : AlignmentType.LEFT,
            pageBreakBefore: pageBreakBefore, // Aplicar salto de página si se solicita
            // Aplicamos sombreado de fondo si hay color y es separador
            shading: (color && isSeparator) ? {
              fill: color,
              type: ShadingType.CLEAR,
              color: "auto",
            } : undefined,
            children: parts.map(part => {
              const isPartBold = part.startsWith('*') && part.endsWith('*');
              return new TextRun({
                text: part || ' ',
                bold: forceBold || isPartBold || (isFullBold && trimmedLine.length > 0),
                size: FONT_SIZE,
                font: FONT_FAMILY,
                // Letras negras para los separadores con fondo claro
                color: (color && isSeparator) ? '000000' : undefined,
              });
            }),
            spacing: {
              before: isSeparator ? 120 : 0,
              after: isSeparator ? 120 : 0,
              line: 240,
            },
          });
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
