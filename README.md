# Oculist AI

**Oculist AI** is a full-stack web application built to support ophthalmologists by automatically recording, transcribing, and summarizing patient consultations using AI technologies.

The system allows for easy clinical documentation by capturing conversations during appointments and generating timestamped transcripts along with structured and detailed summaries, allowing doctors to focus more on the patient and less on note-taking.

<img width="1399" alt="Screenshot 2025-06-03 at 3 28 14 AM" src="https://github.com/user-attachments/assets/65bc5d93-7831-46b7-8bfd-8979f96f9128" />
<img width="1398" alt="Screenshot 2025-06-03 at 3 32 20 AM" src="https://github.com/user-attachments/assets/ec10028b-0c32-45ba-804f-3120c3d85057" />
<img width="1398" alt="Screenshot 2025-06-03 at 3 32 20 AM" src="https://github.com/user-attachments/assets/96fa0a7e-a951-4360-8ac0-1f174223d8d5" />
<img width="1398" alt="image" src="https://github.com/user-attachments/assets/0ce53683-7c32-474e-9905-08f5e5648cee" />


## Features

- Voice recording during patient consultations
- Automatic transcription using OpenAI Whisper
- Timestamped dialog
- Summarization of patient dialogue using GPT models
- Appointment schedule and calendar
- Account management
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

- Frontend is available at: http://localhost:5173

- Backend API is available at: http://localhost:8000