from sqlalchemy.orm import Session
from fastapi import HTTPException 
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.utils import get_password_hash

def create_patient(db: Session, patient: PatientCreate):
    if get_patient_by_email(db, patient.email):
        raise ValueError("Email already registered")
        
    hashed_password = get_password_hash(patient.password)
    db_patient = Patient(
        **patient.model_dump(exclude={"password"}),
        hashed_password=hashed_password
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patient(db: Session, id: int):
    return db.query(Patient).filter(Patient.id == id).first()   

def get_patient_by_ssn(db: Session, ssn: str):
    return db.query(Patient).filter(Patient.ssn == ssn).first()

def get_patient_by_email(db: Session, email: str):
    return db.query(Patient).filter(Patient.email == email).first()

def update_patient(db: Session, ssn: str, patient: PatientUpdate):
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        return None
        
    update_data = patient.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if 'password' in update_data:
        hashed_password = get_password_hash(update_data.pop('password'))
        setattr(db_patient, 'hashed_password', hashed_password)
        
    for key, value in update_data.items():
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