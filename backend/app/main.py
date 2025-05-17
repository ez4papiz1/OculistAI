from fastapi import FastAPI, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from app import database, crud, schemas, utils
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
    db: Session = Depends(database.get_db)
):
    path = f"uploads/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())

    transcript = utils.transcribe(path)
    summary = utils.summarize(transcript)

    transcription = crud.save_transcription(
        db, appointment_id, path, transcript, summary
    )

    return {"summary": summary, "transcript": transcript}
