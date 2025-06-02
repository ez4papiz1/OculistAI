import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const appointmentTypeOptions = [
    { value: "routine", label: "Routine Eye Exam" },
    { value: "glasses", label: "Glasses Fitting" },
    { value: "contacts", label: "Contact Lens Fitting" },
    { value: "surgery", label: "Surgery Consultation" },
    { value: "postsurgery", label: "Post-surgery Consultation" },
    { value: "emergency", label: "Emergency Visit" },
    { value: "special", label: "Special Examination" },
];

function renderTypeLabel(type) {
    switch(type) {
        case 'routine': return 'Routine Eye Exam';
        case 'glasses': return 'Glasses Fitting';
        case 'contacts': return 'Contact Lens Fitting';
        case 'surgery': return 'Surgery Consultation';
        case 'postsurgery': return 'Post-surgery Consultation';
        case 'emergency': return 'Emergency Visit';
        case 'special': return 'Special Examination';
        default: return type;
    }
}

export default function Home() {
const location = useLocation();
const navigate = useNavigate();
const [doctor, setDoctor] = useState(location.state?.id ? location.state : null);
const [checkedAuth, setCheckedAuth] = useState(false);
const [appointments, setAppointments] = useState([]);
const [showAppModal, setShowAppModal] = useState(false);
const [showPatientModal, setShowPatientModal] = useState(false);
const [showDoctorModal, setShowDoctorModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);
const [showChangeNameModal, setShowChangeNameModal] = useState(false);
const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
const [doctors, setDoctors] = useState([]);
const [patients, setPatients] = useState([]);
const [form, setForm] = useState({
    doctor_id: "",
    patient_id: "",
    type: "routine",
    appointment_time: "",
    notes: ""
});
const [newPatient, setNewPatient] = useState({
firstname: "",
lastname: "",
birth_date: "",
notes: ""
});
const [newDoctor, setNewDoctor] = useState({
    firstname: "",
    lastname: "",
    email: ""
});
const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
const [nameFields, setNameFields] = useState({ firstname: '', lastname: '' });
const [emailField, setEmailField] = useState('');
const [passwordFields, setPasswordFields] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
const [showCalendarModal, setShowCalendarModal] = useState(false);
const [showEditAppModal, setShowEditAppModal] = useState(false);
const [editAppData, setEditAppData] = useState(null);
const [doctorError, setDoctorError] = useState("");
const [patientError, setPatientError] = useState("");
const [removeModal, setRemoveModal] = useState({ show: false, apptId: null, anchorRect: null });
const [showDoctorsModal, setShowDoctorsModal] = useState(false);
const [showPatientsModal, setShowPatientsModal] = useState(false);
const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
const [showEditPatientModal, setShowEditPatientModal] = useState(false);
const [editDoctorForm, setEditDoctorForm] = useState({ doctor_id: '', firstname: '', lastname: '', email: '' });
const [editPatientForm, setEditPatientForm] = useState({ patient_id: '', firstname: '', lastname: '', birth_date: '', notes: '' });
const [editDoctorError, setEditDoctorError] = useState('');
const [editPatientError, setEditPatientError] = useState('');

useEffect(() => {
    const fetchAppointments = async () => {
        const res = await fetch("http://localhost:8000/appointment");
        const data = await res.json();
        setAppointments(data);
    };
    const fetchDoctors = async () => {
        const res = await fetch("http://localhost:8000/doctors");
        const data = await res.json();
        setDoctors(data);
    };
    const fetchPatients = async () => {
        const res = await fetch("http://localhost:8000/patients");
        const data = await res.json();
        setPatients(data);
    };

    fetchAppointments();
    fetchDoctors();
    fetchPatients();
}, []);

useEffect(() => {
    if (!doctor) {
        alert("Please login");
        navigate("/login", { replace: true });
    } else {
        setCheckedAuth(true);
    }
}, [doctor, navigate]);

const sortedAppointments = React.useMemo(() => {
    let sortable = [...appointments];
    if (sortConfig.key) {
        if (
            sortConfig.key === 'doctor_name' ||
            sortConfig.key === 'patient_name' ||
            sortConfig.key === 'status' ||
            sortConfig.key === 'type'
        ) {
            sortable.sort((a, b) => {
                const aVal = (a[sortConfig.key] || '').toLowerCase();
                const bVal = (b[sortConfig.key] || '').toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            sortable.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (sortConfig.key === 'appointment_time') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }
    return sortable;
}, [appointments, sortConfig]);

const handleSort = (key) => {
    setSortConfig((prev) => {
        if (prev.key === key) {
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: 'asc' };
    });
};

const handleAppSubmit = async (e) => {
e.preventDefault();

if (!form.doctor_id || !form.patient_id || !form.appointment_time || !form.type) {
    alert("Fill out all required fields.");
    return;
}

const formData = new FormData();
formData.append("doctor_id", form.doctor_id);
formData.append("patient_id", form.patient_id);
formData.append("appointment_time", form.appointment_time);
formData.append("type", form.type);
formData.append("notes", form.notes);

const res = await fetch("http://localhost:8000/appointment", {
    method: "POST",
    body: formData
});

if (res.ok) {
    setShowAppModal(false);
    setForm({
    doctor_id: "",
    patient_id: "",
    type: "routine",
    appointment_time: "",
    notes: ""
    });

    const updated = await fetch("http://localhost:8000/appointment");
    setAppointments(await updated.json());
} else {
    alert("Failed to create appointment");
}
};

const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setPatientError("");
    if (!newPatient.firstname || !newPatient.lastname || !newPatient.birth_date) {
        setPatientError("Fill out all required fields.");
        return;
    }
    const today = new Date();
    const birthDate = new Date(newPatient.birth_date);
    if (birthDate > today) {
        setPatientError("Please select correct date of birth.");
        return;
    }

    const formData = new FormData();
    formData.append("firstname", newPatient.firstname);
    formData.append("lastname", newPatient.lastname);
    formData.append("birth_date", newPatient.birth_date);
    formData.append("notes", newPatient.notes);

    const res = await fetch("http://localhost:8000/patients", {
        method: "POST",
        body: formData
    });

    if (res.ok) {
        setShowPatientModal(false);
        setNewPatient({ firstname: "", lastname: "", birth_date: "", notes: "" });
        setPatientError("");
        const updated = await fetch("http://localhost:8000/patients");
        setPatients(await updated.json());
    } else {
        setPatientError("Failed to create patient.");
    }
};

const openChangeNameModal = () => {
    if (doctor) setNameFields({ firstname: doctor.firstname, lastname: doctor.lastname });
    setShowChangeNameModal(true);
    setShowSettingsModal(false);
};
const openChangeEmailModal = () => {
    if (doctor) setEmailField(doctor.email);
    setShowChangeEmailModal(true);
    setShowSettingsModal(false);
};

useEffect(() => {
    function handleEsc(e) {
        if (e.key === 'Escape') {
            if (showAppModal) setShowAppModal(false);
            if (showPatientModal) setShowPatientModal(false);
            if (showDoctorModal) setShowDoctorModal(false);
            if (showSettingsModal) setShowSettingsModal(false);
            if (showChangeNameModal) setShowChangeNameModal(false);
            if (showChangeEmailModal) setShowChangeEmailModal(false);
            if (showChangePasswordModal) setShowChangePasswordModal(false);
            if (showCalendarModal) setShowCalendarModal(false);
            if (showEditAppModal) { setShowEditAppModal(false); setEditAppData(null); }
        }
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
}, [showAppModal, showPatientModal, showDoctorModal, showSettingsModal, showChangeNameModal, showChangeEmailModal, showChangePasswordModal, showCalendarModal, showEditAppModal]);

if (!checkedAuth) return null;

return (
    <div className="container-fluid py-4">
        <h1 className="mb-4">Oculist AI - Appointments</h1>

        <div className="d-flex row mb-4 g-2 justify-content-between align-items-center">
            <div className="d-flex gap-2" style={{ maxWidth: '600px' }}>
                <button className="btn btn-primary w-75" onClick={() => setShowAppModal(true)}>
                    Add Appointment
                </button>
                <button className="btn btn-secondary w-75" onClick={() => setShowPatientsModal(true)}>
                    Patients
                </button>
                <button className="btn btn-info w-75" onClick={() => setShowDoctorsModal(true)}>
                    Doctors
                </button>
                <button className="btn btn-outline-dark w-25 d-flex align-items-center justify-content-center" onClick={() => setShowCalendarModal(true)}>
                    <span className="material-icons" style={{ verticalAlign: 'middle', fontSize: '1.5rem' }}>calendar_month</span>
                </button>
            </div>
            <div className="d-flex justify-content-end" style={{ width: "10%" }}>
                <button className="btn btn-outline-dark d-flex justify-content-center align-items-center" onClick={() => setShowSettingsModal(true)} style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }} aria-label="Settings">
                    <span className="material-icons" style={{ verticalAlign: 'middle' }}>settings</span>
                </button>
            </div>
        </div>

        <div className="w-100">
            <table className="table table-bordered table-striped w-100">
            <thead>
                <tr>
                <th style={{ width: '170px' }}>
                    Appointment #
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('id')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th>
                    Date
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('appointment_time')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th>
                    Status
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('status')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th>
                    Type
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('type')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th>
                    Doctor
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('doctor_name')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th>
                    Patient
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('patient_name')}>
                        <span className="material-icons" style={{ verticalAlign: 'middle' }}>unfold_more</span>
                    </button>
                </th>
                <th style={{ width: '200px' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {sortedAppointments.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="p-0 border-0">
                            <div className="d-flex align-items-center justify-content-center text-muted w-100 h-100" style={{ minHeight: 450 }}>
                                No appointments available
                            </div>
                        </td>
                    </tr>
                ) : (
                    sortedAppointments.map((appt) => (
                    <tr key={appt.id}>
                        <td>{appt.id}</td>
                        <td>{new Date(appt.appointment_time).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                        })}</td>
                        <td>{{ scheduled: "Scheduled", completed: "Completed", canceled: "Canceled" }[appt.status]}</td>
                        <td>{renderTypeLabel(appt.type)}</td>
                        <td>{appt.doctor_name}</td>
                        <td>{appt.patient_name}</td>
                        <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => navigate(`/appointment/${appt.id}`, {state: { doctor } })}>Open</button>
                        <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => {

                            let doctorId = appt.doctor_id;
                            let patientId = appt.patient_id;
                            if (!doctorId && appt.doctor_name) {
                                const foundDoc = doctors.find(doc => `${doc.firstname} ${doc.lastname}` === appt.doctor_name);
                                if (foundDoc) doctorId = foundDoc.id;
                            }
                            if (!patientId && appt.patient_name) {
                                const foundPat = patients.find(pat => `${pat.firstname} ${pat.lastname}` === appt.patient_name);
                                if (foundPat) patientId = foundPat.id;
                            }
                            setEditAppData({
                                ...appt,
                                doctor_id: doctorId || "",
                                patient_id: patientId || ""
                            });
                            setShowEditAppModal(true);
                        }}>Edit</button>
                        <button className="btn btn-outline-danger btn-sm" ref={el => appt._removeBtn = el} onClick={e => {
                            const rect = e.target.getBoundingClientRect();
                            setRemoveModal({ show: true, apptId: appt.id, anchorRect: rect });
                        }}>Remove</button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>

        {showAppModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Add Appointment</h2>
                <form onSubmit={handleAppSubmit}>
                <div className="mb-3">
                    <label className="form-label">Doctor</label>
                    <select className="form-select" required value={form.doctor_id}
                    onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.firstname} {doc.lastname}</option>
                    ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Patient</label>
                    <select className="form-select" required value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                    <option value="">-- Select Patient --</option>
                    {patients.map((pat) => (
                        <option key={pat.id} value={pat.id}>{pat.firstname} {pat.lastname}</option>
                    ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Visit Type</label>
                    <select className="form-select" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {appointmentTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Date & Time</label>
                    <input className="form-control" type="datetime-local" required
                    value={form.appointment_time}
                    onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-success" type="submit">Create</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowAppModal(false)}>Cancel</button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}

        {showPatientModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Add Patient</h2>
                <form onSubmit={handlePatientSubmit}>
                <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input className="form-control" required type="text"
                    value={newPatient.firstname}
                    onChange={(e) => setNewPatient({ ...newPatient, firstname: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" required type="text"
                    value={newPatient.lastname}
                    onChange={(e) => setNewPatient({ ...newPatient, lastname: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Birth Date</label>
                    <input className="form-control" required type="date"
                    value={newPatient.birth_date}
                    onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control"
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} />
                </div>
                {patientError && <div className="alert alert-danger py-1">{patientError}</div>}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-success" type="submit">Create</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowPatientModal(false)}>Cancel</button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}

        {showDoctorModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Add Doctor</h2>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setDoctorError("");
                    if (!newDoctor.firstname || !newDoctor.lastname || !newDoctor.email || !newDoctor.password) {
                        alert("Fill out all required fields.");
                        return;
                    }
                    const formData = new FormData();
                    formData.append("firstname", newDoctor.firstname);
                    formData.append("lastname", newDoctor.lastname);
                    formData.append("email", newDoctor.email);
                    formData.append("password", newDoctor.password);
                    const res = await fetch("http://localhost:8000/doctors", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        setShowDoctorModal(false);
                        setNewDoctor({ firstname: "", lastname: "", email: "" });
                        const updated = await fetch("http://localhost:8000/doctors");
                        setDoctors(await updated.json());
                    } else {
                        const err = await res.json();
                        if (err.detail === "exists") {
                            setDoctorError("Doctor with this email already exists.");
                        } else {
                            alert("Failed to create doctor.");
                        }
                    }
                }}>
                <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input className="form-control" required type="text"
                        value={newDoctor.firstname}
                        onChange={(e) => setNewDoctor({ ...newDoctor, firstname: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" required type="text"
                        value={newDoctor.lastname}
                        onChange={(e) => setNewDoctor({ ...newDoctor, lastname: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input className="form-control" required type="email"
                        value={newDoctor.email}
                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input className="form-control" required type="password"
                        value={newDoctor.password}
                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })} />
                </div>
                {doctorError && <div className="alert alert-danger py-1">{doctorError}</div>}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-success" type="submit">Create</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowDoctorModal(false)}>Cancel</button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}

        {showSettingsModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Settings</h2>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-outline-primary" onClick={openChangeNameModal}>Change Name</button>
                    <button className="btn btn-outline-primary" onClick={openChangeEmailModal}>Change Email</button>
                    <button className="btn btn-outline-primary" onClick={() => { setShowChangePasswordModal(true); setShowSettingsModal(false); }}>Change Password</button>
                    <button className="btn btn-danger mt-2" onClick={() => {navigate("/login", { replace: true }); }}>Logout</button>
                    <button className="btn btn-danger mt-2" onClick={() => setShowSettingsModal(false)}>Close</button>
                </div>
            </div>
        </div>
    </div>
)}

{showChangeNameModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Change Name</h2>
                <form onSubmit={async e => {
                    e.preventDefault();
                    if (!doctor) return alert("No doctor info");
                    const formData = new FormData();
                    formData.append("doctor_id", doctor.id);
                    formData.append("firstname", nameFields.firstname);
                    formData.append("lastname", nameFields.lastname);
                    const res = await fetch("http://localhost:8000/update-doctor-name", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        alert("Name updated successfully");
                        setDoctor({ ...doctor, firstname: nameFields.firstname, lastname: nameFields.lastname });
                        setShowChangeNameModal(false);
                        setShowSettingsModal(true);
                    } else {
                        alert("Failed to update name");
                    }
                }}>
                    <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input className="form-control" required type="text" value={nameFields.firstname} onChange={e => setNameFields({ ...nameFields, firstname: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input className="form-control" required type="text" value={nameFields.lastname} onChange={e => setNameFields({ ...nameFields, lastname: e.target.value })} />
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-success" type="submit">Save</button>
                        <button className="btn btn-secondary" type="button" onClick={() => { setShowChangeNameModal(false); setShowSettingsModal(true); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}

{showChangeEmailModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Change Email</h2>
                <form onSubmit={async e => {
                    e.preventDefault();
                    if (!doctor) return alert("No doctor info");
                    const formData = new FormData();
                    formData.append("doctor_id", doctor.id);
                    formData.append("email", emailField);
                    const res = await fetch("http://localhost:8000/update-doctor-email", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        alert("Email updated successfully");
                        setDoctor({ ...doctor, email: emailField });
                        setShowChangeEmailModal(false);
                        setShowSettingsModal(true);
                    } else if (err.detail === "exists") {
                        setDoctorError("Doctor with this email already exists.");
                    } else {
                        alert("Failed to update doctor.");
                    }
                }}>
                    <div className="mb-3">
                        <label className="form-label">New Email</label>
                        <input className="form-control" required type="email" value={emailField} onChange={e => setEmailField(e.target.value)} />
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-success" type="submit">Save</button>
                        <button className="btn btn-secondary" type="button" onClick={() => { setShowChangeEmailModal(false); setShowSettingsModal(true); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}

{showChangePasswordModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Change Password</h2>
                <form onSubmit={async e => {
                    e.preventDefault();
                    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
                        alert("New passwords do not match");
                        return;
                    }
                    if (!doctor) return alert("No doctor info");
                    const formData = new FormData();
                    formData.append("doctor_id", doctor.id);
                    formData.append("old_password", passwordFields.oldPassword);
                    formData.append("new_password", passwordFields.newPassword);
                    const res = await fetch("http://localhost:8000/update-doctor-password", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        alert("Password updated successfully");
                        setShowChangePasswordModal(false);
                        setShowSettingsModal(true);
                    } else {
                        const err = await res.json();
                        alert(err.detail || "Failed to update password");
                    }
                }}>
                    <div className="mb-3">
                        <label className="form-label">Old Password</label>
                        <input className="form-control" required type="password" onChange={e => setPasswordFields({ ...passwordFields, oldPassword: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input className="form-control" required type="password" onChange={e => setPasswordFields({ ...passwordFields, newPassword: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Confirm New Password</label>
                        <input className="form-control" required type="password" onChange={e => setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })} />
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-success" type="submit">Save</button>
                        <button className="btn btn-secondary" type="button" onClick={() => { setShowChangePasswordModal(false); setShowSettingsModal(true); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}

{showCalendarModal && (
    <CalendarModal
        appointments={appointments}
        doctor={doctor}
        onClose={() => setShowCalendarModal(false)}
        navigate={navigate}
    />
)}

{showEditAppModal && editAppData && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content p-4">
            <h2 className="mb-3">Edit Appointment</h2>
            <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editAppData.doctor_id || !editAppData.patient_id || !editAppData.appointment_time || !editAppData.type) {
                    alert("Fill out all required fields.");
                    return;
                }
                const formData = new FormData();
                formData.append("appointment_id", editAppData.id);
                formData.append("doctor_id", editAppData.doctor_id);
                formData.append("patient_id", editAppData.patient_id);
                formData.append("appointment_time", editAppData.appointment_time);
                formData.append("type", editAppData.type);
                formData.append("notes", editAppData.notes || "");
                const res = await fetch("http://localhost:8000/update-appointment", {
                    method: "POST",
                    body: formData
                });
                if (res.ok) {
                    setShowEditAppModal(false);
                    setEditAppData(null);
                    const updated = await fetch("http://localhost:8000/appointment");
                    setAppointments(await updated.json());
                } else {
                    alert("Failed to update appointment");
                }
            }}>
            <div className="mb-3">
                <label className="form-label">Doctor</label>
                <select className="form-select" required value={editAppData.doctor_id}
                    onChange={e => setEditAppData({ ...editAppData, doctor_id: e.target.value })}>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.firstname} {doc.lastname}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Patient</label>
                <select className="form-select" required value={editAppData.patient_id}
                    onChange={e => setEditAppData({ ...editAppData, patient_id: e.target.value })}>
                    <option value="">-- Select Patient --</option>
                    {patients.map((pat) => (
                        <option key={pat.id} value={pat.id}>{pat.firstname} {pat.lastname}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Visit Type</label>
                <select className="form-select" value={editAppData.type}
                    onChange={e => setEditAppData({ ...editAppData, type: e.target.value })}>
                    {appointmentTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Date & Time</label>
                <input className="form-control" type="datetime-local" required
                    value={editAppData.appointment_time}
                    onChange={e => setEditAppData({ ...editAppData, appointment_time: e.target.value })} />
            </div>
            <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea className="form-control"
                    value={editAppData.notes || ""}
                    onChange={e => setEditAppData({ ...editAppData, notes: e.target.value })} />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-success" type="submit">Save</button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowEditAppModal(false); setEditAppData(null); }}>Cancel</button>
            </div>
            </form>
        </div>
        </div>
    </div>
)}

{removeModal.show && (
    <div className="justify-content-end" style={{
        position: 'fixed',
        top: removeModal.anchorRect ? removeModal.anchorRect.bottom + window.scrollY + 4 : '50%',
        right: removeModal.anchorRect
                ? Math.max(window.innerWidth - removeModal.anchorRect.right, 20)
                : 20,
        zIndex: 2000,
        minWidth: 100,
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: 8,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 220,
    }}
    onClick={e => e.stopPropagation()}
    >
        <div className="mb-2">Are you sure?</div>
        <div className="d-flex justify-content-center gap-2">
            <button className="btn btn-danger btn-sm" onClick={async () => {
                const formData = new FormData();
                formData.append("appointment_id", removeModal.apptId);
                const res = await fetch("http://localhost:8000/delete-appointment", {
                    method: "POST",
                    body: formData
                });
                if (res.ok) {
                    const updated = await fetch("http://localhost:8000/appointment");
                    setAppointments(await updated.json());
                }
                setRemoveModal({ show: false, apptId: null, anchorRect: null });
            }}>Yes</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setRemoveModal({ show: false, apptId: null, anchorRect: null })}>No</button>
        </div>
    </div>
)}
{removeModal.show && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1999,
        background: 'transparent',
    }}
    onClick={() => setRemoveModal({ show: false, apptId: null, anchorRect: null })}
    />
)}

{showDoctorsModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Doctors</h2>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-outline-primary" onClick={() => { setShowDoctorModal(true); setShowDoctorsModal(false); }}>Add Doctor</button>
                    <button className="btn btn-outline-secondary" onClick={() => { setShowEditDoctorModal(true); setShowDoctorsModal(false); }}>Edit Doctor</button>
                    <button className="btn btn-danger mt-2" onClick={() => setShowDoctorsModal(false)}>Close</button>
                </div>
            </div>
        </div>
    </div>
)}

{showEditDoctorModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Edit Doctor</h2>
                <form onSubmit={async e => {
                    e.preventDefault();
                    setEditDoctorError("");
                    if (!editDoctorForm.doctor_id || !editDoctorForm.firstname || !editDoctorForm.lastname || !editDoctorForm.email) {
                        setEditDoctorError("Fill out all required fields.");
                        return;
                    }
                    const formData = new FormData();
                    formData.append("doctor_id", editDoctorForm.doctor_id);
                    formData.append("firstname", editDoctorForm.firstname);
                    formData.append("lastname", editDoctorForm.lastname);
                    formData.append("email", editDoctorForm.email);
                    const res = await fetch("http://localhost:8000/edit-doctor", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        setShowEditDoctorModal(false);
                        const updated = await fetch("http://localhost:8000/doctors");
                        setDoctors(await updated.json());
                    } else {
                        setEditDoctorError("Failed to update doctor.");
                    }
                }}>
                    <div className="mb-3">
                        <label className="form-label">Select Doctor</label>
                        <select className="form-select" required value={editDoctorForm.doctor_id} onChange={e => {
                            const doc = doctors.find(d => String(d.id) === e.target.value);
                            setEditDoctorForm({
                                doctor_id: e.target.value,
                                firstname: doc ? doc.firstname : '',
                                lastname: doc ? doc.lastname : '',
                                email: doc ? doc.email : ''
                            });
                        }}>
                            <option value="">-- Select Doctor --</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.firstname} {doc.lastname}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input className="form-control" required type="text" value={editDoctorForm.firstname} onChange={e => setEditDoctorForm({ ...editDoctorForm, firstname: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input className="form-control" required type="text" value={editDoctorForm.lastname} onChange={e => setEditDoctorForm({ ...editDoctorForm, lastname: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input className="form-control" required type="email" value={editDoctorForm.email} onChange={e => setEditDoctorForm({ ...editDoctorForm, email: e.target.value })} />
                    </div>
                    {editDoctorError && <div className="alert alert-danger py-1">{editDoctorError}</div>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-success" type="submit">Save</button>
                        <button className="btn btn-secondary" type="button" onClick={() => setShowEditDoctorModal(false)}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}

{showPatientsModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Patients</h2>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-outline-primary" onClick={() => { setShowPatientModal(true); setShowPatientsModal(false); }}>Add Patient</button>
                    <button className="btn btn-outline-secondary" onClick={() => { setShowEditPatientModal(true); setShowPatientsModal(false); }}>Edit Patient</button>
                    <button className="btn btn-danger mt-2" onClick={() => setShowPatientsModal(false)}>Close</button>
                </div>
            </div>
        </div>
    </div>
)}

{showEditPatientModal && (
    <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-4">
                <h2 className="mb-3">Edit Patient</h2>
                <form onSubmit={async e => {
                    e.preventDefault();
                    setEditPatientError("");
                    if (!editPatientForm.patient_id || !editPatientForm.firstname || !editPatientForm.lastname || !editPatientForm.birth_date) {
                        setEditPatientError("Fill out all required fields.");
                        return;
                    }
                    const today = new Date();
                    const birthDate = new Date(editPatientForm.birth_date);
                    if (birthDate > today) {
                        setPatientError("Please select correct date of birth.");
                        return;
                    }
                    const formData = new FormData();
                    formData.append("patient_id", editPatientForm.patient_id);
                    formData.append("firstname", editPatientForm.firstname);
                    formData.append("lastname", editPatientForm.lastname);
                    formData.append("birth_date", editPatientForm.birth_date);
                    formData.append("notes", editPatientForm.notes);
                    const res = await fetch("http://localhost:8000/edit-patient", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        setShowEditPatientModal(false);
                        const updated = await fetch("http://localhost:8000/patients");
                        setPatients(await updated.json());
                    } else {
                        setEditPatientError("Failed to update patient.");
                    }
                }}>
                    <div className="mb-3">
                        <label className="form-label">Select Patient</label>
                        <select className="form-select" required value={editPatientForm.patient_id} onChange={e => {
                            const pat = patients.find(p => String(p.id) === e.target.value);
                            setEditPatientForm({
                                patient_id: e.target.value,
                                firstname: pat ? pat.firstname : '',
                                lastname: pat ? pat.lastname : '',
                                birth_date: pat ? pat.birth_date : '',
                                notes: pat ? pat.notes : ''
                            });
                        }}>
                            <option value="">-- Select Patient --</option>
                            {patients.map(pat => (
                                <option key={pat.id} value={pat.id}>{pat.firstname} {pat.lastname}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input className="form-control" required type="text" value={editPatientForm.firstname} onChange={e => setEditPatientForm({ ...editPatientForm, firstname: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input className="form-control" required type="text" value={editPatientForm.lastname} onChange={e => setEditPatientForm({ ...editPatientForm, lastname: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Birth Date</label>
                        <input className="form-control" required type="date" value={editPatientForm.birth_date} onChange={e => setEditPatientForm({ ...editPatientForm, birth_date: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Notes</label>
                        <textarea className="form-control" value={editPatientForm.notes} onChange={e => setEditPatientForm({ ...editPatientForm, notes: e.target.value })} />
                    </div>
                    {editPatientError && <div className="alert alert-danger py-1">{editPatientError}</div>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <button className="btn btn-success" type="submit">Save</button>
                        <button className="btn btn-secondary" type="button" onClick={() => setShowEditPatientModal(false)}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}
    </div>
);
}

function CalendarModal({ appointments, doctor, onClose, navigate }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(() => {
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    });
    const [doctorFilter, setDoctorFilter] = useState('');
    const [patientFilter, setPatientFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const monthAppointments = appointments.filter(appt => {
        const apptDate = new Date(appt.appointment_time);
        return (
            apptDate.getFullYear() === currentMonth.getFullYear() &&
            apptDate.getMonth() === currentMonth.getMonth()
        );
    });

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const weeks = [];
    let day = 1 - firstDayOfWeek;
    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++, day++) {
            if (day < 1 || day > daysInMonth) {
                week.push(null);
            } else {
                week.push(new Date(year, month, day));
            }
        }
        weeks.push(week);
        if (day > daysInMonth) break;
    }

    function getDayAppointments(date) {
        return monthAppointments.filter(appt => {
            const apptDate = new Date(appt.appointment_time);
            return (
                apptDate.getFullYear() === date.getFullYear() &&
                apptDate.getMonth() === date.getMonth() &&
                apptDate.getDate() === date.getDate()
            );
        });
    }

    const dayAppointments = getDayAppointments(selectedDate);
    const uniqueDoctors = Array.from(new Set(dayAppointments.map(a => a.doctor_name)));
    const uniquePatients = Array.from(new Set(dayAppointments.map(a => a.patient_name)));
    const uniqueTypes = Array.from(new Set(dayAppointments.map(a => a.type)));

    const filteredAppointments = dayAppointments.filter(appt => {
        return (
            (!doctorFilter || appt.doctor_name === doctorFilter) &&
            (!patientFilter || appt.patient_name === patientFilter) &&
            (!typeFilter || appt.type === typeFilter)
        );
    }).sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

    function cardColor(status) {
        if (status === 'completed') return 'bg-success text-white';
        if (status === 'canceled') return 'bg-danger text-white';
        return 'bg-secondary text-white';
    }

    function typeLabel(type) {
        return {
            routine: 'Routine Eye Exam',
            glasses: 'Glasses Fitting',
            contacts: 'Contact Lens Fitting',
            surgery: 'Surgery Consultation',
            postsurgery: 'Post-Operative Consultation',
            special: 'Special Examination',
        }[type] || type;
    }

    function statusLabel(status) {
        return {
            scheduled: 'Scheduled',
            completed: 'Completed',
            canceled: 'Canceled',
        }[status] || status;
    }

    const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const isSameDay = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const selectedDayAppointments = getDayAppointments(selectedDate).sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

    return (
        <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                <div className="modal-content p-0" style={{ minHeight: 600 }}>
                    <div className="row g-0">
                        <div className="col-md-4 border-end bg-light p-4 d-flex flex-column" style={{ minHeight: 600 }}>
                            <div className="d-flex align-items-center mb-3 gap-2">
                                <span className="material-icons text-primary" style={{ fontSize: '2rem' }}>event</span>
                                <h4 className="mb-0">{selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : ''}</h4>
                            </div>
                            <div className="mb-3">
                                <select className="form-select mb-2" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
                                    <option value="">All Doctors</option>
                                    {uniqueDoctors.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <select className="form-select mb-2" value={patientFilter} onChange={e => setPatientFilter(e.target.value)}>
                                    <option value="">All Patients</option>
                                    {uniquePatients.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                    <option value="">All Types</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{typeLabel(type)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '50vh' }}>
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-muted mt-4">No appointments</div>
                                ) : (
                                    filteredAppointments.map(appt => (
                                        <div key={appt.id} className={`card p-2 mb-3 shadow-sm ${cardColor(appt.status)}`}>
                                            <div className="fw-bold">Appointment #{appt.id}</div>
                                            <div>Patient: {appt.patient_name}</div>
                                            <div>Doctor: {appt.doctor_name}</div>
                                            <div>Type: {typeLabel(appt.type)}</div>
                                            <div>Date: {new Date(appt.appointment_time).toLocaleString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</div>
                                            <div className="d-flex justify-content-between align-items-center mt-1">
                                                <span></span>
                                                <button
                                                    className="btn btn-light btn-sm ms-2"
                                                    onClick={() => { onClose(); navigate(`/appointment/${appt.id}`, { state: { doctor } }); }}
                                                >
                                                    Open
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="col-md-8 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button className="btn btn-outline-dark" onClick={() => {
                                    const prev = new Date(year, month - 1, 1);
                                    setCurrentMonth(prev);
                                    if (!isSameDay(selectedDate, prev) && (selectedDate.getMonth() !== prev.getMonth() || selectedDate.getFullYear() !== prev.getFullYear())) {
                                        setSelectedDate(new Date(prev.getFullYear(), prev.getMonth(), 1));
                                    }
                                }}>
                                    <span className="material-icons">chevron_left</span>
                                </button>
                                <h2 className="mb-0">{monthLabel}</h2>
                                <button className="btn btn-outline-dark" onClick={() => {
                                    const next = new Date(year, month + 1, 1);
                                    setCurrentMonth(next);
                                    if (!isSameDay(selectedDate, next) && (selectedDate.getMonth() !== next.getMonth() || selectedDate.getFullYear() !== next.getFullYear())) {
                                        setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
                                    }
                                }}>
                                    <span className="material-icons">chevron_right</span>
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-bordered calendar-table mb-0">
                                    <thead>
                                        <tr className="text-center">
                                            <th>Sun</th>
                                            <th>Mon</th>
                                            <th>Tue</th>
                                            <th>Wed</th>
                                            <th>Thu</th>
                                            <th>Fri</th>
                                            <th>Sat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeks.map((week, wi) => (
                                            <tr key={wi}>
                                                {week.map((date, di) => {
                                                    const isToday = date && isSameDay(date, today);
                                                    const isSelected = date && isSameDay(date, selectedDate);
                                                    const hasAppts = date && getDayAppointments(date).length > 0;
                                                    return (
                                                        <td key={di} style={{ verticalAlign: 'top', minWidth: 60, height: 60, background: date ? '#f8f9fa' : '#e9ecef', padding: 0 }}>
                                                            {date && (
                                                                <button
                                                                    className={`btn w-100 h-100 d-flex flex-column align-items-center justify-content-center ${isSelected ? 'btn-primary text-white' : isToday ? 'btn-outline-primary' : 'btn-light'} ${hasAppts ? 'fw-bold' : ''}`}
                                                                    style={{ borderRadius: 0, border: 'none', minHeight: 60, minWidth: 60, fontWeight: isSelected ? 700 : 400, boxShadow: isSelected ? '0 0 0 2px #0d6efd' : undefined }}
                                                                    onClick={() => setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))}
                                                                >
                                                                    <span style={{ fontSize: '1.2rem' }}>{date.getDate()}</span>
                                                                    {hasAppts && <span className="material-icons text-warning" style={{ fontSize: '1.1rem' }}>event</span>}
                                                                </button>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between mt-3">
                                <button className="btn btn-outline-secondary" onClick={() => {
                                    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                                }}>
                                    <span className="material-icons align-middle me-1">today</span>Today
                                </button>
                                <button className="btn btn-danger" onClick={onClose}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}