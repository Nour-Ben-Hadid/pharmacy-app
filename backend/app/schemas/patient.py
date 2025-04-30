from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import date, datetime

class PatientBase(BaseModel):
    ssn: str
    name: str
    date_of_birth: date
    contact_info: str
    email: EmailStr
    allergies: Optional[str] = None

class PatientCreate(PatientBase):
    password: str = Field(..., min_length=8)

class PatientResponse(PatientBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    contact_info: Optional[str] = None
    allergies: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

    model_config = ConfigDict(from_attributes=True)

class PatientLogin(BaseModel):
    email: EmailStr
    password: str