import openai
import os
import re


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

def summarize(text: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Summarize the following eye doctor appointment conversation. Use the following bullet points: Purpose of visit, preexisting conditions, previous Visual acuity, new visual acuity, diagnosis, recommended medication, follow-up appointment, and additional notes. If any of these points are not mentioned, do not include them in the summary. Always use numbers instead of words for numbers (eg. -1 instead of minus one)."},
            {"role": "user", "content": text}
        ]
    )
    return response.choices[0].message.content.strip()