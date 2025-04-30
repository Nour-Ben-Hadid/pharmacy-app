from __future__ import annotations 
from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = 'patients'

    id = Column(Integer, primary_key=True, index=True)
    ssn = Column(String, unique=True, index=True)  
    name = Column(String, nullable=False)
    date_of_birth = Column(Date)
    contact_info = Column(String)
    allergies = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())