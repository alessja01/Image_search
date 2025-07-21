import os #serve per gestire i file e le cartelle, unisce, salva , verifica 
from datetime import timedelta

#classe che configura il db 
class Config:
    #database
    SQLALCHEMY_DATABASE_URI =os.getenv("DATABASE_URL",'postgresql://postgres:alessia@localhost/db_vector_orchidee') #collegamento con il db postgresql
    SQLALCHEMY_TRACK_MODIFICATIONS = False #non attivi modifiche

    #sicurezza e JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "a1ffc17e5aabbee312a4377bd64be332")  
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'aa41b695880109b0c9e38c274c11305ee801a948c8130b8a')

    #durata dei token
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)  # Token valido per 30 minuti
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)     # Refresh token valido per 7 giorni
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'    
  
    #Cartella upload immagini
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')  # cartella per salvataggio immagini
    # Verifica se la cartella esiste, altrimenti la crea
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    #Parametri modello neurale
    MODEL_PATH= os.path.join(os.getcwd(),'model_weights','model.pt') #file della prof
    CLASS_SIZE= 6
    FORCE_CPU= True

    #One-vs-All
    ONEVSALL_MODELS_DIR = os.path.join(os.getcwd(), 'model_weights', 'onevsall')  # Directory con le sottocartelle modello