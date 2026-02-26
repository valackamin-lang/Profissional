# Dockerfile para o backend (Node.js + TypeScript)
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install --production

# Copia o restante do código
COPY . .

# Compila o TypeScript
RUN npm run build

# Expõe a porta padrão (ajuste conforme necessário)
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["node", "dist/src/app.js"]
