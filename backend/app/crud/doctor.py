from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate

def create_doctor(db: Session, doctor: DoctorCreate):
    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def get_doctor(db: Session, doctor_id: int):
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()

def get_doctor_by_license(db: Session, license_number: str):
    return db.query(Doctor).filter(Doctor.license_number == license_number).first()

def update_doctor(db: Session, doctor_id: int, doctor_update: dict):
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return None
    for key, value in doctor_update.items():
        setattr(db_doctor, key, value)
    db.commit()
    return db_doctor

def delete_doctor(db: Session, doctor_id: int):
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return False
    db.delete(db_doctor)
    db.commit()
    return True