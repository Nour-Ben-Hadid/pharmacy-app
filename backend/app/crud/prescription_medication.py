from sqlalchemy.orm import Session
from app import models, schemas
from fastapi import HTTPException

def add_medication_to_prescription(db: Session, data: schemas.PrescriptionMedicationCreate):
    db_entry = models.PrescriptionMedication(
        prescription_id=data.prescription_id,
        medication_id=data.medication_id,
        dosage=data.dosage,
        frequency=data.frequency
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_by_id(db: Session, link_id: int):
    return db.query(models.PrescriptionMedication).filter(models.PrescriptionMedication.id == link_id).first()

def get_all_prescription_medications(db: Session):
    return db.query(models.PrescriptionMedication).all()

def update_prescription_medication(db: Session, link_id: int, data: schemas.PrescriptionMedicationCreate):
    link = get_by_id(db, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.prescription_id = data.prescription_id
    link.medication_id = data.medication_id
    link.dosage = data.dosage
    link.frequency = data.frequency
    db.commit()
    db.refresh(link)
    return link

def delete_prescription_medication(db: Session, link_id: int):
    link = get_by_id(db, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"message": "Prescription-medication link deleted"}
