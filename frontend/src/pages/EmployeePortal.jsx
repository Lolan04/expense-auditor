import React, { useState } from "react";

const API = process.env.REACT_APP_API_URL || "https://expenseai-backend-c8dn.onrender.com";

const VERDICT_STYLES = {
  Approved: { bg: "#d4edda", color: "#155724", icon: "✅", border: "#28a745" },
  Flagged:  { bg: "#fff3cd", color: "#856404", icon: "⚠️", border: "#ffc107" },
  Rejected: { bg: "#f8d7da", color: "#721c24", icon: "❌", border: "#dc3545" },
};

export default function EmployeeForm() {
  const [form, setForm] = useState({
    employee_name: "",
    employee_email: "",
    expense_date: "",
    description: ""
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [claimId, setClaimId] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ["image/jpeg","image/png","image/jpg","application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    setFile(f);
    setError("");
    if (f.type !== "application/pdf") setFilePreview(URL.createObjectURL(f));
    else setFilePreview("pdf");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please upload a receipt."); return; }
    setLoading(true); setError(""); setResult(null);
    const data = new FormData();
    data.append("file", file);
    Object.entries(form).forEach(([k,v]) => data.append(k, v));
    try {
      const res = await fetch(`${API}/api/receipts/submit`, { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) { setError(json.detail || "Submission failed."); setLoading(false); return; }
      setResult(json);
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const checkStatus = async () => {
    if (!claimId) return;
    setStatusLoading(true); setStatusResult(null);
    try {
      const res = await fetch(`${API}/api/receipts/status/${claimId}`);
      const json = await res.json();
      setStatusResult(res.ok ? json : { error: json.detail });
    } catch { setStatusResult({ error: "Could not reach server." }); }
    setStatusLoading(false);
  };

  const resetForm = () => {
    setForm({ employee_name:"", employee_email:"", expense_date:"", description:"" });
    setFile(null); setFilePreview(null); setResult(null); setError("");
  };

  const S = {
    page: { minHeight:"100vh", background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", padding:"30px 20px", fontFamily:"Arial, sans-serif" },
    card: { maxWidth:640, margin:"0 auto", background:"#fff", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.4)", overflow:"hidden" },
    header: { background:"linear-gradient(135deg,#667eea,#764ba2)", padding:"28px 32px", color:"#fff" },
    body: { padding:"28px 32px" },
    label: { display:"block", fontWeight:600, marginBottom:6, color:"#333", fontSize:14 },
    input: { width:"100%", padding:"10px 14px", border:"1.5px solid #ddd", borderRadius:8, fontSize:14, boxSizing:"border-box" },
    fileBox: { border:"2px dashed #c0c4cc", borderRadius:10, padding:"20px", textAlign:"center", background:"#fafbff", cursor:"pointer" },
    btn: { width:"100%", padding:"13px", background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", border:"none", borderRadius:10, fontSize:16, fontWeight:700, cursor:"pointer", marginTop:16 },
    error: { background:"#fff0f0", border:"1px solid #ffcdd2", color:"#c0392b", padding:"12px 16px", borderRadius:8, marginTop:12, fontSize:14 },
    verdict: (v) => ({ background:VERDICT_STYLES[v]?.bg, border:`2px solid ${VERDICT_STYLES[v]?.border}`, borderRadius:12, padding:"20px", marginTop:20 }),
    divider: { borderTop:"1px solid #eee", margin:"28px 0" },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>ExpenseAI</h1>
          <p style={{ margin:"6px 0 0", opacity:0.85, fontSize:14 }}>Policy-First Expense Auditor — Submit receipt for instant AI review</p>
        </div>
        <div style={S.body}>
          {!result ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <label style={S.label}>Full Name *</label>
                  <input style={S.input} value={form.employee_name} onChange={e=>setForm({...form,employee_name:e.target.value})} placeholder="Your name" required />
                </div>
                <div>
                  <label style={S.label}>Email *</label>
                  <input style={S.input} type="email" value={form.employee_email} onChange={e=>setForm({...form,employee_email:e.target.value})} placeholder="you@company.com" required />
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Expense Date *</label>
                <input style={S.input} type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})} required />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Business Purpose *</label>
                <textarea style={{...S.input,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the business reason for this expense..." required />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Receipt (JPG, PNG, or PDF) *</label>
                <div style={S.fileBox} onClick={()=>document.getElementById('file-input').click()}>
                  {filePreview && filePreview !== "pdf" ? (
                    <img src={filePreview} alt="receipt" style={{ maxHeight:160, maxWidth:"100%", borderRadius:8 }} />
                  ) : filePreview === "pdf" ? (
                    <div style={{ fontSize:36 }}>📄<br/><span style={{ fontSize:14, color:"#555" }}>{file?.name}</span></div>
                  ) : (
                    <><div style={{ fontSize:32 }}>📎</div><div style={{ fontSize:14, color:"#555", marginTop:8 }}>Click to upload receipt</div></>
                  )}
                  <div style={{ color:"#888", fontSize:13, marginTop:6 }}>JPG, PNG, PDF supported</div>
                </div>
                <input id="file-input" type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display:"none" }} onChange={handleFileChange} />
              </div>
              {error && <div style={S.error}>⚠️ {error}</div>}
              <button type="submit" style={S.btn} disabled={loading}>
                {loading ? "Analysing Receipt..." : "Submit for AI Audit"}
              </button>
            </form>
          ) : (
            <div style={S.verdict(result.verdict)}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span style={{ fontSize:28 }}>{VERDICT_STYLES[result.verdict]?.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:18, color:VERDICT_STYLES[result.verdict]?.color }}>{result.verdict}</div>
                  <div style={{ fontSize:13, color:VERDICT_STYLES[result.verdict]?.color, opacity:0.8 }}>Claim #{result.id}</div>
                </div>
              </div>
              <div style={{ fontSize:14, color:VERDICT_STYLES[result.verdict]?.color, marginBottom:8 }}>
                <strong>Explanation:</strong> {result.explanation}
              </div>
              {result.policy_snippet && (
                <div style={{ fontSize:13, background:"rgba(0,0,0,0.06)", padding:"8px 12px", borderRadius:6, color:VERDICT_STYLES[result.verdict]?.color }}>
                  Policy: {result.policy_snippet}
                </div>
              )}
              {result.date_warning && (
                <div style={{ marginTop:10, fontSize:13, color:"#856404", background:"#fff3cd", padding:"8px 12px", borderRadius:6 }}>
                  ⚠️ {result.date_warning}
                </div>
              )}
              <div style={{ marginTop:12, padding:"10px 14px", background:"#e8f4fd", borderRadius:8, fontSize:13, color:"#1a5276" }}>
                Save your <strong>Claim ID: #{result.id}</strong> to check status later.
              </div>
              <button onClick={resetForm} style={{ marginTop:14, padding:"10px 20px", background:"#fff", border:`1.5px solid ${VERDICT_STYLES[result.verdict]?.border}`, color:VERDICT_STYLES[result.verdict]?.color, borderRadius:8, cursor:"pointer", fontWeight:600 }}>
                Submit Another
              </button>
            </div>
          )}

          <div style={S.divider} />
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#333", marginBottom:10 }}>Check Claim Status</div>
            <div style={{ display:"flex", gap:10 }}>
              <input style={{...S.input, flex:1}} placeholder="Enter Claim ID (e.g. 5)" value={claimId} onChange={e=>setClaimId(e.target.value)} />
              <button onClick={checkStatus} disabled={statusLoading} style={{ padding:"10px 20px", background:"#0f3460", color:"#fff", border:"none", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                {statusLoading ? "..." : "Check"}
              </button>
            </div>
            {statusResult && !statusResult.error && (
              <div style={{ marginTop:12, background:VERDICT_STYLES[statusResult.ai_verdict]?.bg, border:`1.5px solid ${VERDICT_STYLES[statusResult.ai_verdict]?.border}`, borderRadius:10, padding:14 }}>
                <div style={{ fontWeight:700, color:VERDICT_STYLES[statusResult.ai_verdict]?.color }}>
                  Claim #{statusResult.id} — {statusResult.ai_verdict}
                </div>
                <div style={{ fontSize:13, marginTop:6 }}>{statusResult.ai_explanation}</div>
                {statusResult.override_comment && (
                  <div style={{ fontSize:13, marginTop:8, padding:"6px 10px", background:"rgba(0,0,0,0.06)", borderRadius:6 }}>
                    Auditor Note: {statusResult.override_comment}
                  </div>
                )}
              </div>
            )}
            {statusResult?.error && <div style={S.error}>❌ {statusResult.error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}