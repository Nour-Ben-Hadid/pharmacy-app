from pydantic import BaseModel

class PatientCreate(BaseModel):
    name: str
    age: int
    contact_info: str

class Patient(PatientCreate):
    id: int

    model_config = {
    "from_attributes": True
}


class PatientUpdate(BaseModel):
    name: str
    age: int
    contact_info: str
