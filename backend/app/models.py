from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Enum, ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class AppointmentStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    canceled = "canceled"
    
class AppointmentTypeEnum(str, enum.Enum):
    routine = "routine"
    contacts = "contacts"
    postsurgery = "postsurgery"
    special = "special"
    glasses = "glasses"
    surgery = "surgery"
    emergency = "emergency"

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True)
    firstname = Column(String(255), nullable=False)
    lastname = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hash = Column(String(255), nullable=False)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    firstname = Column(String(255), nullable=False)
    lastname = Column(String(255), nullable=False)
    birth_date = Column(Date)
    notes = Column(Text)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    notes = Column(Text)
    type = Column(Enum(AppointmentTypeEnum), default="routine")
    status = Column(Enum(AppointmentStatusEnum), default="scheduled")

    patient = relationship("Patient")
    doctor = relationship("Doctor")

class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    audio_path = Column(String(512))
    transcript = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    appointment = relationship("Appointment")
