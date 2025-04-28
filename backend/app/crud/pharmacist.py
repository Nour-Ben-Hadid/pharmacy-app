from sqlalchemy.orm import Session
from app.models.pharmacist import Pharmacist
from app.schemas.pharmacist import PharmacistCreate


def create_pharmacist(db:Session, pharmacist:PharmacistCreate):
    db_pharmacist= Pharmacist(**pharmacist.model_dump())
    db.add(db_pharmacist)
    db.commit()
    db.refresh(db_pharmacist)
    return db_pharmacist

def get_pharmacist(db: Session, pharmacist_id: int):
    return db.query(Pharmacist).filter(Pharmacist.id == pharmacist_id).first()

def get_pharmacist_by_license(db: Session, license_number: str):
    return db.query(Pharmacist).filter(Pharmacist.license_number == license_number).first()

def update_pharmacist(db: Session, pharmacist_id: int, pharmacist_update: dict):
    db_pharmacist = get_pharmacist(db, pharmacist_id)
    if not db_pharmacist:
        return None
    for key, value in pharmacist_update.items():
        setattr(db_pharmacist, key, value)
    db.commit()
    return db_pharmacist

def delete_pharmacist(db: Session, pharmacist_id: int):
    db_pharmacist = get_pharmacist(db, pharmacist_id)
    if not db_pharmacist:
        return False
    db.delete(db_pharmacist)
    db.commit()
    return True