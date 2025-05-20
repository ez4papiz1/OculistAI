from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app import database, crud, schemas, utils, models
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from datetime import datetime

import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/upload")
async def upload_audio(
    appointment_id: int = Form(...),
    file: UploadFile = File(...),
    appointment_type: str = Form(default="routine"),
    db: Session = Depends(database.get_db)
):
    old = db.query(models.Transcription).filter_by(appointment_id=appointment_id).all()
    for t in old:
        if t.audio_path and os.path.exists(t.audio_path):
            os.remove(t.audio_path)
        db.delete(t)
    db.commit()
    
    path = f"uploads/{appointment_id}.webm"
    with open(path, "wb") as f:
        f.write(await file.read())

    transcript = utils.transcribe(path)
    summary = utils.summarize(transcript, appointment_type)

    transcription = crud.save_transcription(
        db, appointment_id, path, transcript, summary
    )

    return {"summary": summary, "transcript": transcript}

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

@app.get("/transcription/{appointment_id}")
def get_transcription_by_appointment(appointment_id: int, db: Session = Depends(database.get_db)):
    transcription = db.query(models.Transcription).filter(models.Transcription.appointment_id == appointment_id).first()
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")

    return {
        "transcript": transcription.transcript,
        "summary": transcription.summary,
        "audio_path": transcription.audio_path
    }

@app.get("/doctors")
def get_doctors(db: Session = Depends(database.get_db)):
    return db.query(models.Doctor).all()

@app.get("/patients")
def get_patients(db: Session = Depends(database.get_db)):
    return db.query(models.Patient).all()


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

