FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json primeiro
COPY backend/package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY backend/ ./

# Criar diretório routes se não existir
RUN mkdir -p routes

# Expor a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"] 