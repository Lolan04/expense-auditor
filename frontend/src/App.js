import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import EmployeePortal from "./pages/EmployeePortal";
import AuditorDashboard from "./pages/AuditorDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{
        background: "#0f3460",
        padding: "12px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>ExpenseAI</div>
        <div style={{ display: "flex", gap: 20 }}>
          <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
            Submit Expense
          </Link>
          <Link to="/dashboard" style={{ color: "#fff", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
            Finance Dashboard
          </Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<EmployeePortal />} />
        <Route path="/dashboard" element={<AuditorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}