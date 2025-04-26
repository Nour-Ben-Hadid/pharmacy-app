from pydantic import BaseModel
from app import schemas
from typing import List, Optional
from .prescription_medication import PrescriptionMedicationCreate, PrescriptionMedication

# Used to create a prescription by identifying the patient
class PrescriptionCreate(BaseModel):
    patient_id:int
    medications: List[PrescriptionMedicationCreate]

# Read schema
class Prescription(BaseModel):
    id: int
    patient_id: int
    patient: schemas.Patient
    medications: List[PrescriptionMedication]

    model_config = {
        "from_attributes": True
    }


