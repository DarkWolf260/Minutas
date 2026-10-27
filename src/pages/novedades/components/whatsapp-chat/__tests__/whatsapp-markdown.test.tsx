import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WhatsAppMarkdown } from '../whatsapp-markdown';

describe('WhatsAppMarkdown', () => {
  it('renders plain text correctly', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Hola mundo" />);
    expect(html).toContain('Hola mundo');
  });

  it('renders bold text with *', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Este texto es *negrita* y esto normal" />);
    expect(html).toContain('<strong class="font-bold text-foreground">negrita</strong>');
  });

  it('renders italic text with _', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Texto en _cursiva_" />);
    expect(html).toContain('<em class="italic">cursiva</em>');
  });

  it('renders strikethrough with ~', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Texto ~tachado~" />);
    expect(html).toContain('<del class="line-through opacity-80">tachado</del>');
  });

  it('renders inline code with backticks', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Comando `npm run dev`" />);
    expect(html).toContain('<code');
    expect(html).toContain('npm run dev</code>');
  });

  it('renders multi-line code blocks with 3 backticks', () => {
    const markdown = '```\nconsole.log("hola");\nreturn true;\n```';
    const html = renderToStaticMarkup(<WhatsAppMarkdown text={markdown} />);
    expect(html).toContain('<pre');
    expect(html).toContain('console.log(&quot;hola&quot;);');
  });

  it('renders blockquote with >', () => {
    const markdown = '> Esta es una cita importante\n> Segunda línea';
    const html = renderToStaticMarkup(<WhatsAppMarkdown text={markdown} />);
    expect(html).toContain('<blockquote');
    expect(html).toContain('Esta es una cita importante');
    expect(html).toContain('Segunda línea');
  });

  it('renders bullet lists and numbered lists', () => {
    const markdown = '- Elemento 1\n* Elemento 2\n1. Primer paso';
    const html = renderToStaticMarkup(<WhatsAppMarkdown text={markdown} />);
    expect(html).toContain('Elemento 1');
    expect(html).toContain('Elemento 2');
    expect(html).toContain('Primer paso');
    expect(html).toContain('•');
    expect(html).toContain('1.');
  });

  it('renders clickable links safely', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="Ver más en https://example.com/info" />);
    expect(html).toContain('href="https://example.com/info"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('supports nested bold and italic', () => {
    const html = renderToStaticMarkup(<WhatsAppMarkdown text="*_ambos formatos_*" />);
    expect(html).toContain('<strong class="font-bold text-foreground"><em class="italic">ambos formatos</em></strong>');
  });

  it('renders inline mode cleanly without blocks', () => {
    const html = renderToStaticMarkup(
      <WhatsAppMarkdown text="Mensaje citado con *negrita* y salto\nde línea" inline />
    );
    expect(html).toContain('<strong class="font-bold text-foreground">negrita</strong>');
    expect(html).not.toContain('<pre');
    expect(html).not.toContain('<blockquote');
  });
});
