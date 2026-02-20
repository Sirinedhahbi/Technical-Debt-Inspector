FROM node:18
WORKDIR /app
# Copie des fichiers de dépendances pour optimiser le cache Docker
COPY package*.json ./
RUN npm install
# Copie du reste du code source
COPY . .
EXPOSE 3000
CMD ["npm", "start"]