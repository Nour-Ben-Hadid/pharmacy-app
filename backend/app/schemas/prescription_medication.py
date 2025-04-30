from pydantic import BaseModel

class PrescriptionMedicationCreate(BaseModel):
    medication_name: str  
    dosage: str
    frequency: str
    duration: str

class PrescriptionMedicationResponse(BaseModel):
    id: int
    prescription_id: int
    dosage: str
    frequency: str
    duration: str

    class Config:
        from_attributes = True