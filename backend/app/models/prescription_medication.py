from __future__ import annotations 
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PrescriptionMedication(Base):
    __tablename__ = 'prescription_medications'
    __table_args__ = {'extend_existing': True , 'sqlite_autoincrement': True}  

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    medication_name = Column(String, ForeignKey('medications.id'))  
    dosage = Column(String)  
    frequency = Column(String)  
    duration = Column(String)  

    prescription = relationship("app.models.prescription.Prescription", back_populates="medications")
    medication = relationship("app.models.medication.Medication", back_populates="prescriptions")