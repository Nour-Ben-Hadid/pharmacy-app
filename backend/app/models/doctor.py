from __future__ import annotations 
from sqlalchemy import Column, String, Integer
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    license_number = Column(String, unique=True, index=True)  
    name = Column(String)
    specialization = Column(String)  
    contact_info = Column(String)

