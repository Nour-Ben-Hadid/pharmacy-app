from sqlalchemy.orm import Session
from fastapi import HTTPException 
from app.models.patient import Patient
from app.schemas.patient import PatientCreate , PatientUpdate 

def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient_by_ssn(db: Session, ssn: str):
    return db.query(Patient).filter(Patient.ssn == ssn).first()

def update_patient(db: Session, ssn: str, patient: PatientUpdate):
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        return None
    for key, value in patient.model_dump().items():
        setattr(db_patient, key, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, ssn: str):
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        return False
    db.delete(db_patient)
    db.commit()
    return True