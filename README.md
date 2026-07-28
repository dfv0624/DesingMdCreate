# 🎨 Design.md Builder

> **Convierte cualquier URL en un Sistema de Diseño estructurado en segundos.**

**Design.md Builder** es una herramienta inteligente para desarrolladores y diseñadores. Mediante el uso de **Playwright** y la Inteligencia Artificial de **Google (Gemini)**, extrae tokens de diseño (colores, tipografías, espaciados y estructura) directamente desde el DOM de cualquier página web y genera automáticamente un archivo `DESIGN.md` altamente profesional y detallado.

---

## ✨ Características Principales

- 🔍 **Análisis Profundo:** Un navegador sin interfaz (Headless) inspecciona la web solicitada, extrae estilos computados (CSS), y estructura semántica.
- 👁️ **Contexto Visual con IA:** Captura una imagen completa en alta resolución para que el modelo `gemini-flash-latest` interprete el contexto visual de la página de la misma manera que lo haría un diseñador experto.
- 📐 **Ingeniería Inversa:** Genera de forma automática paletas de color, reglas tipográficas, estilos de componentes y diseño de layout.
- ⚡ **Desempeño y Reactividad:** Frontend moderno y ultrarrápido construido en **Angular v21** que ofrece retroalimentación visual interactiva mientras la IA procesa.
- 📦 **Listo para Exportar:** Permite copiar en el portapapeles o descargar directamente el archivo `.md` generado con un solo clic.

---

## 🛠 Arquitectura y Tecnologías

El proyecto se divide en dos entornos altamente optimizados:

### 🖥️ Frontend (`/frontend`)
Aplicación SPA moderna que actúa como interfaz del usuario.
* **Framework:** Angular 21 (TypeScript, SSR)
* **Diseño:** Vanilla CSS puro enfocado en la usabilidad y la estética (Dark mode, glassmorphism, UI fluida).

### ⚙️ Backend AI (`/backend`)
Microservicio que maneja la inspección de DOM, toma de capturas y comunicación con la IA.
* **Framework:** Node.js + Fastify
* **Scraping Avanzado:** Playwright
* **Inteligencia Artificial:** Google Gen AI SDK (`@google/genai`)

---

## 🚀 Instalación y Uso Local

El entorno está preparado para ejecutarse sin configuraciones adicionales de API, ya que por defecto se conecta de forma dinámica al servicio de producción. 

### 1. Inicializar el Backend
*(Ejecuta el backend si deseas procesar las URLs localmente para debug)*
```bash
cd backend
npm install
npm run dev
```
*(El servidor de pruebas se escuchará en el puerto `3001`)*

### 2. Inicializar el Frontend
Abre otra pestaña en tu terminal y ejecuta:
```bash
cd frontend
npm install
npm run dev
```
*(La aplicación se abrirá en tu navegador en `http://localhost:4200/`)*

---

## 💡 ¿Cómo funciona el flujo interno?

1. **Ingreso:** El usuario facilita la URL objetivo en la web.
2. **Scraping Invisible:** Fastify utiliza Playwright para navegar a la URL simulando un usuario real y espera a que el DOM y el tráfico de red se estabilicen.
3. **Data Harvesting:** Se obtiene todo el texto legible (`innerText`) y los CSS computed styles de componentes clave. Paralelamente, se toma un _Full Page Screenshot_.
4. **Razonamiento AI:** Los datos extraídos y la captura visual son enviados a Gemini, quien procesa la información aplicando principios arquitectónicos de sistemas de diseño.
5. **Salida Estructurada:** Se devuelve un archivo `DESIGN.md` con 9 apartados (Tema visual, Colores, Tipografías, Prompts para Agentes, etc.)

---

## 👨‍💻 Créditos
Desarrollado para revolucionar el flujo de trabajo entre diseño y desarrollo web por dfv0624.
