from sqlalchemy.orm import Session
from app.models.prescription_medication import PrescriptionMedication
from app.models.prescription import Prescription 
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.medication import Medication
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from fastapi import HTTPException
from datetime import date

def create_prescription(db: Session, prescription: PrescriptionCreate):
    # Validate patient exists
    patient = db.query(Patient).filter(Patient.ssn == prescription.patient_ssn).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate doctor exists
    doctor = db.query(Doctor).filter(Doctor.license_number == prescription.doctor_license).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Create prescription
    db_prescription = Prescription(
        patient_ssn=prescription.patient_ssn,
        doctor_license=prescription.doctor_license,
        date_issued=date.today(),
        status="pending"
    )
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)

    # Add medications to prescription
    for med in prescription.medications:
        # Validate medication exists
        medication = db.query(Medication).filter(Medication.name == med.medication_name).first()
        if not medication:
            raise HTTPException(status_code=404, detail=f"Medication {med.medication_name} not found")

        # Create prescription-medication link
        db_med = PrescriptionMedication(
            prescription_id=db_prescription.id,
            medication_name=med.medication_name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration=med.duration
        )
        db.add(db_med)
    
    db.commit()
    return db_prescription

def get_prescription(db: Session, prescription_id: int):
    return db.query(Prescription).filter(Prescription.id == prescription_id).first()

def fulfill_prescription(db: Session, prescription_id: int):
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Deduct medication stock and mark as fulfilled
    for med in prescription.medications:
        medication = db.query(Medication).filter(Medication.name == med.medication_name).first()
        if medication.stock_quantity <= 0:
            raise HTTPException(status_code=400, detail=f"{med.medication_name} out of stock")
        medication.stock_quantity -= 1
    
    prescription.status = "fulfilled"
    db.commit()
    return prescription

def update_prescription(db: Session, prescription_id: int, prescription_update: PrescriptionUpdate):
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Update fields that are provided in the update schema
    if prescription_update.patient_ssn is not None:
        # Validate that the new patient exists
        patient = db.query(Patient).filter(Patient.ssn == prescription_update.patient_ssn).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        prescription.patient_ssn = prescription_update.patient_ssn
    
    # Update medications if provided
    if prescription_update.medications is not None:
        # Remove existing medication links
        db.query(PrescriptionMedication).filter(
            PrescriptionMedication.prescription_id == prescription.id
        ).delete()
        
        # Add new medications
        for med in prescription_update.medications:
            # Validate medication exists
            medication = db.query(Medication).filter(Medication.name == med.medication_name).first()
            if not medication:
                raise HTTPException(status_code=404, detail=f"Medication {med.medication_name} not found")

            # Create prescription-medication link
            db_med = PrescriptionMedication(
                prescription_id=prescription.id,
                medication_name=med.medication_name,
                dosage=med.dosage,
                frequency=med.frequency,
                duration=med.duration
            )
            db.add(db_med)
    
    db.commit()
    db.refresh(prescription)
    return prescription

def get_doctor_prescriptions(db: Session, doctor_license: str):
    """Get all prescriptions written by a specific doctor"""
    return db.query(Prescription).filter(Prescription.doctor_license == doctor_license).all()

def get_patient_prescriptions(db: Session, patient_ssn: str):
    """Get all prescriptions for a specific patient"""
    return db.query(Prescription).filter(Prescription.patient_ssn == patient_ssn).all()