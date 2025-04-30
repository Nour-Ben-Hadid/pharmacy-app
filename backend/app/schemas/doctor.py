from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class DoctorBase(BaseModel):
    license_number: str
    name: str
    specialization: str
    contact_info: str
    email: EmailStr

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=8)

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    contact_info: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

class DoctorResponse(DoctorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class DoctorLogin(BaseModel):
    email: EmailStr
    password: str