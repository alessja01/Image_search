import torch
import numpy as np
from torchvision import transforms, models
from PIL import Image
import io
import os
from pathlib import Path
from embedding_utils import normalize_single_embedding

# === percorso assoluto al modello e il numero di classi ===
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model_weights" / "model" / "6_class_model_pretrained_privato" / "model.pt"
CLASS_SIZE = 6  # <-- o metti 2 se usi il modello One-vs-All

# === Caricamento del modello ===
resnet = models.resnet18()
resnet.fc = torch.nn.Linear(resnet.fc.in_features, CLASS_SIZE)

model_dict = torch.load(str(MODEL_PATH), map_location=torch.device('cpu'))

# Rimuoviamo il layer di classificazione finale se presente
if 'model' in model_dict:
    resnet.load_state_dict(model_dict['model'])
else:
    resnet.load_state_dict(model_dict)

resnet.eval()

# Creiamo un modello che termina prima del layer FC → embedding da 512 dimensioni
model_embedding = torch.nn.Sequential(*list(resnet.children())[:-1])

# Trasformazioni compatibili con ResNet18
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],  # standard ImageNet mean
        std=[0.229, 0.224, 0.225]    # standard ImageNet std
    ),
])

# Verifica formato file
def allowed_file(filename: str) -> bool:
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# Funzione per calcolare l’embedding da un'immagine
def get_image_embedding(image_data: bytes)->list:
    try:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image = transform(image).unsqueeze(0)  # Aggiungi dimensione batch

        with torch.no_grad():
            embedding = model_embedding(image)  

        embedding = embedding.squeeze().numpy().astype("float32")

        normalized_embedding = normalize_single_embedding(embedding)

        return normalized_embedding
    except Exception as e:
        raise ValueError(f"Errore nel caricamento o nell'elaborazione dell'immagine: {e}")
