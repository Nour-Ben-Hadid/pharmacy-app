from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.PrescriptionMedication)
def create_prescription_medication(prescription_medication: schemas.PrescriptionMedicationCreate, db: Session = Depends(get_db)):
    return crud.add_medication_to_prescription(db=db, prescription_medication=prescription_medication)

@router.get("/{prescription_medication_id}", response_model=schemas.PrescriptionMedication)
def get_prescription_medication_by_id(prescription_medication_id: int, db: Session = Depends(get_db)):
    prescription_medication = crud.get_by_id(db=db, prescription_medication_id=prescription_medication_id)
    if prescription_medication is None:
        raise HTTPException(status_code=404, detail="Prescription Medication not found")
    return prescription_medication

@router.get("/", response_model=list[schemas.PrescriptionMedication])
def get_prescription_medications(db: Session = Depends(get_db)):
    return crud.get_all_prescription_medications(db=db)

@router.put("/{prescription_medication_id}", response_model=schemas.PrescriptionMedication)
def update_prescription_medication(prescription_medication_id: int, prescription_medication: schemas.PrescriptionMedicationCreate, db: Session = Depends(get_db)):
    updated_prescription_medication = crud.update_prescription_medication(db=db, prescription_medication_id=prescription_medication_id, prescription_medication=prescription_medication)
    if updated_prescription_medication is None:
        raise HTTPException(status_code=404, detail="Prescription Medication not found")
    return updated_prescription_medication

@router.delete("/{prescription_medication_id}")
def delete_prescription_medication(prescription_medication_id: int, db: Session = Depends(get_db)):
    success = crud.delete_prescription_medication(db=db, prescription_medication_id=prescription_medication_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prescription Medication not found")
    return {"message": "Prescription Medication deleted successfully"}
