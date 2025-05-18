import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Appointment.css";

export default function Appointment() {
    const { id } = useParams();
    const [recording, setRecording] = useState(false);
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [type, setType] = useState("routine");
    const [status, setStatus] = useState("scheduled");
    const [audioURL, setAudioURL] = useState("");
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const streamRef = useRef(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchAppointment = async () => {
            const res = await fetch("http://localhost:8000/appointment");
            const data = await res.json();

            const appointment = data.find((a) => String(a.id) === String(id));
            setStatus(appointment.status);
            setType(appointment.type);
        };

        const fetchTranscription = async () => {
            const res = await fetch(`http://localhost:8000/transcription/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTranscript(data.transcript);
                setSummary(data.summary);
            }
        };

        fetchAppointment();
        fetchTranscription();
    }, [id]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
        };

        mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const file = new File([audioBlob], "audio.webm");
        const localURL = URL.createObjectURL(audioBlob);
        setAudioURL(localURL);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("appointment_id", id);
        formData.append("appointment_type", type);

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
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    return (
    <div style={{ padding: "2rem" }}>
        <h1>Oculist AI - Appointment #{id}</h1>
        <div className="dropdown-row">
            <button className="back" onClick={() => navigate("/")}>Back to Home</button>
            <div className="dropdown">
                <label>Status:&nbsp;</label>
                <select
                value={status}
                onChange={async (e) => {
                    const newStatus = e.target.value;
                    setStatus(newStatus);

                    const formData = new FormData();
                    formData.append("appointment_id", id);
                    formData.append("status", newStatus);

                    await fetch("http://localhost:8000/update-status", {
                    method: "POST",
                    body: formData,
                    });
                }}
                >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
                </select>
            </div>
            <div className="dropdown">
                Appointment Type:&nbsp;
                <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                >
                <option value="routine">Routine Eye Exam</option>
                <option value="contacts">Contact Lens Fitting</option>
                <option value="postsurgery">Post-Operative Check</option>
                </select>
            </div>
        </div>

        {summary && (
            <div className="container">
                <div className="box">
                <h3>Transcript</h3>
                <div className="scroll">{transcript}</div>
                </div>

                <div className="box">
                    <h3>Summary</h3>
                    <div className="scroll">
                        {summary
                        .split("\n")
                        .filter((line) => line.trim().startsWith("-"))
                        .map((point, index) => (
                            <div key={index} className="summary-point">
                                {point}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {audioURL && (
            <div>
            <audio controls src={audioURL}></audio>
            </div>
        )}
         <button onClick={recording ? stopRecording : startRecording}>
            {recording ? "Stop Recording" : "Start Recording"}
        </button>
        </div>
    );
}
