from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = 'patients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String,index=True)
    age = Column(Integer)
    contact_info = Column(String,nullable=True)

    prescriptions = relationship("Prescription", back_populates="patient")
