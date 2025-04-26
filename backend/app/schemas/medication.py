from pydantic import BaseModel

class MedicationBase(BaseModel):
    name: str

class MedicationCreate(MedicationBase):
    pass

class Medication(MedicationBase):
    id: int

    model_config = {
    "from_attributes": True
}

