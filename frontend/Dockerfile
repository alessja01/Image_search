FROM node:20-slim

# Imposta la cartella di lavoro
WORKDIR /app

# Copia il package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Rimuovi la cache di PyTorch (se esistente)
RUN rm -rf /root/.cache/torch/hub

# Copia il resto del codice sorgente
COPY . .

# Avvia il server
CMD ["npm", "run", "dev"]
