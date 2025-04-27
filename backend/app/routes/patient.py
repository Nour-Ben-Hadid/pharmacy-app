from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List
from app.models.patient import Patient
from app.schemas.patient import PatientCreate , PatientUpdate, PatientResponse
from app.crud.patient import (
    create_patient, 
    get_patient_by_ssn, 
    update_patient, 
    delete_patient
)

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("/", response_model=PatientResponse)
def register_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    # Check if SSN already exists
    if get_patient_by_ssn(db, patient.ssn):
        raise HTTPException(status_code=400, detail="SSN already registered")
    return create_patient(db, patient)

@router.get("/", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()

@router.get("/{ssn}", response_model=PatientResponse)
def read_patient(ssn: str, db: Session = Depends(get_db)):
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.patch("/{ssn}", response_model=PatientResponse)
def edit_patient(ssn: str, patient: PatientUpdate, db: Session = Depends(get_db)):
    db_patient = update_patient(db, ssn, patient)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.delete("/{ssn}")
def remove_patient(ssn: str, db: Session = Depends(get_db)):
    if not delete_patient(db, ssn):
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted"}