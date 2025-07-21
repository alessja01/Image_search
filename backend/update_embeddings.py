from app import app
from models import db, Images
from pathlib import Path
import os
from utils import get_image_embedding, allowed_file #sostituire con l'embedding nuovo
from backend.embedding_utils import normalize_single_embedding #verifica che gli embedding siano normalizzati 




def update_all_embeddings(from_folder=False, folder_path="static/upload"):
    with app.app_context():

        #RECUPERA I RECORD DA AGGIORNARE DAL DB
        if from_folder:

            #SE VUOI AGGIORNARE SOLO UNA CARTELLA
            if not os.path.isdir(folder_path):
                print(f"Cartella non trovata:{folder_path}")
                return
            
            #FILTRA SOLO FILE IMMAGINI VALIDI NELLE CARTELLE
            files=[f for f in os.listdir(folder_path) if allowed_file(f)]
            if not files:
                print("Nessuna immagine valida trovata nella cartella")
                return
            
            #PER OGNI FILE NELLA CARTELLA, CERCA IL RECORD CORRISPONDENTE NEL DB
            images=[]
            for filename in files:
                img=Images.query.filter_by(filename=filename).first()
                if img:
                    images.append(img)
                else:
                    print(f"{filename} non è presente nel database")
            
        else:
            #SE VUOI AGGIORNARE TUTTE LE IMMAGINI SALVATE NEL DB 
            images=Images.query.all()
            folder_path="static/upload"
        
        #ELABORA OGNI IMMAGINE E AGGIORNA EMBEDDING
        update=0
        for img in images:
            try:
                file_path=os.path.join(folder_path,img.filename)
                if not os.path.isfile(file_path):
                    print(f" Immagine non trovata su disco: {img.filename}")
                    continue
                with open(file_path, "rb") as f:
                    image_data=f.read()

                embedding=get_image_embedding(image_data) 
                if embedding is None:
                    print(f" Embedding non calcolato per {img.filename}")
                    continue

                normalized=normalize_single_embedding(embedding)
                img.embedding=normalized
                update +=1
                print("Embedding aggiornato per {img.filename}")

            except Exception as e:
                print(f" Errore su {img.filename}: {e}")
    
    if update>0:
        db.session.commit()
        print("Embedding aggiornati ")


    if __name__=="__main__":
        update_all_embeddings()
