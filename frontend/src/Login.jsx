import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        const res = await fetch("http://localhost:8000/login", {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            const data = await res.json();
            navigate("/home", { state: data });
        } else {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="container-fluid py-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
            <div className="card p-4 shadow" style={{ maxWidth: 400, width: "100%" }}>
                <h2 className="mb-4 text-center">Oculist AI Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input className="form-control" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input className="form-control" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <div className="alert alert-danger py-1">{error}</div>}
                    <div className="d-flex justify-content-end mt-3">
                        <button className="btn btn-primary w-100" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
