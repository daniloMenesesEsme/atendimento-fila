FROM amir20/docker-alpine-puppeteer

# Define o diretório de trabalho
WORKDIR /app

# Instala ferramentas de build e Python, necessárias para algumas dependências do Node.js
RUN apk add --no-cache build-base python3

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