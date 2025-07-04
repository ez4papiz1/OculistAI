from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app import database, schemas, utils, models
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from datetime import datetime

import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio upload directory (use absolute path for Railway volume)
UPLOADS_DIR = "/uploads"
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Upload audio and generate transcription/summary
@app.post("/upload")
async def upload_audio(
    appointment_id: int = Form(...),
    file: UploadFile = File(...),
    appointment_type: str = Form(...),
    bullets: str = Form(None),
    db: Session = Depends(database.get_db)
):
    old = db.query(models.Transcription).filter_by(appointment_id=appointment_id).all()
    for t in old:
        if t.audio_path and os.path.exists(t.audio_path):
            os.remove(t.audio_path)
        db.delete(t)
    db.commit()
    
    # Save to Railway volume
    path = f"{UPLOADS_DIR}/{appointment_id}.webm"
    file_bytes = await file.read()
    with open(path, "wb") as f:
        f.write(file_bytes)

    transcript = utils.transcribe(path)
    summary = utils.summarize(" ".join([s['text'] for s in transcript]), appointment_type, bullets)

    transcript_json = json.dumps(transcript)
    t = models.Transcription(
        appointment_id=appointment_id,
        audio_path=path,
        transcript=transcript_json,
        summary=summary
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    return {"summary": summary, "transcript": transcript}

# Update appointment status route
@app.post("/update-status")
def update_status(
    appointment_id: int = Form(...),
    status: str = Form(...),
    db: Session = Depends(database.get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appointment:
        appointment.status = status
        db.commit()
        return {"success": True}
    return {"success": False, "error": "Appointment not found"}

# Get all appointment info
@app.get("/appointment")
def get_appointments(db: Session = Depends(database.get_db)):
    appointments = db.query(models.Appointment).all()
    results = []
    for a in appointments:
        doctor = db.query(models.Doctor).filter(models.Doctor.id == a.doctor_id).first()
        patient = db.query(models.Patient).filter(models.Patient.id == a.patient_id).first()

        doctor_name = f"{doctor.firstname} {doctor.lastname}"
        patient_name = f"{patient.firstname} {patient.lastname}"

        results.append({
            "id": a.id,
            "appointment_time": a.appointment_time,
            "status": a.status,
            "type": a.type,
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "notes": a.notes
        })
    return results

# Get appointment by id
@app.get("/transcription/{appointment_id}")
def get_transcription_by_appointment(appointment_id: int, db: Session = Depends(database.get_db)):
    transcription = db.query(models.Transcription).filter(models.Transcription.appointment_id == appointment_id).first()
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")

    import json
    try:
        transcript = json.loads(transcription.transcript)
    except Exception:
        transcript = transcription.transcript

    return {
        "transcript": transcript,
        "summary": transcription.summary,
        "audio_path": transcription.audio_path
    }

# Get doctors and patients
@app.get("/doctors")
def get_doctors(db: Session = Depends(database.get_db)):
    return db.query(models.Doctor).all()

@app.get("/patients")
def get_patients(db: Session = Depends(database.get_db)):
    return db.query(models.Patient).all()

# Create appointment route
@app.post("/appointment")
def create_appointment(
    doctor_id: int = Form(...),
    patient_id: int = Form(...),
    appointment_time: str = Form(...),
    type: str = Form(...),
    notes: str = Form(""),
    db: Session = Depends(database.get_db)
):
    try:
        appointment_time = datetime.fromisoformat(appointment_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")

    new_appointment = models.Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        appointment_time=appointment_time,
        type=type,
        notes=notes
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return {"status": "success", "appointment_id": new_appointment.id}

# Create patient route
@app.post("/patients")
def create_patient(
    firstname: str = Form(...),
    lastname: str = Form(...),
    birth_date: str = Form(...),
    notes: str = Form(""),
    db: Session = Depends(database.get_db)
):
    new_patient = models.Patient(
        firstname=firstname,
        lastname=lastname,
        birth_date=birth_date,
        notes=notes
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return {"id": new_patient.id, "message": "Patient created successfully"}

# Update notes route
@app.post("/update-notes")
def update_notes(
    appointment_id: int = Form(...),
    notes: str = Form(...),
    db: Session = Depends(database.get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    appointment.notes = notes
    db.commit()
    return {"message": "Notes updated"}

# Update type route
@app.post("/update-type")
async def update_type(
    appointment_id: int = Form(...),
    appointment_type: str = Form(...),
    db: Session = Depends(database.get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    appointment.type = appointment_type
    db.commit()
    return {"message": "Appointment type updated"}

# Add doctor route
@app.post("/doctors")
def create_doctor(
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(""),
    password: str = Form(...),
    db: Session = Depends(database.get_db)
):
    if email:
        existing = db.query(models.Doctor).filter(models.Doctor.email == email).first()
        if existing:
            raise HTTPException(status_code=401, detail="exists")
    new_doctor = models.Doctor(
        firstname=firstname,
        lastname=lastname,
        email=email,
        hash=utils.hash_password(password)
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    return {"id": new_doctor.id, "message": "Doctor created successfully"}

# Update doctor name route
@app.post("/update-doctor-name")
def update_doctor_name(
    doctor_id: int = Form(...),
    firstname: str = Form(...),
    lastname: str = Form(...),
    db: Session = Depends(database.get_db)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.firstname = firstname
    doctor.lastname = lastname
    db.commit()
    return {"message": "Name updated"}

# Update doctor email route
@app.post("/update-doctor-email")
def update_doctor_email(
    doctor_id: int = Form(...),
    email: str = Form(...),
    db: Session = Depends(database.get_db)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.email = email
    db.commit()
    return {"message": "Email updated"}

# Update doctor password route
@app.post("/update-doctor-password")
def update_doctor_password(
    doctor_id: int = Form(...),
    old_password: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(database.get_db)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not utils.verify_password(old_password, doctor.hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    doctor.hash = utils.hash_password(new_password)
    db.commit()
    return {"message": "Password updated"}

# Login route
@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(database.get_db)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.email == email).first()
    if not doctor or not utils.verify_password(password, doctor.hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": doctor.id, "email": doctor.email, "firstname": doctor.firstname, "lastname": doctor.lastname}

# Update appointment route
@app.post("/update-appointment")
def update_appointment(
    appointment_id: int = Form(...),
    doctor_id: int = Form(...),
    patient_id: int = Form(...),
    appointment_time: str = Form(...),
    type: str = Form(...),
    notes: str = Form(""),
    status: str = Form(...),
    db: Session = Depends(database.get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    try:
        appointment.appointment_time = datetime.fromisoformat(appointment_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    appointment.doctor_id = doctor_id
    appointment.patient_id = patient_id
    appointment.type = type
    appointment.notes = notes
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return {"status": "success", "appointment_id": appointment.id}

# Delete appointment route
@app.post("/delete-appointment")
def delete_appointment(
    appointment_id: int = Form(...),
    db: Session = Depends(database.get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    transcriptions = db.query(models.Transcription).filter(models.Transcription.appointment_id == appointment_id).all()
    for t in transcriptions:
        if t.audio_path and os.path.exists(t.audio_path):
            os.remove(t.audio_path)
        db.delete(t)
    db.delete(appointment)
    db.commit()
    return {"status": "success"}

# Edit doctor route
@app.post("/edit-doctor")
def edit_doctor(
    doctor_id: int = Form(...),
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(database.get_db)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if email and email != doctor.email:
        existing = db.query(models.Doctor).filter(models.Doctor.email == email).first()
        if existing:
            raise HTTPException(status_code=401, detail="exists")
    doctor.firstname = firstname
    doctor.lastname = lastname
    doctor.email = email
    db.commit()
    db.refresh(doctor)
    return {"message": "Doctor updated successfully"}

# Edit patient route
@app.post("/edit-patient")
def edit_patient(
    patient_id: int = Form(...),
    firstname: str = Form(...),
    lastname: str = Form(...),
    birth_date: str = Form(...),
    notes: str = Form(""),
    db: Session = Depends(database.get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.firstname = firstname
    patient.lastname = lastname
    patient.birth_date = birth_date
    patient.notes = notes
    db.commit()
    db.refresh(patient)
    return {"message": "Patient updated successfully"}

