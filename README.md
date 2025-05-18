# Oculist AI

**Oculist AI** is a full-stack web application built to support ophthalmologists by automatically recording, transcribing, and summarizing patient consultations using AI technologies.

The system allows for easy clinical documentation by capturing conversations during appointments and generating timestamped transcripts along with structured and detailed summaries, allowing doctors to focus more on the patient and less on note-taking.

## Features

- Voice recording during patient consultations
- Automatic transcription using OpenAI Whisper
- Timestamped dialog
- Summarization of patient dialogue using GPT models
- Full-stack setup with React (frontend), FastAPI (backend), MariaDB, and Docker

## To run this locally:

### 1. Clone the repository

```bash
git clone https://github.com/ez4papiz1/OculistAI.git
cd OculistAI
```
### 2. Set up environment variables

Create a .env file at the project root with the following content:

```bash
OPENAI_API_KEY=your-openai-api-key
DATABASE_DB=main
DATABASE_USER=root
DATABASE_PASSWORD=your-database-password
DATABASE_HOST=db
```

### 3. Build and run the application with Docker

```bash
docker compose up --build
```
Once running:

- Frontend is available at: http://localhost:4173

- Backend API is available at: http://localhost:8000
