import torch #libreria per deep learning
from torchvision import transforms
from torchvision.models import resnet18, ResNet18_Weights # importa modelli pre-addestrati e trasformazioni da torchvision
from PIL import Image #Importa la libreria Python Imaging Library 
import io # per lavorare con i dati binari


# Carica il modello con i pesi preaddestrati
weights = ResNet18_Weights.DEFAULT
resnet = resnet18(weights=weights)
resnet.eval()

# Rimuove l'ultimo layer FC (classificazione) per ottenere embedding
model_embedding = torch.nn.Sequential(*list(resnet.children())[:-1])

# Trasformazioni predefinite
transform = weights.transforms()

# utils.py
def allowed_file(filename):
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


# Carica l'immagine e applica le trasformazioni
def get_image_embedding(image_data):
    try:
        # Apri l'immagine e assicurati che sia in RGB
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Applica le trasformazioni (incluso il ridimensionamento a 224x224)
        image = transform(image).unsqueeze(0)  # Aggiungi la dimensione batch

        # Calcola l'embedding senza aggiornare i pesi (modalità di valutazione)
        with torch.no_grad():
            embedding = model_embedding(image)  # [1, 512, 1, 1]

        # Estrai l'embedding come array 1D e convertilo in una lista di float
        embedding = embedding.squeeze().numpy().astype("float32").tolist()
        return embedding

    except Exception as e:
        raise ValueError(f"Errore nel caricamento o nell'elaborazione dell'immagine: {e}")


