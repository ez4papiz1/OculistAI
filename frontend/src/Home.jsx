import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
        const res = await fetch("http://localhost:8000/appointment");
        const data = await res.json();
        setAppointments(data);
    };
    fetchAppointments();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
        <h1>Oculist AI - Appointments</h1>
        <table border="1" cellPadding="10" style={{ width: "100%", marginTop: "1rem" }}>
        <thead>
            <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Type</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            {appointments.map((appt) => (
            <tr key={appt.id}>
                <td>{appt.id}</td>
                <td>{new Date(appt.appointment_time).toLocaleString()}</td>
                <td>{appt.status}</td>
                <td>{appt.type}</td>
                <td>{appt.doctor_name}</td>
                <td>{appt.patient_name}</td>
                <td>
                    <button onClick={() => navigate(`/appointment/${appt.id}`)}>Open</button>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
  );
}