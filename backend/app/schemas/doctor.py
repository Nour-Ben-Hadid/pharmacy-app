from pydantic import BaseModel

class DoctorCreate(BaseModel):
    license_number: str
    name: str
    specialization: str
    contact_info: str

class DoctorResponse(BaseModel):
    id: int
    license_number: str
    name: str
    specialization: str
    contact_info: str

    model_config = {
    "from_attributes": True
} 