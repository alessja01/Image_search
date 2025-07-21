import numpy as np #Gestione degli array numerici
from models import db, Images
from sqlalchemy import func

#DEFINISCE UNA FUNZIONA CHE NORMALIZZA TUTTI GLI EMBEDDINGS 
def normalize_single_embedding(embedding):
    embedding=np.array(embedding, dtype=np.float32)
    norm=np.linalg.norm(embedding)

    if norm==0:
        raise ValueError("Embedding nullo, impossibile normalizzare")
    
    return(embedding/ norm).astype("float32").tolist()

