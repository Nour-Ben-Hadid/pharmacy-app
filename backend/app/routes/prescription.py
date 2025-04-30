from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse, PrescriptionUpdate
from app.models.prescription_medication import PrescriptionMedication
from app.crud.prescription import create_prescription, get_prescription, fulfill_prescription, update_prescription
from app.auth.jwt import get_current_doctor, get_current_pharmacist, get_current_patient, get_current_user, UserInfo
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.pharmacist import Pharmacist

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

@router.post("/", response_model=PrescriptionResponse)
def create_new_prescription(
    prescription: PrescriptionCreate, 
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    # Only doctors can create prescriptions
    # Ensure the doctor creating the prescription is using their own license
    if current_doctor.license_number != prescription.doctor_license:
        raise HTTPException(
            status_code=403, 
            detail="You can only create prescriptions with your own license number"
        )
    
    return create_prescription(db, prescription)

# Fixed routes with specific paths must come BEFORE variable routes
@router.get("/doctor", response_model=List[PrescriptionResponse])
async def get_doctor_prescriptions_endpoint(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all prescriptions written by the currently authenticated doctor"""
    from app.crud.prescription import get_doctor_prescriptions
    
    # Get prescriptions for the current doctor using their license number
    prescriptions = get_doctor_prescriptions(db, current_doctor.license_number)
    
    # Return all prescriptions written by this doctor
    return prescriptions

@router.get("/patient", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions_endpoint(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for the currently authenticated patient"""
    from app.crud.prescription import get_patient_prescriptions
    
    # Get prescriptions for the current patient using their SSN
    prescriptions = get_patient_prescriptions(db, current_patient.ssn)
    
    # Return all prescriptions for this patient
    return prescriptions

@router.get("/all", response_model=List[PrescriptionResponse])
async def get_all_prescriptions(
    current_pharmacist: Pharmacist = Depends(get_current_pharmacist),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    patient_ssn: Optional[str] = None,
    doctor_license: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get all prescriptions with optional filtering - pharmacists only
    
    - patient_ssn: Filter by patient SSN
    - doctor_license: Filter by doctor license number
    - status: Filter by status (pending/fulfilled)
    - start_date: Filter prescriptions issued on or after this date
    - end_date: Filter prescriptions issued on or before this date
    """
    # Only pharmacists can access all prescriptions
    # The get_current_pharmacist dependency already ensures this
    
    # Start building the query
    query = db.query(Prescription)
    
    # Apply filters if provided
    if patient_ssn:
        query = query.filter(Prescription.patient_ssn == patient_ssn)
    
    if doctor_license:
        query = query.filter(Prescription.doctor_license == doctor_license)
    
    if status:
        query = query.filter(Prescription.status == status)
    
    if start_date:
        query = query.filter(Prescription.date_issued >= start_date)
    
    if end_date:
        query = query.filter(Prescription.date_issued <= end_date)
        
    # Get total count for pagination info
    total = query.count()
    
    # Apply pagination and fetch results with medications
    prescriptions = query.options(
        joinedload(Prescription.medications)
    ).order_by(Prescription.date_issued.desc()).offset(skip).limit(limit).all()
    
    # Add response headers with pagination info
    # Note: FastAPI doesn't directly support this, would need a custom response class
    # So for now, we'll just return the prescriptions
    
    return prescriptions

# Variable path parameter routes come AFTER the fixed routes
@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription_endpoint(
    prescription_id: int, 
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prescription = db.query(Prescription).options(
        joinedload(Prescription.medications)
    ).filter(Prescription.id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Authorization check: only pharmacists, the prescribing doctor, or the patient can view
    if current_user.user_type == "pharmacist":
        # Pharmacists can view all prescriptions
        pass
    elif current_user.user_type == "doctor":
        # Only the doctor who wrote the prescription can view it
        doctor = db.query(Doctor).filter(Doctor.email == current_user.email).first()
        if doctor.license_number != prescription.doctor_license:
            raise HTTPException(status_code=403, detail="You can only view prescriptions you created")
    elif current_user.user_type == "patient":
        # Only the patient to whom the prescription belongs can view it
        patient = db.query(Patient).filter(Patient.email == current_user.email).first()
        if patient.ssn != prescription.patient_ssn:
            raise HTTPException(status_code=403, detail="You can only view your own prescriptions")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    return prescription

@router.patch("/{prescription_id}/fulfill", response_model=PrescriptionResponse)
def fulfill_prescription_endpoint(
    prescription_id: int, 
    current_pharmacist: Pharmacist = Depends(get_current_pharmacist),
    db: Session = Depends(get_db)
):
    # Only pharmacists can fulfill prescriptions
    # The get_current_pharmacist dependency already ensures this
    return fulfill_prescription(db, prescription_id)

@router.patch("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription_endpoint(
    prescription_id: int, 
    prescription_update: PrescriptionUpdate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    # First check if the prescription exists
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check if the current doctor is the one who wrote the prescription
    if current_doctor.license_number != prescription.doctor_license:
        raise HTTPException(
            status_code=403, 
            detail="You can only modify prescriptions you created"
        )
    
    # Check if the prescription is already fulfilled - can't modify fulfilled prescriptions
    if prescription.status == "fulfilled":
        raise HTTPException(
            status_code=400, 
            detail="Cannot modify a prescription that has already been fulfilled"
        )
    
    return update_prescription(db, prescription_id, prescription_update)