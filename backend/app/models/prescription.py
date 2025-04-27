from __future__ import annotations 
from sqlalchemy import Column, Integer,Date, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date 

class Prescription(Base):
    __tablename__ = 'prescriptions'

    id = Column(Integer, primary_key=True, index=True)
    patient_ssn = Column(String, ForeignKey("patients.ssn"))  
    doctor_license = Column(String, ForeignKey("doctors.license_number"))  
    date_issued = Column(Date,default=date.today())
    status = Column(String,default="pending")  # "pending", "fulfilled", "cancelled"

    medications = relationship("app.models.prescription_medication.PrescriptionMedication", back_populates="prescription")