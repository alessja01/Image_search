FROM python:3.10-slim-bookworm


# Imposta la cartella di lavoro
WORKDIR /app

# Aggiorna pacchetti e installa le librerie necessarie
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia le dipendenze
COPY requirements.txt .

# Aggiorna pip PRIMA di installare
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copia il codice sorgente
COPY . .

# Configura Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=development

# Avvia il server Flask
CMD ["flask", "run"]
