from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Medication)
def create_medication(medication: schemas.MedicationCreate, db: Session = Depends(get_db)):
    return crud.create_medication(db=db, medication=medication)

@router.get("/{medication_id}", response_model=schemas.Medication)
def get_medication_by_id(medication_id: int, db: Session = Depends(get_db)):
    medication = crud.get_medication_by_id(db=db, medication_id=medication_id)
    if medication is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return medication

@router.get("/", response_model=list[schemas.Medication])
def get_medications(db: Session = Depends(get_db)):
    return crud.get_all_medications(db=db)

@router.put("/{medication_id}", response_model=schemas.Medication)
def update_medication(medication_id: int, medication: schemas.MedicationCreate, db: Session = Depends(get_db)):
    updated_medication = crud.update_medication(db=db, medication_id=medication_id, medication=medication)
    if updated_medication is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return updated_medication

@router.delete("/{medication_id}")
def delete_medication(medication_id: int, db: Session = Depends(get_db)):
    success = crud.delete_medication(db=db, medication_id=medication_id)
    if not success:
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"message": "Medication deleted successfully"}
