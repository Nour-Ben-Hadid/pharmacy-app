from __future__ import annotations 
from sqlalchemy import Column, String, Integer, Boolean, DateTime, func
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    license_number = Column(String, unique=True, index=True)  
    name = Column(String)
    specialization = Column(String)  
    contact_info = Column(String)
    email = Column(String, unique=True, index=True)  
    hashed_password = Column(String)  
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())