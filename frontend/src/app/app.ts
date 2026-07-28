import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
<main class="shell">
  <section class="hero">
    <p class="eyebrow">Design.md builder</p>
    <h1>Convierte cualquier URL en un archivo design.md</h1>
    <p class="lede">
      Pega una página y deja que la <strong> AI</strong> analice visualmente su estructura y diseño para generar un <strong>Sistema de Diseño</strong> completo.
    </p>

    <div class="input-block">
      <label class="field" for="source-url">
        <span class="sr-only">URL de la página</span>
        <input
          id="source-url"
          type="url"
          autocomplete="off"
          spellcheck="false"
          placeholder="Pega una URL, por ejemplo https://www.apple.com/"
          [value]="url()"
          (input)="updateUrl($event)"
        />
      </label>

      <div class="actions">
        <button type="button" class="primary-button" [disabled]="!canGenerate() || status() === 'loading'" (click)="generate()">
          @if (status() === 'loading') {
            Analizando...
          } @else {
            Generar design.md
          }
        </button>
        <button type="button" class="ghost-button" (click)="openInfo()">
          ¿Cómo funciona?
        </button>
        <button type="button" class="ghost-button" (click)="openDetails()">
          Ver detalles
        </button>
      </div>

      <p class="status-line">
        @if (status() === 'loading') {
          Capturando pantalla y analizando el diseño con Inteligencia Artificial...
        } @else if (status() === 'error') {
          {{ errorMessage() }}
        } @else if (status() === 'ready') {
          Markdown listo para copiar o descargar.
        }
      </p>
    </div>

  </section>

  @if (infoOpen()) {
    <div class="modal-backdrop" (click)="closeInfo()">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="info-title" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <p class="modal-kicker">Guía rápida</p>
            <h2 id="info-title">Cómo funciona</h2>
          </div>
          <button type="button" class="close-button" (click)="closeInfo()" aria-label="Cerrar popup">
            ×
          </button>
        </div>
        
        <p class="info-subtitle" style="text-align: left;">Clona el "ADN visual" de cualquier página en 3 simples pasos.</p>
        
        <div class="steps-grid">
          <article class="step-card">
            <div class="step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h3>1. Pega un enlace</h3>
            <p>Introduce la URL de cualquier página web cuyo diseño quieras tomar como inspiración.</p>
          </article>
          <article class="step-card">
            <div class="step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
            </div>
            <h3>2. La IA hace la magia</h3>
            <p>Nuestro sistema la visita, toma capturas y analiza sus colores, fuentes y espaciados.</p>
          </article>
          <article class="step-card">
            <div class="step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
            </div>
            <h3>3. Listo para usar</h3>
            <p>Obtén un archivo Markdown para dárselo a ChatGPT o a tu equipo de desarrollo.</p>
          </article>
        </div>
      </section>
    </div>
  }

  @if (detailsOpen()) {
    <div class="modal-backdrop" (click)="closeDetails()">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="details-title" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <p class="modal-kicker">Popup informativo</p>
            <h2 id="details-title">Qué hará la app</h2>
          </div>

          <button type="button" class="close-button" (click)="closeDetails()" aria-label="Cerrar popup">
            ×
          </button>
        </div>

        <div class="modal-grid">
          <article class="modal-panel">
            <p class="summary-label">Proceso</p>
            <ul>
              <li><strong>Playwright</strong> navega a la URL y toma una captura de pantalla completa de alta resolución.</li>
              <li>Extraemos los estilos computados y el texto semántico directamente del DOM.</li>
              <li><strong>Gemini Flash</strong> actúa como Arquitecto de Diseño y realiza ingeniería inversa para extraer el sistema completo en Markdown.</li>
            </ul>
          </article>

          <article class="modal-panel modal-panel--dark">
            <div class="preview-header">
              <div>
                <p class="summary-label">Vista previa</p>
                <h3>Markdown inicial</h3>
              </div>

              <button type="button" class="copy-button" (click)="copyMarkdown()">
                @if (copied()) {
                  Copiado
                } @else {
                  Copiar texto
                }
              </button>

              <button type="button" class="copy-button" (click)="downloadMarkdown()">
                Descargar
              </button>
            </div>

            <pre class="markdown-output"><code>{{ markdownPreview() }}</code></pre>
          </article>
        </div>
      </section>
    </div>
  }
    <!-- Creator Badge -->
    <a href="https://dfv0624.com" target="_blank" rel="noopener noreferrer" class="creator-badge" aria-label="Creado por dfv0624">
      <span class="creator-text">Desarrollado por</span>
      <img src="Daniel.png" alt="Creador de la app" />
    </a>
  </main>
  `,
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly url = signal('');
  protected readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  protected readonly copied = signal(false);
  protected readonly detailsOpen = signal(false);
  protected readonly infoOpen = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly generatedMarkdown = signal('');

  protected readonly normalizedUrl = computed(() => this.url().trim());
  protected readonly canGenerate = computed(() => {
    const value = this.normalizeUrl(this.url());

    return value !== null;
  });
  protected readonly markdownPreview = computed(() => {
    const generatedMarkdown = this.generatedMarkdown();

    if (generatedMarkdown) {
      return generatedMarkdown;
    }

    return this.buildPlaceholderMarkdown(this.normalizedUrl() || 'https://example.com');
  });

  protected async generate(): Promise<void> {
    const sourceUrl = this.normalizeUrl(this.url());

    if (!sourceUrl) {
      this.status.set('error');
      this.errorMessage.set('Ingresa una URL válida para empezar.');
      return;
    }

    this.status.set('loading');
    this.errorMessage.set(null);
    this.copied.set(false);

    try {
      const response = await fetch(this.createBackendUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: sourceUrl }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string; details?: string } | null;
        throw new Error(errorBody?.error || errorBody?.details || `No se pudo leer la URL (${response.status}).`);
      }

      const analysis = await response.json() as { markdown?: string; error?: string; details?: string };

      if (!analysis.markdown) {
        throw new Error('El backend no devolvió Markdown.');
      }

      this.generatedMarkdown.set(analysis.markdown);
      this.status.set('ready');
      this.detailsOpen.set(true);
    } catch (error: unknown) {
      this.generatedMarkdown.set('');
      this.status.set('error');
      this.errorMessage.set(this.formatError(error));
    }
  }


  protected openDetails(): void {
    this.detailsOpen.set(true);
  }

  protected closeDetails(): void {
    this.detailsOpen.set(false);
  }

  protected openInfo(): void {
    this.infoOpen.set(true);
  }

  protected closeInfo(): void {
    this.infoOpen.set(false);
  }

  protected async copyMarkdown(): Promise<void> {
    const markdown = this.markdownPreview();

    if (!globalThis.navigator?.clipboard) {
      return;
    }

    await globalThis.navigator.clipboard.writeText(markdown);
    this.copied.set(true);

    globalThis.setTimeout(() => {
      this.copied.set(false);
    }, 1800);
  }

  protected downloadMarkdown(): void {
    const markdown = this.markdownPreview();
    const fileName = this.buildFileName();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const fileUrl = globalThis.URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement('a');

    anchor.href = fileUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();

    globalThis.URL.revokeObjectURL(fileUrl);
  }

  protected setUrl(value: string): void {
    this.url.set(value);
    this.status.set('idle');
    this.errorMessage.set(null);
  }

  protected updateUrl(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.setUrl(target.value);
  }

  private normalizeUrl(value: string): string | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    try {
      return new URL(trimmedValue).href;
    } catch {
      try {
        return new URL(`https://${trimmedValue}`).href;
      } catch {
        return null;
      }
    }
  }

  private createBackendUrl(): string {
    const isLocalhost = globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1';

    // IMPORTANTE: Cambia "tu-backend-url" por la URL real que Render le asignó a tu servicio backend
    const prodUrl = 'https://design-md-backend-production.up.railway.app/api/extract';
    const localUrl = 'http://127.0.0.1:3001/api/extract';

    return isLocalhost ? localUrl : prodUrl;
  }

  private buildPlaceholderMarkdown(sourceUrl: string): string {
    return [
      '# Design System Inspired by Apple',
      '',
      '## 1. Visual Theme & Atmosphere',
      '',
      `- Fuente analizada: ${sourceUrl}`,
      '- Estado: espera a generar para extraer contenido real',
      '- Enfoque: capturar jerarquía, componentes, enlaces, texto visible y señales de estilo',
      '',
      '## 2. Color Palette & Roles',
      '',
      '- Primary: pendiente de inferencia desde el contenido visible y la identidad textual',
      '- Secondary: pendiente de inferencia desde el contenido visible y la identidad textual',
      '- Accent: pendiente de inferencia desde el contenido visible y la identidad textual',
      '',
      '## 3. Typography Rules',
      '',
      '- Display family: pendiente de inferencia desde la jerarquía del contenido',
      '- Text family: pendiente de inferencia desde la jerarquía del contenido',
      '',
      '## 4. Component Stylings',
      '',
      '- Buttons: pendiente de extracción',
      '- Cards & Containers: pendiente de extracción',
      '- Inputs & Forms: pendiente de extracción',
      '',
      '## 5. Layout Principles',
      '',
      '- Espaciado, grid y contenedores: pendiente de extracción',
      '',
      '## 6. Do\'s and Don\'ts',
      '',
      '- Do: mantener consistencia visual y accesibilidad',
      '- Don\'t: depender de reglas ambiguas sin validación de contenido',
    ].join('\n');
  }

  private analyzeContent(rawContent: string, sourceUrl: string): {
    title: string;
    summary: string;
    headings: string[];
    links: string[];
    bullets: string[];
    publishedTime: string | null;
    accessNote: string | null;
    styleClues: {
      hierarchy: string;
      density: string;
      tone: string;
      interaction: string;
      spacing: string;
    };
    sourceUrl: string;
  } {
    const lines = rawContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const title = this.extractTitle(lines, sourceUrl);
    const headings = lines.filter((line) => /^#{1,6}\s+/.test(line)).slice(0, 8);
    const links = this.extractUniqueLinks(rawContent);
    const bullets = this.extractBullets(lines);
    const summary = this.extractSummary(lines, title);
    const publishedTime = this.extractPublishedTime(lines);
    const accessNote = this.extractAccessNote(lines);
    const styleClues = this.deriveStyleClues(lines, headings, links, bullets);

    return {
      title,
      summary,
      headings,
      links,
      bullets,
      publishedTime,
      accessNote,
      styleClues,
      sourceUrl,
    };
  }

  private composeMarkdown(analysis: {
    title: string;
    summary: string;
    headings: string[];
    links: string[];
    bullets: string[];
    publishedTime: string | null;
    accessNote: string | null;
    styleClues: {
      hierarchy: string;
      density: string;
      tone: string;
      interaction: string;
      spacing: string;
    };
    sourceUrl: string;
  }): string {
    const headingList = analysis.headings.length > 0 ? analysis.headings.join(' | ') : 'No se detectaron encabezados claros';
    const linkList = analysis.links.length > 0 ? analysis.links.slice(0, 6).join('\n- ') : 'No se detectaron enlaces relevantes';
    const bulletList = analysis.bullets.length > 0 ? analysis.bullets.slice(0, 6).join('\n- ') : 'No se detectaron bloques de lista relevantes';

    return [
      `# ${analysis.title}`,
      '',
      '## 1. Visual Theme & Atmosphere',
      '',
      `- Fuente analizada: ${analysis.sourceUrl}`,
      `- Título detectado: ${analysis.title}`,
      `- Resumen rápido: ${analysis.summary}`,
      analysis.publishedTime ? `- Publicado: ${analysis.publishedTime}` : '- Publicado: no detectado',
      analysis.accessNote ? `- Nota de acceso: ${analysis.accessNote}` : '- Nota de acceso: sin restricciones detectadas',
      '',
      '## 2. Color Palette & Roles',
      '',
      '- Esta versión frontend extrae contenido textual y estructura visible; la paleta exacta puede inferirse de CSS en la siguiente iteración.',
      '- Primary: pendiente de análisis de estilos y branding textual',
      '- Secondary: pendiente de análisis de estilos y branding textual',
      '- Accent: pendiente de análisis de estilos y branding textual',
      '',
      '## 3. Typography Rules',
      '',
      `- Hierarchy cue: ${analysis.styleClues.hierarchy}`,
      `- Tone cue: ${analysis.styleClues.tone}`,
      '- Display family: pendiente de extracción desde la jerarquía HTML y estilos declarados',
      '- Text family: pendiente de extracción desde la jerarquía HTML y estilos declarados',
      '',
      '## 4. Component Stylings',
      '',
      '- Encabezados detectados:',
      `- ${headingList}`,
      '- Enlaces relevantes:',
      `- ${linkList}`,
      '- Bloques de lista o navegación:',
      `- ${bulletList}`,
      '',
      '## 5. Layout Principles',
      '',
      `- Density cue: ${analysis.styleClues.density}`,
      `- Interaction cue: ${analysis.styleClues.interaction}`,
      `- Spacing cue: ${analysis.styleClues.spacing}`,
      '- El documento se generó desde contenido renderizado, enlaces visibles y listas del documento.',
      '- Para medir bordes, radios y valores exactos, el siguiente paso será agregar análisis de CSS declarada o un backend de renderizado.',
      '',
      '## 6. Do\'s and Don\'ts',
      '',
      '- Do: mantener el flujo de entrada de URL, extracción y exportación de Markdown.',
      '- Do: sumar análisis de CSS declarada para colores, tipografía y layout exactos.',
      '- Don\'t: asumir valores visuales que no se han extraído todavía.',
    ].join('\n');
  }

  private deriveStyleClues(
    lines: string[],
    headings: string[],
    links: string[],
    bullets: string[],
  ): {
    hierarchy: string;
    density: string;
    tone: string;
    interaction: string;
    spacing: string;
  } {
    const headingDepth = headings.reduce((maxDepth, heading) => {
      const match = heading.match(/^(#{1,6})\s+/);

      return Math.max(maxDepth, match ? match[1].length : 0);
    }, 0);

    const lineCount = lines.length;
    const textDensity = lineCount > 160 || links.length > 18 || bullets.length > 18 ? 'alta' : lineCount > 90 ? 'media' : 'baja';
    const navSignal = links.length > 12 ? 'fuerte' : links.length > 6 ? 'media' : 'baja';
    const ctaSignal = bullets.length > 10 ? 'alta' : bullets.length > 4 ? 'media' : 'baja';
    const editorialTone = headingDepth >= 3 ? 'jerarquía editorial profunda' : 'jerarquía editorial compacta';
    const spacingSignal = lineCount > 140 ? 'ritmo denso y modular' : lineCount > 80 ? 'ritmo equilibrado' : 'ritmo aireado';

    return {
      hierarchy: `${editorialTone} con ${headings.length} encabezados detectados`,
      density: `densidad ${textDensity}, navegación ${navSignal} y llamadas a la acción ${ctaSignal}`,
      tone: links.length > 10 ? 'comercial/editorial con navegación amplia' : 'informativo y centrado en contenido',
      interaction: `${links.length} enlaces detectados y ${bullets.length} bloques tipo lista`,
      spacing: spacingSignal,
    };
  }

  private extractTitle(lines: string[], sourceUrl: string): string {
    const titleLine = lines.find((line) => line.startsWith('Title: '));

    if (titleLine) {
      return titleLine.replace('Title: ', '').trim();
    }

    const headingLine = lines.find((line) => line.startsWith('# '));

    if (headingLine) {
      return headingLine.replace(/^#\s+/, '').trim();
    }

    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      return 'Design.md generated report';
    }
  }

  private extractSummary(lines: string[], title: string): string {
    const titleIndex = lines.findIndex((line) => line === `# ${title}` || line.includes(`Title: ${title}`));
    const startIndex = titleIndex >= 0 ? titleIndex + 1 : 0;
    const summaryLines = lines.slice(startIndex).filter((line) => {
      return (
        !/^#{1,6}\s+/.test(line) &&
        !/^\*\s+/.test(line) &&
        !/^[-*+]\s+/.test(line) &&
        !line.startsWith('[') &&
        !line.startsWith('URL Source:') &&
        !line.startsWith('Published Time:') &&
        !line.startsWith('Warning:') &&
        !line.startsWith('Markdown Content:')
      );
    });

    const summary = summaryLines.slice(0, 2).join(' ').slice(0, 160).trim();

    return summary || 'No se detectó un resumen textual claro.';
  }

  private extractAccessNote(lines: string[]): string | null {
    const warningLine = lines.find((line) => line.startsWith('Warning:'));

    if (!warningLine) {
      return null;
    }

    if (/captcha/i.test(warningLine)) {
      return 'El proxy detectó una posible página protegida por CAPTCHA o acceso restringido.';
    }

    return warningLine.replace('Warning: ', '').trim();
  }

  private extractPublishedTime(lines: string[]): string | null {
    const publishedLine = lines.find((line) => line.startsWith('Published Time: '));

    return publishedLine ? publishedLine.replace('Published Time: ', '').trim() : null;
  }

  private extractUniqueLinks(rawContent: string): string[] {
    const linkMatches = rawContent.matchAll(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g);
    const domains = new Set<string>();

    for (const match of linkMatches) {
      const linkTarget = match[2];

      try {
        domains.add(new URL(linkTarget).hostname.replace(/^www\./, ''));
      } catch {
        domains.add(linkTarget);
      }
    }

    return [...domains].slice(0, 8);
  }

  private extractBullets(lines: string[]): string[] {
    return lines
      .filter((line) => /^(\*\s+|[-+]\s+)/.test(line) && !line.startsWith('##'))
      .map((line) => line.replace(/^(\*\s+|[-+]\s+)/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 8);
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo generar el Markdown desde la URL indicada.';
  }

  private buildFileName(): string {
    return 'DESIGN.md';
  }
}
