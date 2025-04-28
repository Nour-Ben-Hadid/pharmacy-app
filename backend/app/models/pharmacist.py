from __future__ import annotations 
from sqlalchemy import Column, String, Integer
from app.database import Base

class Pharmacist(Base):
    __tablename__="pharmacists"
    id = Column(Integer,primary_key=True , index=True)
    
    license_number= Column(String , unique=True , index=True)
    name =Column(String)





