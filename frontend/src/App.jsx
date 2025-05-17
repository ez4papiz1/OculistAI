import React, { useState, useRef } from "react";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      const file = new File([audioBlob], "audio.webm");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("appointment_id", "1"); // For now, use dummy ID

      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setSummary(data.summary);
      setTranscript(data.transcript);
    };

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Oculist AI Summary</h1>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {summary && (
        <div>
          <h2>Summary</h2>
          <p>{summary}</p>

          <h3>Transcript</h3>
          <p style={{ whiteSpace: "pre-line"}}>
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
}
