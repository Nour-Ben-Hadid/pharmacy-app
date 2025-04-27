from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.crud.doctor import (
    create_doctor, 
    get_doctor, 
    get_doctor_by_license,
    update_doctor,
    delete_doctor
)

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.post("/", response_model=DoctorResponse)
def register_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    if get_doctor_by_license(db, doctor.license_number):
        raise HTTPException(status_code=400, detail="License number already registered")
    return create_doctor(db, doctor)

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(db: Session = Depends(get_db)):
    return db.query(Doctor).all()

@router.get("/{doctor_id}", response_model=DoctorResponse)
def read_doctor(doctor_id: int, db: Session = Depends(get_db)):
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor

@router.get("/by-license/{license_number}", response_model=DoctorResponse)
def read_doctor_by_license(license_number: str, db: Session = Depends(get_db)):
    db_doctor = get_doctor_by_license(db, license_number)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor

@router.patch("/{doctor_id}", response_model=DoctorResponse)
def edit_doctor(doctor_id: int, doctor_update: dict, db: Session = Depends(get_db)):
    db_doctor = update_doctor(db, doctor_id, doctor_update)
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor

@router.delete("/{doctor_id}")
def remove_doctor(doctor_id: int, db: Session = Depends(get_db)):
    if not delete_doctor(db, doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor deleted"}