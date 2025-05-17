from app import models

def save_transcription(db, appointment_id, audio_path, transcript, summary):
    t = models.Transcription(
        appointment_id=appointment_id,
        audio_path=audio_path,
        transcript=transcript,
        summary=summary
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t
