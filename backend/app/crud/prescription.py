from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from fastapi import HTTPException

def create_prescription(db: Session, prescription_data: schemas.PrescriptionCreate):
    # Vérifier si le patient existe déjà
    patient = db.query(models.Patient).filter(
        models.Patient.name == prescription_data.patient_name,
        models.Patient.age == prescription_data.patient_age
    ).first()
    
    # Créer le patient s'il n'existe pas
    if not patient:
        patient = models.Patient(
            name=prescription_data.patient_name,
            age=prescription_data.patient_age
        )
        db.add(patient)
        db.flush()  # Pour obtenir l'ID du patient
    
    # Créer la prescription
    db_prescription = models.Prescription(
        patient_id=patient.id,
        patient_name=prescription_data.patient_name,  # Stockage redondant pour facilité d'accès
        patient_age=prescription_data.patient_age     # Stockage redondant pour facilité d'accès
    )
    db.add(db_prescription)
    db.flush()
    
    # Ajouter les médicaments
    for med in prescription_data.medications:
        db_med = models.PrescriptionMedication(
            prescription_id=db_prescription.id,
            medication_id=med.medication_id,
            dosage=med.dosage,
            frequency=med.frequency
        )
        db.add(db_med)
    
    db.commit()
    db.refresh(db_prescription)
    return db_prescription


def get_prescription_by_id(db: Session, presc_id: int):
    return db.query(models.Prescription).filter(models.Prescription.id == presc_id).first()

# crud.py
def get_all_prescriptions(db: Session):
    return db.query(models.Prescription).options(
        joinedload(models.Prescription.prescription_medications).joinedload(models.PrescriptionMedication.medication)
    ).all()

def update_prescription(db: Session, presc_id: int, new_patient_id: int):
    prescription = get_prescription_by_id(db, presc_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    prescription.patient_id = new_patient_id
    db.commit()
    db.refresh(prescription)
    return prescription

def delete_prescription(db: Session, presc_id: int):
    prescription = get_prescription_by_id(db, presc_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    db.delete(prescription)
    db.commit()
    return {"message": "Prescription deleted"}
