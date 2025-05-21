import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Appointment() {
    const { id } = useParams();
    const [recording, setRecording] = useState(false);
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [type, setType] = useState("routine");
    const [status, setStatus] = useState("scheduled");
    const [audioURL, setAudioURL] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [patientName, setPatientName] = useState("");
    const [notes, setNotes] = useState("");
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
            setDoctorName(appointment.doctor_name);
            setPatientName(appointment.patient_name);
            setNotes(appointment.notes || "");
        };

        const fetchTranscription = async () => {
            const res = await fetch(`http://localhost:8000/transcription/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTranscript(data.transcript);
                setSummary(data.summary);
                const url = `http://localhost:8000/${data.audio_path}`;
                setAudioURL(url);
            }
        };

        fetchAppointment();
        fetchTranscription();
    }, [id]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (notes !== "") {
            const formData = new FormData();
            formData.append("appointment_id", id);
            formData.append("notes", notes);

            fetch("http://localhost:8000/update-notes", {
                method: "POST",
                body: formData,
            });
            }
        }, 1000);

        return () => clearTimeout(delay);
    }, [notes]);


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
    <div className="container-fluid" style={{ padding: "50px" }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
            ← Back to Home
            </button>

            <div className="d-flex flex-wrap justify-content-end align-items-center gap-3">
            <div className="d-flex align-items-center gap-1">
                <strong>Doctor:</strong>
                <span>{doctorName}</span>
            </div>
            <div className="d-flex align-items-center gap-1">
                <strong>Patient:</strong>
                <span>{patientName}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
                <label className="fw-bold mb-0">Status:</label>
                <select
                className="form-select form-select-sm w-auto"
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
            <div className="d-flex align-items-center gap-2">
                <label className="fw-bold mb-0">Type:</label>
                <select
                className="form-select form-select-sm w-auto"
                value={type}
                onChange={async (e) => {
                    const newType = e.target.value;
                    setType(newType);
                    const formData = new FormData();
                    formData.append("appointment_id", id);
                    formData.append("appointment_type", newType);
                    await fetch("http://localhost:8000/update-type", {
                    method: "POST",
                    body: formData,
                    });
                }}
                >
                <option value="routine">Routine Eye Exam</option>
                <option value="contacts">Contact Lens Fitting</option>
                <option value="postsurgery">Post-Operative Check</option>
                </select>
            </div>
            </div>
        </div>

        <h1 className="mb-4">Oculist AI - Appointment #{id}</h1>

        <div className="mb-4">
            <button
            className={`btn ${recording ? "btn-danger" : "btn-success"}`}
            onClick={recording ? stopRecording : startRecording}
            >
            {recording ? "Stop Recording" : "Start Recording"}
            </button>
        </div>

        {summary && (
        <div className="row mb-4">
            <div className="col-md-6">
            <h3>Transcript</h3>
            <div className="border p-3 overflow-auto" style={{ maxHeight: "500px" }}>
                {transcript
                .split(/(?=\[\d{2}:\d{2}(?::\d{2})?\])/g)
                .map((segment, index) => (
                    <div key={index}>{segment.trim()}</div>
                ))}
            </div>
            </div>
            <div className="col-md-6">
            <h3>Summary</h3>
            <div className="border p-3 overflow-auto" style={{ maxHeight: "500px" }}>
                {summary
                .split("\n")
                .filter((line) => line.trim().startsWith("-"))
                .map((point, index) => (
                    <div key={index}>• {point.replace(/^-/, "").trim()}</div>
                ))}
            </div>
            </div>
        </div>
        )}

        {audioURL && (
        <div className="mb-4">
            <audio className="w-25" controls preload="auto" src={audioURL}></audio>
        </div>
        )}

        <div className="mb-5 w-25">
        <label className="form-label fw-bold">Notes:</label>
        <textarea
            className="form-control"
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
        />
        </div>
    </div>
    );

}
