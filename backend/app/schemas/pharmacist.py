from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class PharmacistBase(BaseModel):
    license_number: str
    name: str
    email: EmailStr

class PharmacistCreate(PharmacistBase):
    password: str = Field(..., min_length=8)
    
class PharmacistUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

class PharmacistResponse(PharmacistBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None 
    
    model_config = ConfigDict(from_attributes=True)

class PharmacistLogin(BaseModel):
    email: EmailStr
    password: str