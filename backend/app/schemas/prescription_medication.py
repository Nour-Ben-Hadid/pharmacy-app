from pydantic import BaseModel
from app import schemas


# Used inside PrescriptionCreate to describe each med
class PrescriptionMedicationCreate(BaseModel):
    medication_name: str
    dosage: str
    frequency: str

# Read schema
class PrescriptionMedication(BaseModel):
    id :int 
    medication_id: int
    prescription_id: int
    medication_name: str
    dosage: str
    frequency: str
    medication:schemas.Medication

    model_config = {
        "from_attributes": True
    }
