from sqlalchemy.orm import Session
from fastapi import HTTPException 
from app import models, schemas
from app.models.patient import Patient


def create_patient(db: Session, patient: schemas.PatientCreate):
    existing_patient = db.query(models.Patient).filter_by(
        name=patient.name,
        age=patient.age,
        contact_info=patient.contact_info
    ).first()

    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient already exists")
    
    
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def get_all_patients(db: Session):
    return db.query(Patient).all()


def update_patient(db: Session, patient_id: int, patient: schemas.PatientUpdate):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient:
        db_patient.name = patient.name
        db_patient.age = patient.age
        db_patient.contact_info = patient.contact_info
        db.commit()
        db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient:
        db.delete(db_patient)
        db.commit()
    return db_patient
