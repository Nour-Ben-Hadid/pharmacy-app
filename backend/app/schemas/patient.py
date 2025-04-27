from pydantic import BaseModel
from typing import Optional
from datetime import date 

class PatientCreate(BaseModel):
    ssn: str
    name: str
    date_of_birth: date
    contact_info: str
    allergies: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    ssn: str
    name: str
    date_of_birth: date
    contact_info: str
    allergies: Optional[str] = None

    model_config = {
    "from_attributes": True
} 

class PatientUpdate(BaseModel):
    name: Optional[str]=None
    date_of_birth: Optional[date] = None
    contact_info: Optional[str] = None
    allergies: Optional[str] = None

    model_config = {
    "from_attributes": True
} 
