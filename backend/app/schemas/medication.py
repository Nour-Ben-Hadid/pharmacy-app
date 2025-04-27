from pydantic import BaseModel
from typing import Optional

class MedicationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    dosage_form: str
    strength: str
    stock_quantity: int
    price: float

class MedicationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    dosage_form: str
    strength: str
    stock_quantity: int
    price: float

    model_config = {
    "from_attributes": True
} 
    

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    stock_quantity: Optional[int] = None
    price: Optional[float] = None