from pydantic import BaseModel

class PrescriptionMedicationCreate(BaseModel):
    medication_name: str  
    dosage: str
    frequency: str
    duration: str

class PrescriptionMedicationResponse(BaseModel):
    id: int
    prescription_id: int
    medication_name: str  # Added medication_name field
    dosage: str
    frequency: str
    duration: str

    class Config:
        from_attributes = True