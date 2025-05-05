from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.auth.jwt import get_current_active_patient, get_current_active_pharmacist, get_current_user, get_current_active_doctor
from app.crud.patient import (
    create_patient,
    get_patient,
    get_patient_by_ssn,
    get_patient_by_email,
    update_patient,
    delete_patient
)

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Register a new patient - public endpoint"""
    if get_patient_by_ssn(db, patient.ssn):
        raise HTTPException(status_code=400, detail="SSN already registered")
    if get_patient_by_email(db, patient.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_patient(db, patient)

@router.get("/", response_model=List[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_pharmacist = Depends(get_current_active_pharmacist)
):
    """List all patients - requires pharmacist authentication"""
    return db.query(Patient).all()

@router.get("/me", response_model=PatientResponse)
def read_current_patient(current_patient: Patient = Depends(get_current_active_patient)):
    """Get the current authenticated patient's information"""
    return current_patient

@router.get("/doctor", response_model=List[PatientResponse])
def list_doctor_patients(
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_active_doctor)
):
    """List all patients for the current doctor - requires doctor authentication"""
    # In a real-world scenario, you'd filter patients that are only assigned to this doctor
    # For now, return all patients as demo data
    return db.query(Patient).all()

@router.get("/{ssn}", response_model=PatientResponse)
def read_patient(
    ssn: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Get a patient by SSN - requires authentication (patient themself or pharmacist)"""
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Only allow patients to view their own information or pharmacists to view any patient
    if current_user.user_type == "patient" and db_patient.ssn != ssn:
        raise HTTPException(status_code=403, detail="Not authorized to view other patient profiles")
        
    return db_patient

@router.patch("/{ssn}", response_model=PatientResponse)
def update_patient_info(
    ssn: str, 
    patient_update: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a patient - requires authentication (patient themself or pharmacist)"""
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Only allow patients to update their own profile or pharmacists to update any patient
    if current_user.user_type == "patient" and current_user.id != db_patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to update other patient profiles")
    
    # Pass the PatientUpdate object directly instead of converting to dict
    db_patient = update_patient(db, ssn, patient_update)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.delete("/{ssn}", status_code=status.HTTP_200_OK)
def remove_patient(
    ssn: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a patient - requires authentication (patient themself or pharmacist)"""
    db_patient = get_patient_by_ssn(db, ssn)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Only allow patients to delete their own profile or pharmacists to delete any patient
    if current_user.user_type == "patient" and current_user.id != db_patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete other patient profiles")
    
    if not delete_patient(db, ssn):
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully"}