import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Appointment from "./Appointment";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointment/:id" element={<Appointment />} />
      </Routes>
    </Router>
  );
}
