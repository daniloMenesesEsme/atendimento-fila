FROM amir20/docker-alpine-puppeteer

# Define o diretório de trabalho
WORKDIR /app

# Define variáveis de ambiente para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Instala o Chromium e outras dependências necessárias para o Puppeteer
RUN set -x \
    && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev

# Copia os arquivos da aplicação
COPY backend/package*.json ./
COPY backend/ ./

# Instala as dependências do Node.js
RUN npm install

# Define variáveis de ambiente para a aplicação
ENV PORT=3000
ENV NODE_ENV=production

# Expõe a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"] 