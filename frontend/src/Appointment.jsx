import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Appointment() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const doctor = location.state?.doctor || null;
    const [checkedAuth, setCheckedAuth] = useState(false);
    const [recording, setRecording] = useState(false);
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [type, setType] = useState("routine");
    const [status, setStatus] = useState("scheduled");
    const [audioURL, setAudioURL] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [patientName, setPatientName] = useState("");
    const [notes, setNotes] = useState("");
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [bullets, setBullets] = useState([
        "Purpose of visit",
        "Vision complaints",
        "Medical history",
        "Past visual acuity",
        "Current visual acuity",
        "Diagnosis",
        "Follow-up plan",
        "Next appointment",
    ]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingValue, setEditingValue] = useState("");
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const streamRef = useRef(null);


    useEffect(() => {
        if (!doctor) {
            alert("Please login");
            navigate("/login", { replace: true });
        } else {
            setCheckedAuth(true);
        }
    }, [doctor, navigate]);

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
                if (data.bullets && Array.isArray(data.bullets)) {
                    setBullets(data.bullets);
                }
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
            if (type === "special") {
                formData.append("bullets", JSON.stringify(bullets));
            } else {
                formData.append("bullets", JSON.stringify([]));
            }

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

    useEffect(() => {
        if (!mediaRecorder.current) return;
        const origOnStop = mediaRecorder.current.onstop;
        mediaRecorder.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
            const file = new File([audioBlob], "audio.webm");
            const localURL = URL.createObjectURL(audioBlob);
            setAudioURL(localURL);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("appointment_id", id);
            formData.append("appointment_type", type);
            if (type === "special") {
                formData.append("bullets", JSON.stringify(bullets));
            }

            const res = await fetch("http://localhost:8000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setSummary(data.summary);
            setTranscript(data.transcript);
        };
        return () => {
            mediaRecorder.current.onstop = origOnStop;
        };
    }, [type, bullets]);


    if (!checkedAuth) return null;

    return (
    <div className="container-fluid" style={{ padding: "50px" }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/home", { state: doctor })}>
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
                            if (newType === "special") setBullets([
                                "Purpose of visit",
                                "Vision complaints",
                                "Medical history",
                                "Past visual acuity",
                                "Current visual acuity",
                                "Diagnosis",
                                "Follow-up plan",
                                "Next appointment",
                            ]);
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
                        <option value="special">Special</option>
                    </select>
                </div>
            </div>
        </div>

        <h1 className="mb-5">Oculist AI - Appointment #{id}</h1>
        <div className="d-flex align-items-start mb-5">
            <button className={`btn ${recording ? "btn-danger" : "btn-success"}`} onClick={recording ? stopRecording : startRecording} >{recording ? "Stop Recording" : "Start Recording"}</button>
            {type === "special" && (
                <button className="btn btn-outline-primary ms-2" onClick={() => setShowSummaryModal(true)} >Edit Summary</button>
            )}
        </div>
        {summary && (
        <div className="row mb-4">
            <div className="col-md-6">
            <h3>Transcript</h3>
            <div className="border p-3 overflow-auto" style={{ maxHeight: "500px" }}>
                {transcript.split(/(?=\[\d{2}:\d{2}(?::\d{2})?\])/g).map((segment, index) => (
                    <div key={index} style={{ paddingBottom: "20px" }}>{segment.trim()}</div>
                ))}
            </div>
            </div>
            <div className="col-md-6">
            <h3>Summary</h3>
            <div className="border p-3 overflow-auto" style={{ maxHeight: "500px" }}>
                {summary
                    .split("\n")
                    .filter((line) => line.trim().startsWith("-"))
                    .map((point, index) => {
                        const [title, ...rest] = point.replace(/^-/, "").split(":");
                        return (
                            <div key={index} style={{ marginBottom: "1.2em", lineHeight: "1.2" }}>
                                <strong>• {title.trim()}:</strong>
                                {rest.length > 0 && (
                                    <>
                                        <br /><br />
                                        <span>&nbsp;&nbsp;&nbsp;&nbsp;{rest.join(":").trim()}</span>
                                    </>
                                )}
                            </div>
                        );
                    })
                }
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

        {showSummaryModal && (
            <div className="modal d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content p-4">
                        <h2 className="mb-3">Edit Summary</h2>
                        <ul className="list-group mb-3"
                            style={{ cursor: 'grab' }}
                        >
                            {bullets.map((bullet, idx) => (
                                <li
                                    key={idx}
                                    className="list-group-item d-flex align-items-center justify-content-between"
                                    draggable
                                    onDragStart={e => {
                                        e.dataTransfer.effectAllowed = "move";
                                        e.dataTransfer.setData("text/plain", idx);
                                    }}
                                    onDragOver={e => {
                                        e.preventDefault();
                                        e.currentTarget.style.background = '#f0f0f0';
                                    }}
                                    onDragLeave={e => {
                                        e.currentTarget.style.background = '';
                                    }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.style.background = '';
                                        const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                                        if (fromIdx === idx) return;
                                        const newBullets = [...bullets];
                                        const [moved] = newBullets.splice(fromIdx, 1);
                                        newBullets.splice(idx, 0, moved);
                                        setBullets(newBullets);
                                        setEditingIndex(null);
                                    }}
                                >
                                    {editingIndex === idx ? (
                                        <input
                                            className="form-control me-2"
                                            value={editingValue}
                                            autoFocus
                                            onChange={e => setEditingValue(e.target.value)}
                                            onBlur={() => {
                                                if (editingValue.trim() !== "") {
                                                    setBullets(bullets.map((b, i) => i === idx ? editingValue : b));
                                                }
                                                setEditingIndex(null);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    if (editingValue.trim() !== "") {
                                                        setBullets(bullets.map((b, i) => i === idx ? editingValue : b));
                                                    }
                                                    setEditingIndex(null);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <span>{bullet}</span>
                                    )}
                                    <span>
                                        <button
                                            className="btn btn-sm btn-link text-primary"
                                            onClick={() => {
                                                setEditingIndex(idx);
                                                setEditingValue(bullet);
                                            }}
                                            title="Edit"
                                        >
                                            <span className="material-icons">edit</span>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-link text-danger"
                                            onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                            title="Delete"
                                        >
                                            <span className="material-icons">delete</span>
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button
                                className="btn btn-outline-success"
                                onClick={() => {
                                    setBullets([...bullets, "New bullet point"]);
                                    setEditingIndex(bullets.length);
                                    setEditingValue("");
                                }}
                            >
                                <span className="material-icons align-middle">add</span> Add Bullet Point
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    );

}
