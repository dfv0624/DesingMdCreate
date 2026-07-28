FROM node:20-bookworm-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas para Playwright
# npx playwright install --with-deps necesita apt-get y utilidades básicas
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Instalar dependencias de Node
RUN npm ci

# Instalar Playwright y sus dependencias del sistema
RUN npx playwright install --with-deps chromium

COPY . .

# Compilar Typescript (si aplica)
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
