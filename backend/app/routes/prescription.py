from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Prescription)
def create_prescription(prescription: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    return crud.create_prescription(db, prescription)

@router.get("/{prescription_id}", response_model=schemas.Prescription)
def get_prescription_by_id(prescription_id: int, db: Session = Depends(get_db)):
    prescription = crud.get_prescription_by_id(db=db, prescription_id=prescription_id)
    if prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription

@router.get("/", response_model=list[schemas.Prescription])
def get_prescriptions(db: Session = Depends(get_db)):
    try:
        prescriptions = crud.get_all_prescriptions(db)
        return prescriptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{prescription_id}", response_model=schemas.Prescription)
def update_prescription(prescription_id: int, prescription: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    updated_prescription = crud.update_prescription(db=db, prescription_id=prescription_id, prescription=prescription)
    if updated_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return updated_prescription

@router.delete("/{prescription_id}")
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    success = crud.delete_prescription(db=db, prescription_id=prescription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return {"message": "Prescription deleted successfully"}
