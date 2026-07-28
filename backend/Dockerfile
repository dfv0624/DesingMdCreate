FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package*.json ./

# Instalar dependencias de Node
RUN npm ci

COPY . .

# Compilar Typescript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
