
#IMPORTO
from models import db,Images,Users,Category,SearchResult,SearchResultImage #importa le classi che ho creato in models
from config import Config
from utils import get_image_embedding, allowed_file
from flask import Blueprint , request, jsonify, url_for, abort #request: legge i dati che l'utente invia/jsonify: restituisce risposte in formto JSON
from datetime import datetime
from collections import defaultdict


#SQLAlchemy 
from sqlalchemy import func #importa func
from sqlalchemy.sql import text #permette di scrivere query SQL raw, per usare operatori speciali

#DATABASE VETTORIALE
from pgvector.sqlalchemy import Vector # è il tipo di colonna di embedding
from pgvector import vector as pgvector_vector 

#JWT autenticazione
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity ,create_refresh_token, JWTManager #JWTManager: configurare e gestire il sistema di autentificazione/ create_access_token: crea accesso al token/ jwt_required: proteggere le rotte che richiedono token

#PASSWORD HASHING
from werkzeug.security import generate_password_hash, check_password_hash

#DEBUG AVANZATO
import traceback
import os
import base64

routes = Blueprint('routes', __name__)

#******************************************************* HOME *************************************************************+
@routes.route('/hello',methods=['GET'])
def home():
    return jsonify({"message":"BENVENUTO "})


#******************************************************* REGISTER *************************************************************+
@routes.route('/register',methods=['POST'])
def register():
    data=request.get_json()
    username=data.get("username")
    email=data.get("email")
    password=data.get("password")

    #verifica se l'utente esiste già 
    if Users.query.filter_by(email=email).first():

        #ritorna un messaggio con un link al login
        login_url=url_for('login',_external=True) #genera il link al login usando external costruisce l'url completo con il dominio corrente
        return jsonify({
                "message":"Email already registred. Please login",
                "login_url":login_url
        }), 200
    
        #hash della password
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')


        #Crea un nuovo utente
    new_user=Users(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message":"User created successfully"}), 201


#************************************************************* LOGIN *************************************************************************
@routes.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()  # Ottieni i dati JSON dalla richiesta
        email = data.get("email")
        password = data.get("password")

        # Verifica che i dati siano stati inviati
        if not email or not password:
            return jsonify({"message": "Missing email or password"}), 400
        


        # Recupera l'utente dal database
        user = Users.query.filter_by(email=email).first()

        # Verifica se l'utente esiste e se la password è corretta
        if not user :
            return jsonify({"message": "User not found"}), 404
        
        if not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid password"}), 401

        # Crea un token JWT per l'utente
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=user.id)

        # Restituisci il token al frontend
        return jsonify({
            "message": "Login successful",
            'refresh_token':refresh_token,
            "access_token": access_token,
            "user":{
                "username":user.username,
                "email":user.email
            }
            
        }), 200

    except Exception as e:
        print("❌ ERRORE NEL BACKEND:")
        traceback.print_exc()  # Questo stampa la riga ESATTA dove avviene l'errore
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500


#******************************************************* CARICA IMMAGINE **********************************************************************
@routes.route('/upload-image', methods=['POST'])
@jwt_required()  # Protegge la route con il controllo del token JWT
def upload_image():
    try:
        # Ottieni l'ID utente dal token JWT
        user_id = int(get_jwt_identity())  # get_jwt_identity() decodifica automaticamente il token
        print(f"ID dell'utente: {user_id}")
        
        # Verifica se l'utente esiste nel database
        user = Users.query.get(user_id)
        if not user:
            return jsonify({'message': 'Utente non trovato'}), 404

        # Ottieni l'immagine e la categoria dalla richiesta
        file = request.files.get('image')  # Ottieni il file inviato
        category_name = request.form.get('category_name')  # Categoria opzionale
        crea_categoria = request.form.get('crea_categoria', 'false').lower() == 'true'  # Flag per la creazione della categoria

        # Se il file non è stato fornito
        if not file:
            return jsonify({'message': 'Devi caricare un\'immagine'}), 400
        
        # Verifica che il file sia un'immagine con estensione valida
        if not allowed_file(file.filename):
            return jsonify({'message': 'Tipo di file non supportato'}), 422

        # Leggi i dati binari dell'immagine e calcola l'embedding
        image_data = file.read()
        embedding = get_image_embedding(image_data)

        # Se l'embedding non è stato trovato
        if embedding is None:   
            return jsonify({'message': 'Embedding mancante'}), 400
        
        print(f"Embedding calcolato e normalizzato: {embedding}")

        # Gestione della categoria
        category_obj = None

        if category_name:
            category_obj = Category.query.filter(Category.nome.ilike(category_name)).first()

            # Se la categoria non esiste e il flag crea_categoria è True, la creiamo
            if not category_obj and crea_categoria:
                category_obj = Category(nome=category_name, descrizione="Categoria creata dall'utente")
                db.session.add(category_obj)
                db.session.commit()
                print(f"Categoria '{category_name}' creata")
            elif not category_obj:
                return jsonify({'message': f"La categoria '{category_name}' non esiste. Vuoi crearla?"}), 400
        
        # Se non viene inserita categoria, proviamo a predire una categoria
        else:
            immagini_presenti = Images.query.count()
            if immagini_presenti == 0:
                return jsonify({'message': 'Il database è vuoto, è necessario inserire almeno una categoria per procedere'}), 400

            # Troviamo l'immagine più simile nel db usando l'embedding
            similar_image_result = db.session.execute(
                text("""
                    SELECT id FROM images 
                    ORDER BY embedding <-> CAST(:embedding AS vector) 
                    LIMIT 1 
                """),
                {'embedding': embedding}
            ).mappings().first()

            similar_image = Images.query.get(similar_image_result['id']) if similar_image_result else None

            if similar_image and similar_image.category:
                category_obj = similar_image.category
                print(f"Categoria predetta: {category_obj.nome}")
            else:
                default_category = Category.query.filter_by(nome='Generica').first()
                if default_category:
                    category_obj = default_category
                    print("Categoria di default utilizzata.")
                else:
                    return jsonify({'message': 'Nessuna categoria trovata'}), 404
        
        # Controllo duplicati
        existing_image = Images.query.filter_by(filename=file.filename).first()
        if existing_image:
            print(f"Immagine già esistente nel database: {file.filename}")
            return jsonify({'error': 'Hai già caricato un file con questo nome. Non puoi caricarlo in un\'altra categoria.'}), 400

        # Salvataggio dell'immagine nel database
        new_image = Images(
            filename=file.filename,
            image=image_data,
            embedding=embedding,
            user_id=user_id,
            category_id=category_obj.id if category_obj else None
        )
        db.session.add(new_image)
        db.session.commit()

        return jsonify({
            "message": "Immagine caricata con successo",
            "categoria_usata": category_obj.nome if category_obj else "Nessuna"
        }), 201

    except Exception as e:
        print(f"Errore: {str(e)}")
        return jsonify({"message": f"Errore durante il caricamento: {str(e)}"}), 500



#********************************************** LOG OUT ***********************************************************
@routes.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({"message":"Logout effettuato "}),200


#******************************************** REFRESH TOKEN **********************************************************************
@routes.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user= get_jwt_identity()
    new_token=create_access_token(identity=current_user)
    return jsonify(access_token=new_token),200

#**************************************** VISUALIZZA IMMAGINI ***************************************************************
@routes.route('/images', methods=['GET'])
@jwt_required()
def get_images():

    # Parametri dalla query
    user_id = request.args.get('user_id')
    category_id = request.args.get('category_id')
    upload_image = request.args.get('date')

    # Query base
    query = Images.query

    # Se c'è user_id, prendiamo l'utente
    if user_id:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "Utente non trovato"}), 404

        # Controllo data se richiesta
        if upload_image:
            try:
                requested_date = datetime.strptime(upload_image, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Formato data non valido (YYYY-MM-DD)"}), 400

            if requested_date < user.data_creazione.date():
                return jsonify({"error": "Non puoi cercare immagini prima della creazione dell'account"}), 400

        query = query.filter_by(user_id=user_id)

    # Filtra per categoria
    if category_id:
        query = query.filter_by(category_id=category_id)

    # Filtra per data (se passato e valido)
    if upload_image:
        query = query.filter(func.date(Images.data_caricamento) == upload_image)

    images = query.all()

    # Costruzione della risposta
    image_list = []
    for image in images:
        image_list.append({
            "id": image.id,
            "filename": image.filename,
            "category": image.category.nome if image.category else "Nessuna",
            "username": image.user.username if image.user else "Sconosciuto",
            "upload_date": image.data_caricamento.strftime('%Y-%m-%d') if image.data_caricamento else None,
            "image_url": f"http://localhost:5000/api/image/{image.id}",
        })

    return jsonify(image_list), 200


#serve l'immagine vera e propria da mostrare nel frontend
@routes.route('/image/<int:image_id>', methods=['GET'])
def serve_image(image_id):
    image = Images.query.get(image_id)
    if image is None:
        return jsonify({"message": "Immagine non trovata"}), 404
    return image.image, 200, {'Content-Type': 'image/jpeg'}

# ******************************************************* SEARCH *************************************************************
@routes.route('/search-image', methods=['POST'])
@jwt_required()
def search_image():
    try:
        # Ottieni l'ID utente dal token JWT
        user_id = int(get_jwt_identity())
        print(f"ID dell'utente: {user_id}")

        # Ottieni immagine dalla richiesta
        file = request.files.get('image')

        if not file:
            return jsonify({'message': 'Devi caricare un\'immagine'}), 400

        if not allowed_file(file.filename):
            return jsonify({'message': 'Tipo di file non supportato'}), 422

        # Calcola embedding dell'immagine
        image_data = file.read()
        embedding = get_image_embedding(image_data)

        if embedding is None:
            return jsonify({'message': 'Embedding mancante'}), 400

        print(f"Embedding calcolato e normalizzato: {embedding[:10]}...")  # solo i primi valori per debug

        # Se il DB è vuoto, errore
        immagini_presenti = Images.query.count()
        if immagini_presenti == 0:
            return jsonify({
                'message': 'Il database è vuoto, è necessario inserire almeno una categoria per procedere'
            }), 400

        # Se esiste già un'immagine con lo stesso filename, ritorna solo quella
        existing = Images.query.filter_by(filename=file.filename).first()
        if existing:
            return jsonify({
                'predicted_category': existing.category.nome if existing.category else "Sconosciuta",
                'total_categories_found': 1,
                'matching_category_count': 1,
                'total_result': 1,
                'result': [{
                    'id': existing.id,
                    'filename': existing.filename,
                    'category': existing.category.nome if existing.category else "Sconosciuta",
                    'similarity': 1.0,
                    'image_url': f"http://localhost:5000/api/image/{existing.id}"
                }],
                'all_categories': [{
                    'id': existing.category.id if existing.category else -1,
                    'nome': existing.category.nome if existing.category else "Sconosciuta"
                }],
                'embedding': embedding
            }), 200

        # Query immagini simili usando pgvector
        similar_image = db.session.execute(
            text("""
                SELECT id, category_id, embedding <-> CAST(:embedding AS vector) AS distance
                FROM images 
                ORDER BY distance
            """),
            {'embedding': embedding}
        ).mappings().fetchall()

        # Recupera gli ID e oggetti immagini
        image_ids = [row['id'] for row in similar_image]
        image_objects = Images.query.filter(Images.id.in_(image_ids)).all()
        image_map = {img.id: img for img in image_objects}

        result_image = []
        category_found = set()
        categories_objects = {}

        for row in similar_image:
            similarity = round(1.0 - row['distance'], 4)
            if similarity < 0.40:
                continue

            img = image_map.get(row['id'])
            if not img:
                continue

            category_name = img.category.nome if img.category else "Sconosciuta"
            category_id = img.category.id if img.category else -1

            result_image.append({
                'id': img.id,
                'filename': img.filename,
                'category': category_name,
                'similarity': similarity,
                'image_url': f"http://localhost:5000/api/image/{img.id}"
            })

            if category_name != "Sconosciuta":
                category_found.add(category_name)
                categories_objects[category_id] = category_name

        # Se nessuna immagine è risultata simile
        if not result_image:
            return jsonify({
                'message': 'Nessuna immagine simile trovata nel database.',
                'result': [],
                'all_categories': [],
                'embedding': embedding
            }), 200

        # Predizione categoria dalla prima immagine
        predicted_category_name = result_image[0]['category']
        same_category_count = sum(1 for img in result_image if img['category'] == predicted_category_name)

        return jsonify({
            'predicted_category': predicted_category_name,
            'total_categories_found': len(category_found),
            'matching_category_count': same_category_count,
            'total_result': len(result_image),
            'result': result_image,
            'all_categories': [{'id': k, 'nome': v} for k, v in categories_objects.items()],
            'embedding': embedding
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ******************************************************* CONFIRM SEARCH *************************************************************
@routes.route('/confirm-search', methods=['POST'])
@jwt_required()
def confirm_search():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        embedding = data.get('embedding')
        category_id = data.get('category_id')
        filename = data.get('filename')
        

        if not embedding or not category_id or not filename:
            return jsonify({'message': 'Dati mancanti: embedding, category_id e filename sono obbligatori.'}), 400
        
        image_base64 = data.get('image')
        if not image_base64 :
            return jsonify({'error':'Dati mancanti'}),400
        try:
            image_base64=base64.b64decode(image_base64)
        except Exception as e:
            return jsonify({'error': 'Immagine base64 non valida'}),400

        # Verifica che la categoria esista
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'message': f'Categoria con ID {category_id} non trovata.'}), 404

        # Controlla se il file esiste già nel database
        existing_image = Images.query.filter_by(filename=filename).first()
        if existing_image:
            return jsonify({'message': f"L'immagine '{filename}' è già presente nel database."}), 200

        # Salva l’immagine su disco se fornita
        if image_base64:
            try:
                image_data = base64.b64decode(image_base64)
                save_dir = os.path.join("dataset", str(category_id))
                os.makedirs(save_dir, exist_ok=True)
                image_path = os.path.join(save_dir, filename)
                with open(image_path, "wb") as f:
                    f.write(image_data)
            except Exception as img_err:
                return jsonify({'message': f"Errore nel salvataggio dell'immagine: {str(img_err)}"}), 500

        # Salva nel DB
        new_image = Images(
            filename=filename,
            image=image_base64,
            embedding=embedding,
            user_id=user_id,
            category_id=category_id
        )
        db.session.add(new_image)
        db.session.commit()

        return jsonify({
            'message': f"L'immagine '{filename}' è stata salvata nella categoria '{category.nome}' con successo.",
            'image_id': new_image.id,
            'category_name': category.nome
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({'message': f"Errore interno del server: {str(e)}"}), 500

#******************************************************* DATE-RANGE DASHBOARD *************************************************************
@routes.route('/image-count-by-range', methods=['GET'])
@jwt_required()
def image_count_range():
    try:
        user_id=int(get_jwt_identity())
        start_date= request.args.get('start')
        end_date= request.args.get('end')

        if not start_date or not end_date:
            return jsonify({"error": "Devi fornire un range d'inizio e fine"}), 400
        
        #QUERY PER CONTARE IMMAGINI PER GIORNO NEL RANGE
        result=(
            db.session.query(
                func.date(Images.data_caricamento).label("upload_date"),
                func.count().label("count")
            )
            .filter(
                Images.user_id== user_id,
                func.date(Images.data_caricamento) >= start_date,
                func.date(Images.data_caricamento)<= end_date
            )
            .group_by(func.date(Images.data_caricamento))
            .order_by(func.date(Images.data_caricamento))
            .all()
        )

        data=[
            {"date": row.upload_date.strftime("%Y-%m-%d"), "value": row.count}
            for row in result
        ]

        return jsonify(data),200
    
    except Exception as e:
        return jsonify({"error": str(e)}),500