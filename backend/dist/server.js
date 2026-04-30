import cors from '@fastify/cors';
import Fastify from 'fastify';
import { chromium } from 'playwright';
const app = Fastify({ logger: true });
await app.register(cors, {
    origin: true,
});
app.get('/health', async () => ({ ok: true }));
app.post('/api/extract', async (request, reply) => {
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
        const screenshotBuffer = await page.screenshot({
            type: 'png',
            animations: 'disabled',
        });
        const analysis = await page.evaluate((sourceUrl) => {
            const title = document.title.trim() || new URL(sourceUrl).hostname.replace(/^www\./, '');
            const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
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
                visualInsights: null,
                markdown: '',
            };
        }, normalizedUrl);
        analysis.visualInsights = await analyzeVisualInsights({
            screenshotBuffer,
            analysis,
        });
        analysis.markdown = composeMarkdown(analysis);
        return reply.send(analysis);
    }
    catch (error) {
        request.log.error({ error }, 'Failed to extract page data');
        return reply.status(500).send({
            error: 'No se pudo extraer la página.',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
    finally {
        await browser.close().catch(() => undefined);
    }
});
function normalizeUrl(input) {
    const value = input?.trim();
    if (!value) {
        return null;
    }
    try {
        return new URL(value).href;
    }
    catch {
        try {
            return new URL(`https://${value}`).href;
        }
        catch {
            return null;
        }
    }
}
function composeMarkdown(analysis) {
    const headingList = analysis.headings.length > 0 ? analysis.headings.join(' | ') : 'No se detectaron encabezados claros';
    const linkList = analysis.links.length > 0 ? analysis.links.join('\n- ') : 'No se detectaron enlaces relevantes';
    const buttonList = analysis.buttons.length > 0 ? analysis.buttons.join('\n- ') : 'No se detectaron botones o llamadas a la acción';
    const inputList = analysis.inputs.length > 0 ? analysis.inputs.join('\n- ') : 'No se detectaron campos de entrada';
    const primaryColor = analysis.visualInsights?.palette.primary ?? analysis.styleClues.bodyColor;
    const secondaryColor = 'rgb(110, 110, 115)';
    const tertiaryColor = analysis.visualInsights?.palette.tertiary ?? analysis.styleClues.buttonBackground ?? analysis.styleClues.linkColor ?? 'rgb(0, 113, 227)';
    const neutralColor = analysis.visualInsights?.palette.neutral ?? analysis.styleClues.bodyBackground;
    const onTertiaryColor = analysis.visualInsights?.palette.onPrimary ?? analysis.styleClues.buttonTextColor ?? 'rgb(255, 255, 255)';
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
        analysis.visualInsights?.summary ? `Lectura visual: ${analysis.visualInsights.summary}` : 'Lectura visual: no disponible',
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
function yamlString(value) {
    return JSON.stringify(value);
}
async function analyzeVisualInsights(args) {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
    if (!apiKey) {
        return null;
    }
    const screenshotBase64 = args.screenshotBuffer.toString('base64');
    const pageSummary = {
        url: args.analysis.finalUrl,
        title: args.analysis.title,
        description: args.analysis.description,
        language: args.analysis.language,
        headings: args.analysis.headings,
        buttons: args.analysis.buttons,
        links: args.analysis.links,
        inputs: args.analysis.inputs,
        styleClues: args.analysis.styleClues,
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: [
                                    'Analiza la captura de pantalla del sitio web y el resumen estructural adjunto.',
                                    'Devuelve JSON válido y sin texto extra con este esquema exacto:',
                                    '{"palette":{"primary":string|null,"secondary":string|null,"tertiary":string|null,"neutral":string|null,"onPrimary":string|null},"summary":string,"notes":string[],"confidence":number|null}',
                                    'La paleta debe priorizar los colores realmente visibles en la captura.',
                                    'Si el DOM y la captura no coinciden, favorece la captura y explica la discrepancia en notes.',
                                    `Resumen estructural: ${JSON.stringify(pageSummary)}`,
                                ].join('\n'),
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: screenshotBase64,
                                },
                            },
                        ],
                    },
                ],
            }),
        });
        if (!response.ok) {
            return null;
        }
        const payload = (await response.json());
        const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
        if (!text) {
            return null;
        }
        const parsed = parseJsonResponse(text);
        if (!parsed?.palette || typeof parsed.summary !== 'string') {
            return null;
        }
        return {
            palette: {
                primary: parsed.palette.primary ?? null,
                secondary: parsed.palette.secondary ?? null,
                tertiary: parsed.palette.tertiary ?? null,
                neutral: parsed.palette.neutral ?? null,
                onPrimary: parsed.palette.onPrimary ?? null,
            },
            summary: parsed.summary,
            notes: Array.isArray(parsed.notes) ? parsed.notes.filter((note) => typeof note === 'string') : [],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
        };
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
function parseJsonResponse(input) {
    const fencedMatch = input.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1] ?? input;
    try {
        return JSON.parse(candidate);
    }
    catch {
        const startIndex = candidate.indexOf('{');
        const endIndex = candidate.lastIndexOf('}');
        if (startIndex >= 0 && endIndex > startIndex) {
            return JSON.parse(candidate.slice(startIndex, endIndex + 1));
        }
        throw new Error('No se pudo parsear la respuesta JSON de Gemini.');
    }
}
await app.listen({ port: 3001, host: '0.0.0.0' });
