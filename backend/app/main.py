from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app import database, crud, schemas, utils, models
from fastapi.middleware.cors import CORSMiddleware

import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_audio(
    appointment_id: int = Form(...),
    file: UploadFile = File(...),
    appointment_type: str = Form(default="routine"),
    db: Session = Depends(database.get_db)
):
    path = f"uploads/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())

    transcript = utils.transcribe(path)
    summary = utils.summarize(transcript, appointment_type)
    
    crud.update_type(db, appointment_id=int(appointment_id), appointment_type=appointment_type)

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
            "patient_name": patient_name
        })
    return results

@app.get("/transcription/{appointment_id}")
def get_transcription_by_appointment(appointment_id: int, db: Session = Depends(database.get_db)):
    transcription = db.query(models.Transcription).filter(models.Transcription.appointment_id == appointment_id).first()
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")

    return {
        "transcript": transcription.transcript,
        "summary": transcription.summary
    }
