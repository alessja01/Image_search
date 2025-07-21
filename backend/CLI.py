import sys
from pathlib import Path
from update_embeddings import update_all_embeddings

def main():
    if len(sys.argv) == 2:
        folder_path = sys.argv[1]
        print(f" Avvio aggiornamento degli embedding dalla cartella: {folder_path}")
        update_all_embeddings(from_folder=True, folder_path=folder_path)
    else:
        print(" Nessuna cartella fornita, aggiorno TUTTI gli embedding nel database.")
        update_all_embeddings(from_folder=False)

if __name__ == "__main__":
    main()
