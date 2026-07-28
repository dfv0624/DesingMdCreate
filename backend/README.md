# Backend de Extracción con IA (Gemini)

Este servicio es el motor detrás de la generación de sistemas de diseño automáticos. Utiliza **Fastify**, **Playwright** y la Inteligencia Artificial de **Google (Gemini)** para extraer y procesar la información de cualquier sitio web.

## 🌟 Cómo Funciona

1. Recibe una URL válida a través del endpoint `/api/extract`.
2. Utiliza `Playwright` en modo headless para navegar a la página.
3. Toma una **captura de pantalla completa**.
4. Extrae estilos computados (CSS) y todo el texto del documento (`innerText`).
5. Envía la imagen, el texto y los estilos estructurados a la API de **Gemini** (utilizando el modelo dinámico `gemini-flash-latest`).
6. Devuelve el archivo `DESIGN.md` completamente formateado por la IA.

## 📋 Requisitos

- Node.js 20+
- Instalar dependencias con `npm install` dentro de `backend/`

## 💻 Desarrollo

```bash
npm run dev
```
El servidor escuchará los cambios con `tsx watch` y estará disponible en `http://localhost:3001`.

## 🚀 Producción

```bash
npm run build
npm start
```

## 📡 Endpoint Principal

`POST /api/extract`

**Body:**

```json
{
  "url": "https://www.ejemplo.com"
}
```

**Response:**
Devuelve un JSON con los estilos detectados, la URL final y el atributo `markdown` con el contenido del `DESIGN.md` generado por Gemini.
