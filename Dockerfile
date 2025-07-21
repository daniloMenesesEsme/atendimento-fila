FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Instala ferramentas de build e Python, e dependências do Puppeteer
RUN apk add --no-cache \
    build-base \
    python3 \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev

# Define variáveis de ambiente para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copia os arquivos da aplicação
COPY backend/package*.json ./
COPY backend/ ./

# Instala as dependências do Node.js
RUN npm cache clean --force && npm ci --loglevel verbose

# Define variáveis de ambiente para a aplicação
ENV PORT=3000
ENV NODE_ENV=production

# Expõe a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"] 