from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base
from pydantic import BaseModel

class PrescriptionMedication(Base):
    __tablename__ = "prescription_medications"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"))  
    dosage = Column(String)  
    frequency = Column(String) 
    duration = Column(String) 


class PrescriptionMedicationCreate(BaseModel):
    medication_name: str  
    dosage: str
    frequency: str
    duration: str