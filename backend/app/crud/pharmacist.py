from sqlalchemy.orm import Session
from app.models.pharmacist import Pharmacist
from app.schemas.pharmacist import PharmacistCreate, PharmacistUpdate
from app.utils import get_password_hash

def create_pharmacist(db: Session, pharmacist: PharmacistCreate):
    if get_pharmacist_by_email(db, pharmacist.email):
        raise ValueError("Email already registered")
    
    hashed_password = get_password_hash(pharmacist.password)
    db_pharmacist = Pharmacist(
        **pharmacist.model_dump(exclude={"password"}),
        hashed_password=hashed_password
    )
    db.add(db_pharmacist)
    db.commit()
    db.refresh(db_pharmacist)
    return db_pharmacist

def get_pharmacist(db: Session, pharmacist_id: int):
    return db.query(Pharmacist).filter(Pharmacist.id == pharmacist_id).first()

def get_pharmacist_by_license(db: Session, license_number: str):
    return db.query(Pharmacist).filter(Pharmacist.license_number == license_number).first()

def get_pharmacist_by_email(db: Session, email: str):
    return db.query(Pharmacist).filter(Pharmacist.email == email).first()

def update_pharmacist(db: Session, pharmacist_id: int, pharmacist_update: PharmacistUpdate):
    db_pharmacist = get_pharmacist(db, pharmacist_id)
    if not db_pharmacist:
        return None
    
    update_data = pharmacist_update.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if 'password' in update_data:
        hashed_password = get_password_hash(update_data.pop('password'))
        setattr(db_pharmacist, 'hashed_password', hashed_password)
    
    for key, value in update_data.items():
        setattr(db_pharmacist, key, value)
    
    db.commit()
    db.refresh(db_pharmacist)
    return db_pharmacist

def delete_pharmacist(db: Session, pharmacist_id: int):
    db_pharmacist = get_pharmacist(db, pharmacist_id)
    if not db_pharmacist:
        return False
    db.delete(db_pharmacist)
    db.commit()
    return True