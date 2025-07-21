FROM amir20/docker-alpine-puppeteer

# Define o diretório de trabalho
WORKDIR /app

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