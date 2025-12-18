FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Limpiar cache e instalar dependencias
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-optional

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
