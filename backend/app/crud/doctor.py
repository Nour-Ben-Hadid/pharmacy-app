from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorUpdate
from app.utils import get_password_hash

def create_doctor(db: Session, doctor: DoctorCreate):
    if get_doctor_by_email(db, doctor.email):
        raise ValueError("Email already registered")
        
    hashed_password = get_password_hash(doctor.password)
    db_doctor = Doctor(
        **doctor.model_dump(exclude={"password"}),
        hashed_password=hashed_password
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def get_doctor(db: Session, doctor_id: int):
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()

def get_doctor_by_license(db: Session, license_number: str):
    return db.query(Doctor).filter(Doctor.license_number == license_number).first()

def get_doctor_by_email(db: Session, email: str):
    return db.query(Doctor).filter(Doctor.email == email).first()

def update_doctor(db: Session, doctor_id: int, doctor_update: DoctorUpdate):
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return None
    
    update_data = doctor_update.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if 'password' in update_data:
        hashed_password = get_password_hash(update_data.pop('password'))
        setattr(db_doctor, 'hashed_password', hashed_password)
    
    for key, value in update_data.items():
        setattr(db_doctor, key, value)
    
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def delete_doctor(db: Session, doctor_id: int):
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return False
    db.delete(db_doctor)
    db.commit()
    return True