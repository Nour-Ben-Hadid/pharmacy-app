from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.models.prescription_medication import PrescriptionMedication
from app.crud.prescription import create_prescription, get_prescription, fulfill_prescription

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

@router.post("/", response_model=PrescriptionResponse)
def create_new_prescription(
    prescription: PrescriptionCreate, 
    db: Session = Depends(get_db)
):
    return create_prescription(db, prescription)


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    prescription = db.query(Prescription).options(
        joinedload(Prescription.medications)
    ).filter(Prescription.id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    return prescription

@router.patch("/{prescription_id}/fulfill", response_model=PrescriptionResponse)
def fulfill_prescription_endpoint(
    prescription_id: int, 
    db: Session = Depends(get_db)
):
    return fulfill_prescription(db, prescription_id)