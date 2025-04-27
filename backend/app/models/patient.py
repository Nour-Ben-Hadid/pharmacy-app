from sqlalchemy import Column, Integer, String , Date
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
