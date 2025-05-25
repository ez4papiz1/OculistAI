import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
const [appointments, setAppointments] = useState([]);
const [showAppModal, setShowAppModal] = useState(false);
const [showPatientModal, setShowPatientModal] = useState(false);
const [showDoctorModal, setShowDoctorModal] = useState(false);
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

const navigate = useNavigate();

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

return (
    <div className="container-fluid py-4">
        <h1 className="mb-4">Oculist AI - Appointments</h1>

        <div className="row mb-4 g-2">
            <div className="col-12 col-sm-6 col-md-3 col-lg-2" style={{ width: "10%" }}>
            <button className="btn btn-primary w-100" onClick={() => setShowAppModal(true)}>
                Add Appointment
            </button>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2" style={{ width: "10%" }}>
            <button className="btn btn-secondary w-100" onClick={() => setShowPatientModal(true)}>
                Add Patient
            </button>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2" style={{ width: "10%" }}>
            <button className="btn btn-info w-100" onClick={() => setShowDoctorModal(true)}>
                Add Doctor
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
                    <td>{{ routine: "Routine Eye Exam", contacts: "Contact Lens Fitting", postsurgery: "Post-Operative Check" }[appt.type]}</td>
                    <td>{appt.doctor_name}</td>
                    <td>{appt.patient_name}</td>
                    <td>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/appointment/${appt.id}`)}>Open</button>
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
                    if (!newDoctor.firstname || !newDoctor.lastname || !newDoctor.email) {
                        alert("Fill out all required fields.");
                        return;
                    }
                    const formData = new FormData();
                    formData.append("firstname", newDoctor.firstname);
                    formData.append("lastname", newDoctor.lastname);
                    formData.append("email", newDoctor.email);
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
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-success" type="submit">Create</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowDoctorModal(false)}>Cancel</button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}
    </div>
);
}