import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";

const appointmentTypeOptions = [
    { value: "routine", label: "Routine Eye Exam" },
    { value: "glasses", label: "Glasses Fitting" },
    { value: "contacts", label: "Contact Lens Fitting" },
    { value: "surgery", label: "Surgery Consultation" },
    { value: "postsurgery", label: "Post-surgery Consultation" },
    { value: "emergency", label: "Emergency Visit" },
    { value: "special", label: "Special Examination" },
];

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
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingTranscript, setLoadingTranscript] = useState(false);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const streamRef = useRef(null);
    const waveSurferRef = useRef(null);
    const waveformContainerRef = useRef(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [showSpeedSlider, setShowSpeedSlider] = useState(false);
    const [date, setDate] = useState("");

    //Auth check
    useEffect(() => {
        if (!doctor) {
            alert("Please login");
            navigate("/login", { replace: true });
        } else {
            setCheckedAuth(true);
        }
    }, [doctor, navigate]);

    // Fetch appointment details and transcription
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
            setDate(appointment.appointment_time || "");
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

    // Update notes
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

    // Update playback speed
    useEffect(() => {
        if (waveSurferRef.current) {
            waveSurferRef.current.setPlaybackRate(playbackSpeed);
        }
    }, [playbackSpeed]);

    // Initialize WaveSurfer
    useEffect(() => {
        if (audioURL && waveformContainerRef.current) {
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
            }
            waveSurferRef.current = WaveSurfer.create({
                container: waveformContainerRef.current,
                waveColor: "#a0a0a0",
                progressColor: "#007bff",
                barWidth: 3,
                barRadius: 10,
                barGap: 3,
                responsive: true,
                dragToSeek: true,
                cursorWidth: 3,
                height: 80,
                cursorColor: 'red',
            });
            const style = document.createElement('style');
            style.innerHTML = `
                .waveform-container .wavesurfer-cursor {
                    height: 15vh !important;
                    top: 7vh !important;
                }
            `;
            waveformContainerRef.current.classList.add('waveform-container');
            waveformContainerRef.current.appendChild(style);
            waveSurferRef.current.load(audioURL);
            waveSurferRef.current.setPlaybackRate(playbackSpeed);
        }
        return () => {
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
                waveSurferRef.current = null;
            }
        };
    }, [audioURL]);

    // Start recording audio
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
            setLoadingSummary(false);
            setLoadingTranscript(false);
        };

        setLoadingSummary(false);
        setLoadingTranscript(false);
        mediaRecorder.current.start();
        setRecording(true);
    };

    // Stop recording audio
    const stopRecording = () => {
        setLoadingSummary(true);
        setLoadingTranscript(true);
        mediaRecorder.current.stop();
        setRecording(false);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    // Handle media recorder stop event
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
            setLoadingSummary(false);
            setLoadingTranscript(false);
        };
        return () => {
            mediaRecorder.current.onstop = origOnStop;
        };
    }, [type, bullets]);


    if (!checkedAuth) return null;

    return (
    <div className="container-fluid" style={{ padding: "3vh" }}>
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
                        {appointmentTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <h1 className="mb-5">Oculist AI - Appointment #{id}</h1>
        <div className="d-flex align-items-start mb-5">
            <button className={`btn ${recording ? "btn-danger" : "btn-success"}`} onClick={recording ? stopRecording : startRecording} >
                <span className="material-icons align-middle me-1">fiber_manual_record</span>
                {recording ? "Stop Recording" : "Start Recording"}
            </button>
            {type === "special" && (
                <button className="btn btn-outline-primary ms-2" onClick={() => setShowSummaryModal(true)} >Edit Summary</button>
            )}
            {audioURL && transcript && summary && (
                <>
                    <button className="btn btn-outline-info ms-2" onClick={async () => {
                        const audioBlob = await fetch(audioURL).then(r => r.blob());
                        const arrayBuffer = await audioBlob.arrayBuffer();
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                        const samples = audioBuffer.getChannelData(0);
                        const sampleRate = audioBuffer.sampleRate;
                        const mp3encoder = new window.lamejs.Mp3Encoder(1, sampleRate, 128);
                        const chunkSize = 1152;
                        let mp3Data = [];
                        for (let i = 0; i < samples.length; i += chunkSize) {
                            const sampleChunk = samples.subarray(i, i + chunkSize);
                            const int16 = new Int16Array(sampleChunk.length);
                            for (let j = 0; j < sampleChunk.length; j++) {
                                int16[j] = Math.max(-32768, Math.min(32767, sampleChunk[j] * 32767));
                            }
                            const mp3buf = mp3encoder.encodeBuffer(int16);
                            if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
                        }
                        const mp3buf = mp3encoder.flush();
                        if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
                        const mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
                        const url = URL.createObjectURL(mp3Blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `appointment_${id}.mp3`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }}>
                        <span className="material-icons align-middle me-1">download</span> Download Audio
                    </button>
                    <button className="btn btn-outline-secondary ms-2" onClick={async () => {
                        const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
                        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                        let y = 40;
                        doc.setFontSize(24);
                        doc.text(`Oculist AI Appointment #${id}`, 40, y);
                        y += 60;
                        doc.setFontSize(12);
                        doc.text(`Doctor: ${doctorName}`, 40, y);
                        y += 25;
                        doc.text(`Patient: ${patientName}`, 40, y);
                        y += 25;
                        doc.text(`Type: ${appointmentTypeOptions.find(opt => opt.value === type)?.label || type}`, 40, y);
                        y += 25;
                        doc.text(`Date: ${date ? new Date(date).toLocaleString() : ''}`, 40, y);
                        y += 50;
                        doc.setFontSize(13);
                        doc.text('Transcript', 40, y);
                        doc.text('Summary', 300, y);
                        y += 25;
                        let transcriptText = Array.isArray(transcript)
                            ? transcript.map(seg => {
                                const seconds = seg.start;
                                const mins = Math.floor(seconds / 60);
                                const secs = Math.floor(seconds % 60);
                                const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
                                let text = seg.text;
                                if (text && text.length > 0) {
                                    text = text.charAt(0).toUpperCase() + text.slice(1);
                                }
                                return `${timestamp} ${text}`;
                            }).join('\n\n')
                            : transcript;
                        let summaryText = typeof summary === 'string' ? summary : '';
                        doc.setFontSize(11);
                        doc.text(transcriptText, 40, y, { maxWidth: 230 });
                        doc.text(summaryText, 300, y, { maxWidth: 230 });
                        doc.save(`appointment_${id}.pdf`);
                    }}>
                        <span className="material-icons align-middle me-1">picture_as_pdf</span> Download PDF
                    </button>
                </>
            )}
        </div>
        <div className="row mb-4">
            <div className="col-md-6">
            <h3>Transcript</h3>
            <div className="border p-3 overflow-auto" style={{ height: "70vh" }}>
                {loadingTranscript ? (
                    <div className="d-flex justify-content-center align-items-center w-100 h-100">
                        <div className="spinner-border text-primary" role="status" style={{ height: "5rem", width: "5rem" }}>
                            <span className="sr-only"></span>
                        </div>
                    </div>
                ) : (
                    Array.isArray(transcript) && transcript.length > 0 ? (
                        transcript.map((segment, index) => {
                            const seconds = segment.start;
                            const mins = Math.floor(seconds / 60);
                            const secs = Math.floor(seconds % 60);
                            const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
                            let text = segment.text;
                            if (text && text.length > 0) {
                                text = text.charAt(0).toUpperCase() + text.slice(1);
                            }
                            return (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', paddingBottom: '10vh' }}>
                                    <button
                                        className="btn btn-sm btn-link p-0 me-2"
                                        title={`Jump to ${timestamp}`}
                                        style={{ minWidth: 0 }}
                                        onClick={() => {
                                            const ws = waveSurferRef.current;
                                            if (ws) {
                                                const duration = ws.getDuration();
                                                ws.seekTo(Math.min(1, seconds / duration));
                                            }
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: 20, verticalAlign: 'middle' }}>skip_next</span>
                                    </button>
                                    <span>
                                        <strong>{timestamp}</strong> {text}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="d-flex align-items-center justify-content-center text-muted w-100 h-100">Waiting for recording...</div>
                    )
                )}
            </div>
            </div>
            <div className="col-md-6">
            <h3>Summary</h3>
            <div className="border p-3 overflow-auto" style={{ height: "70vh" }}>
                {loadingSummary ? (
                    <div className="d-flex justify-content-center align-items-center w-100 h-100">
                        <div className="spinner-border text-primary" role="status" style={{ height: "5rem", width: "5rem" }}>
                            <span className="sr-only"></span>
                        </div>
                    </div>
                ) : (
                    typeof summary === "string" && summary.length > 0 ? (
                        summary
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
                    ) : (
                        <div className="d-flex align-items-center justify-content-center text-muted w-100 h-100">Waiting for recording...</div>
                    )
                )}
            </div>
            </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
        {audioURL && (
            <div className="mb-4" style={{ width: "49%" }}>
                <div className="card shadow-sm p-3">
                    <div ref={waveformContainerRef} style={{ width: '100%', minHeight: 60 }}></div>
                    <div className="d-flex justify-content-center align-items-center mt-3 gap-3">
                        <button
                            className="btn btn-icon"
                            title="Back 5 seconds"
                            onClick={() => {
                                const ws = waveSurferRef.current;
                                if (ws) {
                                    const duration = ws.getDuration();
                                    const current = ws.getCurrentTime();
                                    ws.seekTo(Math.max(0, (current - 5) / duration));
                                }
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: 32 }}>replay_5</span>
                        </button>
                        <button
                            className="btn btn-icon mx-2"
                            title={waveSurferRef.current && waveSurferRef.current.isPlaying() ? "Pause" : "Play"}
                            onClick={() => {
                                if (waveSurferRef.current) waveSurferRef.current.playPause();
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: 40 }}>
                                {waveSurferRef.current && waveSurferRef.current.isPlaying() ? "pause" : "play_arrow"}
                            </span>
                        </button>
                        <button
                            className="btn btn-icon"
                            title="Forward 5 seconds"
                            onClick={() => {
                                const ws = waveSurferRef.current;
                                if (ws) {
                                    const duration = ws.getDuration();
                                    const current = ws.getCurrentTime();
                                    ws.seekTo(Math.min(1, (current + 5) / duration));
                                }
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: 32 }}>forward_5</span>
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn btn-icon"
                                title="Playback Speed"
                                onClick={() => setShowSpeedSlider(s => !s)}
                            >
                                <span className="material-icons" style={{ fontSize: 28 }}>speed</span>
                            </button>
                            {showSpeedSlider && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '80%',
                                        bottom: '-50%',
                                        background: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: 8,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        padding: 16,
                                        zIndex: 10,
                                        minWidth: 180,
                                        transition: 'bottom 0.3s',
                                    }}
                                >
                                    <label className="form-label mb-1" style={{ fontWeight: 600 }}>Playback Speed</label>
                                    <input
                                        type="range"
                                        min={0.25}
                                        max={2}
                                        step={0.05}
                                        value={playbackSpeed}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            setPlaybackSpeed(val);
                                            if (waveSurferRef.current) waveSurferRef.current.setPlaybackRate(val);
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                        <div style={{ fontWeight: 500 }}>{playbackSpeed.toFixed(2)}x</div>
                                        <button className="btn btn-sm btn-link p-0 ms-2" title="Reset speed"
                                            onClick={() => {
                                                setPlaybackSpeed(1.0);
                                                if (waveSurferRef.current) waveSurferRef.current.setPlaybackRate(1.0);
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: 22, verticalAlign: 'middle' }}>restart_alt</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="mb-5" style={{ width: "49%" }}>
        <label className="form-label fw-bold">Notes:</label>
        <textarea
            className="form-control"
            rows="7"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
        />
        </div>
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
