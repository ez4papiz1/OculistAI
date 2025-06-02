import openai
import os
import re
import bcrypt
import json
from pydub import AudioSegment


client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def transcribe(audio_path: str):
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json"
        )

    sentences_with_times = []
    for segment in response.segments:
        text = segment.text.strip()
        sentences = re.split(r'(?<=[.!?])\s+', text)
        segment_duration = segment.end - segment.start
        sentence_count = len(sentences)

        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
            start_time = segment.start + (i / sentence_count) * segment_duration
            sentences_with_times.append({
                "start": round(start_time, 2),
                "text": sentence.strip()
            })

    return sentences_with_times

def summarize(text: str, appointment_type: str, bullets: str) -> str:
    bullet_list = json.loads(bullets)
    bullet_str = ", ".join(bullet_list)
    
    prompt_map = {
        "routine": (
            "Summarize the following eye doctor appointment about a routine eye checkup. Use the following bullet points: "
            "Purpose of visit, vision complaints, medical history, visual acuity, pupil dilation results, diagnosis, follow-up plan."
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "contacts": (
            "Summarize the following eye doctor appointment about contact lens fitting. Use the following bullet points: "
            "Purpose of visit, lens type, comfort level, visual acuity, fitting issues, care instructions, follow-up needs."
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "postsurgery": (
            "Summarize the following eye doctor about a post-operative check-up. Use the following bullet points: "
            "Purpose of visit, type of surgery, recovery progress, current symptoms, visual acuity, complications, next steps."
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "glasses": (
            "Summarize the following eye doctor appointment about a glasses fitting. Use the following bullet points: "
            "Purpose of visit, visual acuity, frame selection, lens options, fitting adjustments, patient comfort, care instructions, follow-up needs. "
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "surgery": (
            "Summarize the following eye doctor appointment about an operation. Use the following bullet points: "
            "Type of operation, purpose of operation, medical history, past surgeries, anesthesia preference, follow-up plan, additional notes. "
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "special": (
            f"Summarize the following eye doctor appointment. Use the following bullet points: {bullet_str}. "
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        ),
        "emergency": (
            "Summarize the following eye doctor appointment about an emergency visit. Use the following bullet points: "+
            "Reason for emergency, symptoms, time of onset, prior treatments, visual acuity, urgent findings, immediate actions, follow-up plan. "+
            "Always use numbers instead of words for numbers (eg. -1 instead of minus one)"
        )
    }
    
    prompt = prompt_map.get(appointment_type, prompt_map["routine"])

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": text}
        ]
    )
    return response.choices[0].message.content.strip()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
