


#----------------------ESEGUE INFERENZA SU IMMAGINI USANDO O MODELLI TRADIZIONALI O MODELLI 1 VS ALL----------




import torch
import os
from torchvision import models
import torch.nn as nn
from config import Config
from app.preprocessing_tools.dataset_tool import augmentDataPath, SingleFolderDataset
from app.test_model import showAndTestImages, generateOutputImages
from app.preprocess_data import getTransforms


#ESEGUE CLASSIFICAZIONE SU UNA SINGOLA IMMAGINE
def inference(model, image, device):
    model.eval() #imposta il modello in modalità di valutazione
    with torch.no_grad(): #disattiva il calcolo del gradiente
        image = image.to(device) #Sosta l'immagine sul device
        values = model(image) #ottiene output
        _, predicted = torch.max(values, 1) #trova la classe predetta
    return values, predicted
    

#VALUTA IL MODELLO SU UN INTERO DATASET
def testInference(test_dataset, model, device, classNames):
    class_counts = {label: [0] * len(classNames) for _, label, _ in test_dataset}
    
    print('Inference on test dataset')
    for i in range(len(test_dataset)):
        image, label, _ = test_dataset[i]
        values, predicted = inference(model, image.unsqueeze(0), device)
        class_counts[label][predicted.item()] += 1

    for class_label, predictionCount in class_counts.items():
        print(f'\nClass {test_dataset.classes[class_label]}:')
        for i in range(len(classNames)):
            print(f'  {classNames[i]}: {predictionCount[i]}')

    return class_counts

#SELEZIONA CPU O GPU
def loadDevice(forceCpu=False):
    if torch.cuda.is_available() and not forceCpu:
        device = torch.device('cuda')
    else:
        device = torch.device('cpu')
    return device

#CARICA UN MODELLO SALVATO
def loadModel(modelPath, classSize, device):
    model = models.resnet18() #crea un Resnet-18
    model.fc = nn.Linear(model.fc.in_features, classSize)#sostituisce l'ultimo layer con uno adottato dalle classi 
    model_dict = torch.load(modelPath, map_location=device) #carica i pesi del file
    model.load_state_dict(model_dict['model']) #carica i pesi nel modello 
    model.to(device) #Sposta sul device
    return model

#GESTISCE IL TEST COMPLETO SU UNA CARTELLA
def inferenceData(classNames, modelPath, datasetPath, width, height, mean, std, slidingWindowSize, stride, outputFolder):
    classSize = len(classNames)
    device = loadDevice(forceCpu=False)
    model = loadModel(modelPath, classSize, device)
    model.eval()

    #CREA UN DATASET CON TRASFOMAZIONI 
    # datasetPath = augmentDataPath(datasetPath, datasetPath, 100000, width, height, [rotation.identity])
    test_dataset = SingleFolderDataset(
        datasetPath,
        transform=getTransforms(width, height, True, mean, std)
    )

    #ESEGUE CLASSIFICAZIONE 
    testInference(test_dataset, model, device, classNames)    
    # generateOutputImages(test_dataset, model, device, classNames, outputFolder, slidingWindowSize, stride)
    
    #MOSTRA LE IMMAGINI E I RISULATI 
    showAndTestImages(test_dataset, model, device, classNames, slidingWindowSize, stride)



#GESTISCE IL TEST NEI MODELLI 1 VS ALL 
#PRENDE UN IMMAGINE E DICE SI APPARTIENE ALLA CLASSE O MENO 
def inference1vsAll(models, image, device, swapIndex):

    #MATRICE 2 COLONNE PER OGNI MODELLO 
    values = torch.zeros((len(models), 2))


    for i, model in enumerate(models):
        #FA L'INFERENZA SU OGNI MODELL0
        values[i], _ = inference(model, image, device)

        #SICCOME L'OUTPUT SARà [SCORE_neg, SCORE_POS]
        #Imagefolder assegna etichette in ordine alfabetico e l'ordine output , dei modelli binari , può essere diverso 
        #L'INVERTE PER GARANTIRE CHE CI SIA SEMPRE LO SCORE POSITIVO
        if i >= swapIndex:
            values[i][0], values[i][1] = values[i][1], values[i][0]
    
    # RIVELA AUTOMATICAMENTE LE IMMAGINI CHE NON APPARTENGONO A NESSUNA CLASSE CONOSCIUTA E LE CLASSIFICA
    if torch.all(values[:, 0] < 0):
         # Se tutti i valori sono negativi, allora la predizione è -1 (fuori distribuzione)
        predicted = torch.tensor(-1)
    else:
        predicted = torch.argmax(values[:, 0]) # Altrimenti si prende il valore più alto
    # print(values)
    # print(predicted)
    return values, predicted
    

# Testa il modello 1 vs All
# models: lista di modelli
# test_dataset: dataset di test
# device: dispositivo su cui eseguire l'inference
# classNames: nomi delle classi
# swapIndex: indice a partire dal quale invertire i valori delle attribuzioni, è necessario invertirli ad un certo punto perché ImageFolder carica le classi in ordine alfabetico
# di conseguenza la classe Others (fuori distribuzione) potrebbe non essere sempre la seconda, nel nostro caso attuale, la classe Others è la penultima
# quindi swapIndex = len(classNames) - 2
def testInference1vsAll(models, test_dataset, device, classNames):
    swapIndex = len(classNames) - 2
    class_counts = {label: [0] * (len(classNames) + 1) for _, label, _ in test_dataset} # +1 per contare le immagini fuori distribuzione

    print('Inference on test dataset')
    for i in range(len(test_dataset)):
        image, label, path = test_dataset[i]
        print(path)
        values, predicted = inference1vsAll(models, image.unsqueeze(0), device, swapIndex)
        class_counts[label][predicted.item()] += 1        


    for class_label, predictionCount in class_counts.items():
        print(f'\nClass {test_dataset.classes[class_label]}:')
        for i in range(len(classNames)):
            print(f'  {classNames[i]}: {predictionCount[i]}')
        print(f'  Other: {predictionCount[-1]}')


    return class_counts


#CARICA I MODELLI PER LA CLASSIFICAZINI 1-VS-ALL
def loadAllOneVsAllModels(modelsFolder, device):
    import os
    model_list = []
    class_names = []

    #SCORRE OGNI SOTTOCARTELLA PER UNA CLASSE
    for class_folder in sorted(os.listdir(modelsFolder)):
        class_path = os.path.join(modelsFolder, class_folder)
        if os.path.isdir(class_path):
            model_path = os.path.join(class_path, 'model.pt')
            if os.path.exists(model_path):
                model = models.resnet18()
                model.fc = nn.Linear(model.fc.in_features, 2) #OUTPUT BINARIO
                model_dict = torch.load(model_path, map_location=device)
                model.load_state_dict(model_dict['model']) #CARICA PESI
                model.to(device)
                model.eval()
                model_list.append(model) #AGGIUNGE MODELLO 
                class_names.append(class_folder) #SALVA IL MODELLO 
    
    return model_list, class_names
