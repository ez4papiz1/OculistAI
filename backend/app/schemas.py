from pydantic import BaseModel

class TranscriptionResponse(BaseModel):
    summary: str
    transcript: str
