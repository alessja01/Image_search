
from sqlalchemy.dialects.postgresql import BYTEA #serve per memorizzare i file binari generici, 
from flask_sqlalchemy import SQLAlchemy #per caricare il db
from pgvector.sqlalchemy import Vector #per connnettersi con il db vettoriale


db=SQLAlchemy()



class Users(db.Model): #utente che inserisce l'immagine
    __tablename__='users'
    id=db.Column(db.Integer, primary_key=True)
    username=db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=True)#poichè voglio applicare l'hash
    data_nascita = db.Column(db.DateTime, default=db.func.current_timestamp())  # Colonna per la data di creazione


    #Relatioships / backref: crea relazione inversa/ lazy: verrà caricata solo quando sarà effettivamente richiesta
    images = db.relationship('Images', backref='user', lazy=True)



class Category(db.Model): #categoria dell'orchidea
    __tablename__='category'
    id=db.Column(db.Integer, primary_key=True)
    nome=db.Column(db.String(100), unique=True, nullable=False)
    descrizione=db.Column(db.Text)

    #Relationships
    images = db.relationship('Images', backref='category', lazy=True)

class Images(db.Model): #immagine dell'orchidea
    __tablename__='images'
    id=db.Column(db.Integer, primary_key=True)
    filename=db.Column(db.String, unique=False, nullable=False)
    image=db.Column(BYTEA, nullable=False)
    embedding= db.Column(Vector(512), nullable=False)
    data_caricamento=db.Column(db.DateTime, default=db.func.current_timestamp())

    #Foreign Key  
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'),nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f"<Image {self.filename} by User {self.user.username}>"


class SearchResult(db.Model): 
    __tablename__ = 'Search_Result'
    id = db.Column(db.Integer, primary_key=True)
    query_embedding = db.Column(Vector(512), nullable=False)
    date = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationship
    images = db.relationship('SearchResultImage', backref='search_result', lazy=True)

class SearchResultImage(db.Model):
    __tablename__ = 'search_result_immagine'
    search_result_id = db.Column(db.Integer, db.ForeignKey('Search_Result.id', ondelete='CASCADE'), primary_key=True)
    images_id = db.Column(db.Integer, db.ForeignKey('images.id', ondelete='CASCADE'), primary_key=True)

    # Relationship
    image = db.relationship('Images', backref='search_result_images', lazy=True)
