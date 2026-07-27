# Design MD Create

**Design MD Create** es una herramienta automatizada para desarrolladores y diseñadores que extrae tokens de diseño, colores, tipografías y estructura directamente desde cualquier página web y genera automáticamente un archivo `DESIGN.md` con todo el sistema de diseño.

Este proyecto utiliza **Playwright** para analizar el DOM real y **Google Gemini AI** para entender el contexto visual (mediante capturas de pantalla completas) y semántico de la web.

## 🚀 Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:

- **`/src` (Frontend):** Aplicación desarrollada en Angular (v21) que permite ingresar una URL y visualizar el diseño generado de forma estructurada.
- **`/backend` (Servidor AI):** Servidor Node.js + Fastify que utiliza Playwright para navegar por la web solicitada de forma invisible y la API de Gemini para procesar la información.

## 🤖 Integración con Inteligencia Artificial

El backend cuenta con una integración avanzada con el modelo **`gemini-flash-latest`** de Google AI Studio. 
El flujo de extracción funciona de la siguiente manera:
1. El backend recibe la URL deseada.
2. Un navegador sin interfaz (Headless) carga la página.
3. Se extraen estilos CSS computados (colores, fuentes, botones, headings) y todo el texto legible (`innerText`).
4. Se toma una captura de pantalla completa de alta resolución.
5. Todo este paquete de datos visuales y estructurales se envía a la IA (Gemini).
6. Gemini analiza la web como un diseñador experto y devuelve un archivo `DESIGN.md` profesional.

## ⚙️ Configuración e Instalación

### 1. Variables de Entorno (Importante)
Necesitas una API Key gratuita de Google AI Studio.
1. Entra a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Crea una clave en un **Nuevo Proyecto** (sin facturación para la capa gratuita).
3. Duplica el archivo `backend/.env.example`, nómbralo `backend/.env` y pega ahí tu API Key:
   ```env
   GEMINI_API_KEY=tu_nueva_api_key_aqui
   ```

### 2. Arrancar el Backend
Abre una terminal y ejecuta:
```bash
cd backend
npm install
npm run dev
```
El servidor escuchará en el puerto `3001`.

### 3. Arrancar el Frontend
Abre otra pestaña en tu terminal y ejecuta:
```bash
npm install
ng serve
```
Abre tu navegador en `http://localhost:4200/`.

## 🛠 Tecnologías Utilizadas

- **Frontend:** Angular 21, TypeScript
- **Backend:** Node.js, Fastify, TypeScript
- **Scraping:** Playwright
- **Inteligencia Artificial:** Google Gen AI SDK (`@google/genai`), Modelo Flash
