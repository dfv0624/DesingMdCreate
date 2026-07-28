FROM mcr.microsoft.com/playwright:v1.62.0-noble

WORKDIR /app

COPY package.json ./

# Instala también las dependencias de desarrollo: `tsx` es el comando de inicio.
# La imagen oficial de Playwright ya incluye Chromium y las librerías del SO
# necesarias para ejecutarlo dentro de Railway.
RUN npm install

COPY . .

# Compilar Typescript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
