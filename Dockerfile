FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json primeiro
COPY backend/package*.json ./

# Copiar o resto dos arquivos
COPY backend/ ./

# Instalar dependências
RUN npm install

# Definir variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

# Expor a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"] 