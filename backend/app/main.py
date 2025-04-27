from fastapi import FastAPI
from app.database import Base, engine
from app.routes import patient, medication, prescription ,prescription_medication 

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Inclusion des routes de chaque ressource
app.include_router(patient.router)
app.include_router(medication.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pharmacy !!! "}