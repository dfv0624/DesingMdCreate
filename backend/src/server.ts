import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { chromium } from 'playwright';
import { GoogleGenAI } from '@google/genai';

// Inicializar Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  innerText: string;
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
    
    // CAPTURAR PANTALLA
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: true });
    const screenshotBase64 = screenshotBuffer.toString('base64');

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
      
      const innerText = document.body.innerText || '';

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
        innerText,
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

    // Cerramos el navegador tan pronto como no lo necesitemos para liberar recursos
    await browser.close().catch(() => undefined);

    // Prompt detallado para Gemini
    const prompt = `
Eres un diseñador experto en sistemas de diseño y desarrollo frontend.
He extraído los estilos computados, la estructura, los textos y una captura de pantalla completa de la página web solicitada.
Tu tarea es generar un archivo DESIGN.md completo, elegante y bien estructurado basado en la información que te proporciono.

El archivo DESIGN.md debe tener:
1. Un Frontmatter YAML válido delimitado por \`---\` con tokens de diseño como colores (infiriendo del estilo o la imagen), tipografía, spacing, etc.
2. Secciones explicativas sobre la intención de diseño (Overview, Colors, Typography, Layout, Components).
3. Asegúrate de incluir un buen Overview e inferir el propósito principal del sitio analizando el texto (\`innerText\`) y la imagen.
4. Solo debes responder con el texto exacto del archivo DESIGN.md, sin texto introductorio, ni saludos. Tampoco añadas \`\`\`markdown al inicio ni \`\`\` al final. Tu respuesta debe empezar directamente con \`---\`.

Datos extraídos del DOM:
${JSON.stringify({ ...analysis, markdown: undefined }, null, 2)}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: screenshotBase64,
            }
          }
        ],
        config: {
          temperature: 0.2, // Baja temperatura para generar archivos de configuración estables
        }
      });
      
      let generatedMarkdown = response.text || '';
      
      // Limpieza de formato en caso de que el modelo decida añadir bloques de código
      if (generatedMarkdown.startsWith('```markdown')) {
          generatedMarkdown = generatedMarkdown.replace(/^```markdown\n/, '').replace(/\n```$/, '');
      } else if (generatedMarkdown.startsWith('```')) {
          generatedMarkdown = generatedMarkdown.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      analysis.markdown = generatedMarkdown.trim();
      return reply.send(analysis);
      
    } catch (aiError) {
      request.log.error({ aiError }, 'Failed to generate content with Gemini');
      return reply.status(500).send({
        error: 'Error al generar el diseño con Inteligencia Artificial.',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
      });
    }

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

await app.listen({ port: 3001, host: '0.0.0.0' });
