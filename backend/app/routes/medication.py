from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.medication import Medication
from app.schemas.medication import (
    MedicationCreate,
    MedicationResponse,
    MedicationUpdate
)
from app.crud.medication import (
    create_medication,
    get_medication,
    get_medication_by_name,
    update_medication,
    delete_medication
)
from app.auth.jwt import get_current_pharmacist, get_current_active_pharmacist
from app.models.pharmacist import Pharmacist

router = APIRouter(prefix="/medications", tags=["medications"])

@router.post("/", response_model=MedicationResponse)
def add_medication(
    medication: MedicationCreate, 
    current_pharmacist: Pharmacist = Depends(get_current_active_pharmacist),
    db: Session = Depends(get_db)
):
    # Only pharmacists can add medications (enforced by the dependency)
    if get_medication_by_name(db, medication.name):
        raise HTTPException(status_code=400, detail="Medication already exists")
    return create_medication(db, medication)

@router.get("/", response_model=List[MedicationResponse])
def list_medications(db: Session = Depends(get_db)):
    return db.query(Medication).all()

@router.get("/{medication_id}", response_model=MedicationResponse)
def read_medication(medication_id: int, db: Session = Depends(get_db)):
    db_medication = get_medication(db, medication_id)
    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_medication

@router.get("/by-name/{medication_name}",response_model=MedicationResponse)
def read_medication_by_name(medication_name:str ,db:Session=Depends(get_db)):
    db_medication=get_medication_by_name(db,medication_name)
    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_medication

@router.patch("/{medication_id}", response_model=MedicationResponse)
def edit_medication(
    medication_id: int, 
    medication: MedicationUpdate, 
    current_pharmacist: Pharmacist = Depends(get_current_active_pharmacist),
    db: Session = Depends(get_db)
):
    # Only pharmacists can edit medications (enforced by the dependency)
    db_medication = update_medication(db, medication_id, medication)
    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return db_medication

@router.delete("/{medication_id}")
def remove_medication(
    medication_id: int, 
    current_pharmacist: Pharmacist = Depends(get_current_active_pharmacist),
    db: Session = Depends(get_db)
):
    # Only pharmacists can delete medications (enforced by the dependency)
    if not delete_medication(db, medication_id):
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"message": "Medication deleted"}