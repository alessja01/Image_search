from app.inference import loadAllOneVsAllModels, loadDevice
from flask import Flask, jsonify, request
from config import Config
from models import db
from routes import routes
from flask_jwt_extended import JWTManager
from flask_cors import CORS 
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from pgvector.psycopg2 import register_vector



app= Flask(__name__)

#configurazione app
app.config.from_object(Config)

# Inizializza JWT
jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Token mancante o non valido"}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({"message": "Token JWT non valido"}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token JWT scaduto"}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token JWT revocato"}), 401


#inizializza db
db.init_app(app)

#registrazione routes
app.register_blueprint(routes, url_prefix='/api')

#configura CORS per consentire richieste da qualsiasi origine per sviluppo
CORS(app, origins=["http://localhost:5173", "http://altro-frontend.com"], supports_credentials=True)

#configurazione migrate
migrate=Migrate(app, db)

@app.before_request
def log_auth_header():
    token = request.headers.get('Authorization')
    print(f"🔐 Token ricevuto: {token}")


if __name__ == '__main__' : 
    with app.app_context():
        # Registra il tipo 'vector' con pgvector per PostgreSQL
        conn=db.engine.raw_connection()
        register_vector(conn, "vector")
        conn.close()

        # Crea tutte le tabelle
        db.create_all()
        print("Tabelle create con successo!")
        

        #Caricamento modelli One-vs-All
        device= loadDevice(forceCpu=False)
        models_one, className_one= loadAllOneVsAllModels("model_weights/model/OnevsAll_Full_Augmented_privato", device)

        #Salvo nei config per accesso ai routes 
        app.config["DEVICE"]=device
        app.config["MODELS_ONEVSALL"]=models_one
        app.config["CLASSNAMES_ONEVSALL"]=className_one


    app.run(debug=True)