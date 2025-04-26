from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PrescriptionMedication(Base):
    __tablename__ = 'prescription_medications'

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'))
    medication_id = Column(Integer, ForeignKey('medications.id'))
    dosage = Column(String)
    frequency = Column(String)

    prescription = relationship("Prescription", back_populates="prescription_medications")
    medication = relationship("Medication")
