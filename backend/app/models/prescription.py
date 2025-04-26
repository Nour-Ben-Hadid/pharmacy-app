from sqlalchemy import Column, Integer, String, ForeignKey,DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Prescription(Base):
    __tablename__ = 'prescriptions'

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    
    # Optionnel: ces champs peuvent être utilisés pour afficher les infos
    # sans avoir à charger le patient complet
    
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="prescriptions")
    prescription_medications = relationship("PrescriptionMedication", back_populates="prescription", cascade="all, delete-orphan")