FROM node:18-alpine

WORKDIR /app

# Copiar os arquivos do backend
COPY backend/package*.json ./
RUN npm install

COPY backend/ .

# Expor a porta que o servidor usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"] 