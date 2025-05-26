import openai
import os
import re
import bcrypt


client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def transcribe(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json"
        )

    raw_lines = []
    for segment in response.segments:
        text = segment.text.strip()
        sentences = re.split(r'(?<=[.!?])\s+', text)
        duration = segment.end - segment.start

        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue

            relative_time = segment.start + (i / max(len(sentences), 1)) * duration
            timestamp = f"[{int(relative_time) // 60:02}:{int(relative_time) % 60:02}]"
            raw_lines.append(f"{timestamp} {sentence.strip()}")

    raw_text = "\n".join(raw_lines)

    text = re.sub(
        r'(?<!^)(?<![.!?]\s)\[\d{2}:\d{2}\]',
        '',
        raw_text
    )

    return text.strip()

def summarize(text: str, appointment_type: str) -> str:
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
