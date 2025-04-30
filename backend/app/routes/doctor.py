from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorResponse, DoctorUpdate
from app.auth.jwt import get_current_active_doctor, get_current_active_pharmacist, get_current_user
from app.crud.doctor import (
    create_doctor, 
    get_doctor, 
    get_doctor_by_license,
    get_doctor_by_email,
    update_doctor,
    delete_doctor
)

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.post("/", response_model=DoctorResponse)
def register_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    """Register a new doctor - public endpoint"""
    if get_doctor_by_license(db, doctor.license_number):
        raise HTTPException(status_code=400, detail="License number already registered")
    if get_doctor_by_email(db, doctor.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_doctor(db, doctor)

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    db: Session = Depends(get_db),
    current_pharmacist = Depends(get_current_active_pharmacist)
):
    """List all doctors - requires pharmacist authentication"""
    return db.query(Doctor).all()

@router.get("/me", response_model=DoctorResponse)
def read_current_doctor(current_doctor: Doctor = Depends(get_current_active_doctor)):
    """Get the current authenticated doctor's information"""
    return current_doctor

@router.get("/{doctor_id}", response_model=DoctorResponse)
def read_doctor(
    doctor_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a doctor by ID - requires authentication (doctor themself or pharmacist)"""
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if the user is authorized (pharmacist or the doctor themself)
    if current_user.user_type == "doctor" and current_user.id != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other doctor profiles")
    
    return db_doctor

@router.get("/by-license/{license_number}", response_model=DoctorResponse)
def read_doctor_by_license(
    license_number: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a doctor by license number - requires authentication (doctor themself or pharmacist)"""
    db_doctor = get_doctor_by_license(db, license_number)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if the user is authorized (pharmacist or the doctor themself)
    if current_user.user_type == "doctor" and current_user.id != db_doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized to view other doctor profiles")
    
    return db_doctor

@router.patch("/{doctor_id}", response_model=DoctorResponse)
def edit_doctor(
    doctor_id: int, 
    doctor_update: DoctorUpdate, 
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """Update a doctor - requires authentication"""
    # Only allow doctors to update their own profile
    if current_doctor.id != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update other doctor profiles")
        
    db_doctor = update_doctor(db, doctor_id, doctor_update)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor

@router.delete("/{doctor_id}")
def remove_doctor(
    doctor_id: int, 
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """Delete a doctor - requires authentication"""
    # Only allow doctors to delete their own profile
    if current_doctor.id != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete other doctor profiles")
    
    if not delete_doctor(db, doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor deleted"}