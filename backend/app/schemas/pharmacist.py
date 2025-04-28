from pydantic import BaseModel

class PharmacistCreate(BaseModel):
    license_number: str
    name: str
    

class PharmacistResponse(BaseModel):
    id: int
    license_number: str
    name: str

    model_config = {
    "from_attributes": True
} 