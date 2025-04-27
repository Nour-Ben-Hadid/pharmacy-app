from sqlalchemy.orm import Session
from app.models.medication import Medication
from app.schemas.medication import MedicationCreate, MedicationUpdate

def create_medication(db: Session, medication: MedicationCreate):
    db_medication = Medication(**medication.model_dump())
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    return db_medication

def get_medication(db: Session, medication_id: int):
    return db.query(Medication).filter(Medication.id == medication_id).first()

def get_medication_by_name(db: Session, name: str):
    return db.query(Medication).filter(Medication.name == name).first()

def update_medication(db: Session, medication_id: int, medication: MedicationUpdate):
    db_medication = get_medication(db, medication_id)
    if not db_medication:
        return None
    for key, value in medication.model_dump(exclude_unset=True).items():
        setattr(db_medication, key, value)
    db.commit()
    db.refresh(db_medication)
    return db_medication

def delete_medication(db: Session, medication_id: int):
    db_medication = get_medication(db, medication_id)
    if not db_medication:
        return False
    db.delete(db_medication)
    db.commit()
    return True