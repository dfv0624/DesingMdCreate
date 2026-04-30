import cors from '@fastify/cors';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { chromium } from 'playwright';

type ExtractBody = {
  url?: string;
};

type PageAnalysis = {
  sourceUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  language: string | null;
  headings: string[];
  links: string[];
  buttons: string[];
  inputs: string[];
  sections: number;
  styleClues: {
    bodyFont: string;
    bodyColor: string;
    bodyBackground: string;
    h1FontSize: string | null;
    h1FontWeight: string | null;
    h1LineHeight: string | null;
    buttonRadius: string | null;
    buttonBackground: string | null;
    buttonTextColor: string | null;
    linkColor: string | null;
  };
  markdown: string;
};

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get('/health', async () => ({ ok: true }));

app.post('/api/extract', async (request: FastifyRequest<{ Body: ExtractBody }>, reply: FastifyReply) => {
  const normalizedUrl = normalizeUrl(request.body?.url);

  if (!normalizedUrl) {
    return reply.status(400).send({ error: 'Ingresa una URL válida.' });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
    });

    await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);

    const analysis = await page.evaluate<PageAnalysis, string>((sourceUrl) => {
      const title = document.title.trim() || new URL(sourceUrl).hostname.replace(/^www\./, '');
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
      const language = document.documentElement.getAttribute('lang');

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean)
        .slice(0, 12);

      const links = Array.from(document.querySelectorAll('a'))
        .map((node) => node.textContent?.trim() ?? '')
        .filter((text) => text.length > 0)
        .slice(0, 12);

      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        .map((node) => node.textContent?.trim() ?? '')
        .filter((text) => text.length > 0)
        .slice(0, 12);

      const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
        .map((node) => {
          const label = node.getAttribute('aria-label')?.trim() ?? '';
          const placeholder = node.getAttribute('placeholder')?.trim() ?? '';
          const name = node.getAttribute('name')?.trim() ?? '';
          return label || placeholder || name || node.tagName.toLowerCase();
        })
        .slice(0, 12);

      const sections = document.querySelectorAll('section, article, nav, main, header, footer').length;

      const bodyStyle = getComputedStyle(document.body);
      const h1 = document.querySelector('h1');
      const h1Style = h1 ? getComputedStyle(h1) : null;
      const firstButton = document.querySelector('button, [role="button"]');
      const buttonStyle = firstButton ? getComputedStyle(firstButton) : null;
      const firstLink = document.querySelector('a');
      const linkStyle = firstLink ? getComputedStyle(firstLink) : null;

      return {
        sourceUrl,
        finalUrl: location.href,
        title,
        description,
        language,
        headings,
        links,
        buttons,
        inputs,
        sections,
        styleClues: {
          bodyFont: bodyStyle.fontFamily,
          bodyColor: bodyStyle.color,
          bodyBackground: bodyStyle.backgroundColor,
          h1FontSize: h1Style?.fontSize ?? null,
          h1FontWeight: h1Style?.fontWeight ?? null,
          h1LineHeight: h1Style?.lineHeight ?? null,
          buttonRadius: buttonStyle?.borderRadius ?? null,
          buttonBackground: buttonStyle?.backgroundColor ?? null,
          buttonTextColor: buttonStyle?.color ?? null,
          linkColor: linkStyle?.color ?? null,
        },
        markdown: '',
      };
    }, normalizedUrl);

    analysis.markdown = composeMarkdown(analysis);

    return reply.send(analysis);
  } catch (error) {
    request.log.error({ error }, 'Failed to extract page data');
    return reply.status(500).send({
      error: 'No se pudo extraer la página.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await browser.close().catch(() => undefined);
  }
});

function normalizeUrl(input: string | undefined): string | null {
  const value = input?.trim();

  if (!value) {
    return null;
  }

  try {
    return new URL(value).href;
  } catch {
    try {
      return new URL(`https://${value}`).href;
    } catch {
      return null;
    }
  }
}

function composeMarkdown(analysis: PageAnalysis): string {
  const headingList = analysis.headings.length > 0 ? analysis.headings.join(' | ') : 'No se detectaron encabezados claros';
  const linkList = analysis.links.length > 0 ? analysis.links.join('\n- ') : 'No se detectaron enlaces relevantes';
  const buttonList = analysis.buttons.length > 0 ? analysis.buttons.join('\n- ') : 'No se detectaron botones o llamadas a la acción';
  const inputList = analysis.inputs.length > 0 ? analysis.inputs.join('\n- ') : 'No se detectaron campos de entrada';
  const primaryColor = analysis.styleClues.bodyColor;
  const secondaryColor = 'rgb(110, 110, 115)';
  const tertiaryColor = analysis.styleClues.buttonBackground ?? analysis.styleClues.linkColor ?? 'rgb(0, 113, 227)';
  const neutralColor = analysis.styleClues.bodyBackground;
  const onTertiaryColor = analysis.styleClues.buttonTextColor ?? 'rgb(255, 255, 255)';
  const bodyFont = analysis.styleClues.bodyFont;
  const displayFont = analysis.styleClues.bodyFont;
  const h1FontSize = analysis.styleClues.h1FontSize ?? '3rem';
  const h1FontWeight = analysis.styleClues.h1FontWeight ?? '600';
  const h1LineHeight = analysis.styleClues.h1LineHeight ?? '1.1';
  const labelFontSize = '0.75rem';
  const buttonRadius = analysis.styleClues.buttonRadius ?? '8px';
  const buttonPadding = '12px';

  return [
    '---',
    `version: alpha`,
    `name: ${yamlString(analysis.title)}`,
    `description: ${yamlString(`Automated DESIGN.md generated from ${analysis.finalUrl}`)}`,
    'colors:',
    `  primary: ${yamlString(primaryColor)}`,
    `  secondary: ${yamlString(secondaryColor)}`,
    `  tertiary: ${yamlString(tertiaryColor)}`,
    `  neutral: ${yamlString(neutralColor)}`,
    `  on-tertiary: ${yamlString(onTertiaryColor)}`,
    'typography:',
    '  h1:',
    `    fontFamily: ${yamlString(displayFont)}`,
    `    fontSize: ${yamlString(h1FontSize)}`,
    `    fontWeight: ${yamlString(h1FontWeight)}`,
    `    lineHeight: ${yamlString(h1LineHeight)}`,
    '  body-md:',
    `    fontFamily: ${yamlString(bodyFont)}`,
    `    fontSize: ${yamlString('1rem')}`,
    `    lineHeight: ${yamlString('1.5')}`,
    '  label-caps:',
    `    fontFamily: ${yamlString(bodyFont)}`,
    `    fontSize: ${yamlString(labelFontSize)}`,
    `    letterSpacing: ${yamlString('0.12em')}`,
    'rounded:',
    `  sm: ${yamlString(buttonRadius)}`,
    `  md: ${yamlString('16px')}`,
    'spacing:',
    `  sm: ${yamlString('8px')}`,
    `  md: ${yamlString('16px')}`,
    'components:',
    '  button-primary:',
    '    backgroundColor: "{colors.tertiary}"',
    '    textColor: "{colors.on-tertiary}"',
    '    rounded: "{rounded.sm}"',
    `    padding: ${yamlString(buttonPadding)}`,
    '  button-primary-hover:',
    '    backgroundColor: "{colors.primary}"',
    '---',
    '',
    '## Overview',
    '',
    'Este DESIGN.md fue generado desde DOM real, estilos computados y la estructura semántica visible de la página.',
    `Fuente analizada: ${analysis.sourceUrl}`,
    analysis.description ? `Resumen rápido: ${analysis.description}` : 'Resumen rápido: no detectado',
    analysis.language ? `Idioma: ${analysis.language}` : 'Idioma: no detectado',
    `Secciones estructurales detectadas: ${analysis.sections}`,
    '',
    '## Colors',
    '',
    `- Primary (${primaryColor}): color dominante para texto o énfasis principal según estilos computados.`,
    `- Secondary (${secondaryColor}): tono de apoyo para metadatos y elementos de menor jerarquía.`,
    `- Tertiary (${tertiaryColor}): color de acción principal detectado desde controles visibles.`,
    `- Neutral (${neutralColor}): superficie base del documento.`,
    `- on-tertiary (${onTertiaryColor}): color de texto sobre la acción principal.`,
    '',
    '## Typography',
    '',
    `- H1 uses ${h1FontSize} / ${h1FontWeight} / line-height ${h1LineHeight} with ${displayFont}.`,
    `- Body text uses ${bodyFont}, which matches the dominant document body style.`,
    '- Label text keeps a compact caps-like scale for metadata and utility controls.',
    '',
    '## Layout',
    '',
    `- The page reads as ${analysis.sections > 10 ? 'dense and modular' : analysis.sections > 4 ? 'mixed and editorial' : 'simple and lightweight'}.`,
    '- The body copy, headings, and interactive controls are organized through native DOM structure and computed layout styles.',
    '- Spacing is expressed through the token scale in the front matter, with 8px and 16px as the core rhythm units.',
    '',
    '## Elevation & Depth',
    '',
    '- Depth is intentionally restrained.',
    '- When elevation appears, it comes from native UI surfaces, borders, and computed contrast rather than heavy synthetic shadows.',
    '',
    '## Shapes',
    '',
    `- Primary actions use a rounded radius close to ${buttonRadius}.`,
    '- Secondary surfaces remain softer and less expressive so the content hierarchy stays dominant.',
    '',
    '## Components',
    '',
    '- button-primary: primary action button for generation and export.',
    '- button-primary-hover: hover state for the primary action.',
    '',
    '## Do\'s and Don\'ts',
    '',
    '- Do: preserve the token structure as the authoritative source for generated UIs.',
    '- Do: update the extracted tokens when the source page changes materially.',
    '- Don\'t: add extra sections out of order or duplicate canonical headings.',
  ].join('\n');
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

await app.listen({ port: 3001, host: '0.0.0.0' });
