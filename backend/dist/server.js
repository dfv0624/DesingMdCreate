import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { chromium } from 'playwright';
import { GoogleGenAI } from '@google/genai';
// Inicializar Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });
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
        // Prompt detallado para Gemini basado en las instrucciones del Arquitecto de Sistemas de Diseño
        const prompt = `
Actúa como un experto Arquitecto de Sistemas de Diseño (Design System Architect) y Diseñador UI/UX Senior.

Tu tarea es analizar exhaustivamente la siguiente página web/imagen (basado en los datos y captura adjuntos) y realizar ingeniería inversa para extraer su sistema de diseño.

Debes generar un documento en formato Markdown (MD) estructurado estrictamente en las siguientes 9 secciones, manteniendo el mismo formato, tablas y uso de bloques de código (inline code) para los colores hexagonales y propiedades CSS:

---
version: 1.0.0
# [AQUÍ PUEDES INCLUIR EL FRONTMATTER YAML CON TOKENS SI LO CONSIDERAS ÚTIL, pero la salida principal debe ser el MD en 9 secciones]
---

# Sistema de Diseño Inspirado en [Nombre de la Marca deducido]

1. Tema Visual y Atmósfera
Redacta 2-3 párrafos describiendo la personalidad, el tono, la densidad de información y la intención general de la interfaz (ej. minimalista, corporativa, lúdica, cuadrícula rota). Incluye una lista con 4-5 "Características Clave".

2. Paleta de Colores y Roles
Divide en subsecciones: Principales, Secundarios/Acentos, Superficies/Fondos, Neutros/Textos. Describe la función de cada uno e incluye el código Hexadecimal en formato de código en línea (ej. \`#FFFFFF\`).

3. Reglas Tipográficas
Identifica las familias de fuentes (Display y Text). Crea una tabla de Jerarquía con las columnas: Rol, Tamaño Aprox, Peso, Notas (incluye roles como Hero Titular, Títulos, Body, Etiquetas). Luego, añade una lista de "Principios" sobre cómo usan la tipografía (contraste, interlineado, etc.).

4. Estilos de Componentes
Describe detalladamente la geometría, bordes (border-radius), y comportamientos de:
* Botones (Primarios, Secundarios, formas de píldora/cuadrados).
* Tarjetas y Contenedores (Cards, sombras, bordes).
* Navegación (Header, menús).
* Tratamiento de Imágenes (recortes, bordes, superposiciones).

5. Principios de Diseño de Interfaz (Layout)
Explica el sistema de espaciado, el uso de la cuadrícula (grids), la alineación y la filosofía del espacio en blanco.

6. Profundidad y Elevación
Crea una tabla describiendo los niveles de profundidad (ej. Nivel 0, Nivel 1, Nivel 2) con las columnas: Nivel, Tratamiento (propiedades box-shadow o colores) y Uso. Explica brevemente la estrategia de profundidad (ej. sombras duras vs difusas).

7. Qué hacer y Qué no hacer (Do's and Don'ts)
Proporciona una lista concisa de 4 reglas estrictas de "Hacer (Do)" y 4 reglas de "No Hacer (Don't)" para mantener la coherencia visual de la marca.

8. Comportamiento Responsivo
Crea una tabla de Breakpoints inferidos con las columnas: Nombre (Móvil, Tablet, Desktop), y Cambios Clave (cómo colapsa el layout). Describe la estrategia de elementos táctiles y colapso de módulos.

9. Guía de Prompts para Agentes
Crea una "Referencia Rápida de Colores" en viñetas. Luego, redacta 3 "Ejemplos de Componentes", que sean prompts listos para que otra IA pueda generar componentes UI específicos combinando los colores, fuentes y radios de borde de esta marca.

Restricciones: No inventes datos; si algo no es visible, infiérelo lógicamente basándote en las mejores prácticas de UI/UX, pero aclarando que es inferido. El formato final debe ser puro Markdown válido. No incluyas saludos ni explicaciones fuera del documento Markdown.

Datos extraídos del DOM:
${JSON.stringify({ ...analysis, markdown: undefined }, null, 2)}
`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
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
            }
            else if (generatedMarkdown.startsWith('```')) {
                generatedMarkdown = generatedMarkdown.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            analysis.markdown = generatedMarkdown.trim();
            return reply.send(analysis);
        }
        catch (aiError) {
            request.log.error({ aiError }, 'Failed to generate content with Gemini');
            return reply.status(500).send({
                error: 'Error al generar el diseño con Inteligencia Artificial.',
                details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
            });
        }
    }
    catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown error';
        // `err` conserva el stack en los logs de Fastify/Pino y `details` hace que
        // Railway muestre el motivo aunque su visor compacte los objetos JSON.
        request.log.error({ err: error, details }, 'Failed to extract page data');
        return reply.status(500).send({
            error: 'No se pudo extraer la página.',
            details,
        });
    }
    finally {
        await browser?.close().catch(() => undefined);
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
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
await app.listen({ port, host: '0.0.0.0' });
