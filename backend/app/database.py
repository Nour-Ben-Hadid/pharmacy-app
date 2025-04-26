from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# URL de la base de données SQLite (tu peux adapter pour PostgreSQL ou autre)
SQLALCHEMY_DATABASE_URL = "sqlite:///./pharmacy.db"

# Pour SQLite, on ajoute connect_args pour éviter les erreurs de thread
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Création de la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Dépendance pour obtenir la session de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
