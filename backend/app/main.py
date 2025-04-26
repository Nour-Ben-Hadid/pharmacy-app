from fastapi import FastAPI
from app.database import Base, engine
from app.routes import patient, medication, prescription ,prescription_medication 

# Crée toutes les tables dans la base de données
Base.metadata.create_all(bind=engine)

# Initialisation de l'application FastAPI
app = FastAPI()

# Inclusion des routes de chaque ressource
app.include_router(patient.router)
app.include_router(medication.router, prefix="/medications", tags=["medications"])
app.include_router(prescription.router, prefix="/prescriptions", tags=["prescriptions"])
app.include_router(prescription_medication.router, prefix="/prescription_medications", tags=["prescription_medications"])
