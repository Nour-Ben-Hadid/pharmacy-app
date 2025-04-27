from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.schemas.prescription_medication import PrescriptionMedicationCreate, PrescriptionMedication

class PrescriptionCreate(BaseModel):
    patient_ssn:str
    doctor_license:str
    medications: List[PrescriptionMedicationCreate]


class PrescriptionMedicationBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str


class PrescriptionMedicationResponse(PrescriptionMedicationBase):
    id: int

class PrescriptionResponse(BaseModel):
    id: int
    patient_ssn: str
    doctor_license: str
    date_issued: date
    status: str
    medications: List[PrescriptionMedicationResponse]

    class Config:
        from_attributes = True