import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
const [nameFields, setNameFields] = useState({ firstname: '', lastname: '' });
const [emailField, setEmailField] = useState('');
const [passwordFields, setPasswordFields] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

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
    return sortable;
}, [appointments, sortConfig]);

const handleSort = (key) => {
    setSortConfig((prev) => {
        if (prev.key === key) {
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: 'desc' };
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

if (!newPatient.firstname || !newPatient.lastname || !newPatient.birth_date) {
    alert("Fill out all required fields.");
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

    const updated = await fetch("http://localhost:8000/patients");
    setPatients(await updated.json());
} else {
    alert("Failed to create patient.");
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

if (!checkedAuth) return null;

return (
    <div className="container-fluid py-4">
        <h1 className="mb-4">Oculist AI - Appointments</h1>

        <div className="d-flex row mb-4 g-2 justify-content-between align-items-center">
            <div className="d-flex gap-2" style={{ maxWidth: '600px' }}>
                <button className="btn btn-primary w-50" onClick={() => setShowAppModal(true)}>
                    Add Appointment
                </button>
                <button className="btn btn-secondary w-50" onClick={() => setShowPatientModal(true)}>
                    Add Patient
                </button>
                <button className="btn btn-info w-50" onClick={() => setShowDoctorModal(true)}>
                    Add Doctor
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
                <th>
                    Appointment #
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('id')}>⇅</button>
                </th>
                <th>
                    Date
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('appointment_time')}>⇅</button>
                </th>
                <th>
                    Status
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('status')}>⇅</button>
                </th>
                <th>
                    Type
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('type')}>⇅</button>
                </th>
                <th>
                    Doctor
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('doctor_name')}>⇅</button>
                </th>
                <th>
                    Patient
                    <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => handleSort('patient_name')}>⇅</button>
                </th>
                <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {sortedAppointments.map((appt) => (
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
                    <td>{{ routine: "Routine Eye Exam", contacts: "Contact Lens Fitting", postsurgery: "Post-Operative Check", special: "Special" }[appt.type]}</td>
                    <td>{appt.doctor_name}</td>
                    <td>{appt.patient_name}</td>
                    <td>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/appointment/${appt.id}`, {state: { doctor } })}>Open</button>
                    </td>
                </tr>
                ))}
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
                    <option value="routine">Routine Eye Exam</option>
                    <option value="contacts">Contact Lens Fitting</option>
                    <option value="postsurgery">Post-Operative Check</option>
                    <option value="special">Special</option>
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
                        alert("Failed to create doctor.");
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
                    <button className="btn btn-secondary mt-2" onClick={() => setShowSettingsModal(false)}>Close</button>
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
                    } else {
                        alert("Failed to update email");
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
    </div>
);
}