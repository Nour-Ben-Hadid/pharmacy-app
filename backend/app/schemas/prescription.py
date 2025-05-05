from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.schemas.prescription_medication import PrescriptionMedicationCreate, PrescriptionMedicationResponse

class PrescriptionCreate(BaseModel):
    patient_ssn: str
    doctor_license: str
    medications: List[PrescriptionMedicationCreate]

# Schema for updating prescriptions - status is excluded as it can only be changed 
# by pharmacists during fulfillment
class PrescriptionUpdate(BaseModel):
    patient_ssn: Optional[str] = None
    medications: Optional[List[PrescriptionMedicationCreate]] = None

# Using the models defined in prescription_medication.py instead of redefining them here

class PrescriptionResponse(BaseModel):
    id: int
    patient_ssn: str
    doctor_license: str
    date_issued: date
    status: str
    medications: List[PrescriptionMedicationResponse]
    patient_name: Optional[str] = None  # Add patient name field
    doctor_name: Optional[str] = None   # Add doctor name field

    class Config:
        from_attributes = True