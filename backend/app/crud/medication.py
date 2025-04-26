from sqlalchemy.orm import Session
from app import models, schemas
from fastapi import HTTPException

def create_medication(db: Session, medication: schemas.MedicationCreate):
    db_med = models.Medication(name=medication.name)
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

def get_medication_by_id(db: Session, med_id: int):
    return db.query(models.Medication).filter(models.Medication.id == med_id).first()

def get_medication_by_name(db: Session, name: str):
    return db.query(models.Medication).filter(models.Medication.name == name).first()

def get_all_medications(db: Session):
    return db.query(models.Medication).all()

def update_medication(db: Session, med_id: int, new_data: schemas.MedicationCreate):
    med = get_medication_by_id(db, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    med.name = new_data.name
    db.commit()
    db.refresh(med)
    return med

def delete_medication(db: Session, med_id: int):
    med = get_medication_by_id(db, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(med)
    db.commit()
    return {"message": "Medication deleted"}
