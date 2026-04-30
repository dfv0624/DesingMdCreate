# Backend de extracción

Servicio mínimo con Fastify + Playwright para extraer DOM, estilos computados y generar Markdown desde una URL.

## Requisitos

- Node.js 20+
- Instalar dependencias con `npm install` dentro de `backend/`

## Desarrollo

```bash
npm run dev
```

## Producción local

```bash
npm run build
npm start
```

## Endpoint

`POST /api/extract`

Body:

```json
{
  "url": "https://www.apple.com"
}
```

Response:
- `title`, `description`, `headings`, `links`, `buttons`, `inputs`
- `styleClues`
- `markdown`
