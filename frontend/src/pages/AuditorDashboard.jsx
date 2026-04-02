import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "https://expenseai-backend-t63s.onrender.com";

const VC = {
  Approved: { bg:"#d4edda", color:"#155724", dot:"#28a745" },
  Flagged:  { bg:"#fff3cd", color:"#856404", dot:"#ffc107" },
  Rejected: { bg:"#f8d7da", color:"#721c24", dot:"#dc3545" },
  Pending:  { bg:"#e2e3e5", color:"#383d41", dot:"#6c757d" },
};

export default function AuditorDashboard() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [override, setOverride] = useState({ new_verdict:"", comment:"", auditor_name:"" });
  const [overrideMsg, setOverrideMsg] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => { fetchReceipts(); }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try { const r = await fetch(`${API}/api/receipts`); setReceipts(await r.json()); }
    catch { setReceipts([]); }
    setLoading(false);
  };

  const openDetail = async (id) => {
    setSelected(id); setDetail(null); setOverrideMsg("");
    setOverride({ new_verdict:"", comment:"", auditor_name:"" });
    setDetailLoading(true);
    try { const r = await fetch(`${API}/api/receipts/${id}`); setDetail(await r.json()); }
    catch { setDetail(null); }
    setDetailLoading(false);
  };

  const submitOverride = async () => {
    if (!override.new_verdict || !override.comment || !override.auditor_name) {
      setOverrideMsg("Please fill all fields."); return;
    }
    try {
      const r = await fetch(`${API}/api/receipts/${selected}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(override),
      });
      if (r.ok) { setOverrideMsg("Override applied!"); fetchReceipts(); openDetail(selected); }
      else { const e = await r.json(); setOverrideMsg("Failed: " + (e.detail || "Error")); }
    } catch { setOverrideMsg("Network error."); }
  };

  const filtered = filter === "All" ? receipts : receipts.filter((r) => r.ai_verdict === filter);
  const stats = {
    total: receipts.length,
    approved: receipts.filter((r) => r.ai_verdict === "Approved").length,
    flagged: receipts.filter((r) => r.ai_verdict === "Flagged").length,
    rejected: receipts.filter((r) => r.ai_verdict === "Rejected").length,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f2f5", fontFamily:"Arial, sans-serif" }}>

      <div style={{ background:"linear-gradient(135deg,#1a1a2e,#16213e)", padding:"20px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ color:"#fff", margin:0, fontSize:22, fontWeight:700 }}>Finance Audit Dashboard</h1>
        <button onClick={fetchReceipts} style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:14 }}>
          Refresh
        </button>
      </div>

      <div style={{ padding:"24px 32px" }}>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[["Total Claims",stats.total,"#6c757d"],["Approved",stats.approved,"#28a745"],["Flagged",stats.flagged,"#ffc107"],["Rejected",stats.rejected,"#dc3545"]].map(([label,value,color]) => (
            <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", borderLeft:`4px solid ${color}`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
              <div style={{ fontSize:13, color:"#777", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          {["All","Rejected","Flagged","Approved"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 18px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, marginRight:8, background:filter===f?"#0f3460":"#e9ecef", color:filter===f?"#fff":"#495057" }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["#","Employee","Merchant","Amount","Date","Verdict","Action"].map((h) => (
                  <th key={h} style={{ background:"#f8f9fa", padding:"12px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#495057", borderBottom:"1px solid #dee2e6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"#999" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"#999" }}>No claims found</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}><strong style={{ color:"#6c757d" }}>#{r.id}</strong></td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}>
                    <div style={{ fontWeight:600 }}>{r.employee_name}</div>
                    <div style={{ fontSize:12, color:"#888" }}>{r.employee_email}</div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}>{r.merchant_name || "—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}><strong>{r.ocr_amount} {r.ocr_currency}</strong></td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}>{r.expense_date}</td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}>
                    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:12, fontSize:12, fontWeight:700, background:VC[r.ai_verdict]?.bg, color:VC[r.ai_verdict]?.color }}>{r.ai_verdict}</span>
                    {r.override_by && <div style={{ fontSize:11, color:"#888", marginTop:3 }}>Overridden by {r.override_by}</div>}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:14, borderBottom:"1px solid #f0f0f0" }}>
                    <button onClick={() => openDetail(r.id)} style={{ padding:"6px 14px", background:"#0f3460", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13 }}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {selected && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"40px 20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:900, boxShadow:"0 30px 80px rgba(0,0,0,0.3)" }}>

            <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)", padding:"20px 28px", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:"#fff" }}>
                <div style={{ fontWeight:700, fontSize:18 }}>Audit Detail — Claim #{selected}</div>
                {detail && <div style={{ fontSize:13, opacity:0.85 }}>{detail.employee_name} · {detail.expense_date}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:16 }}>Close</button>
            </div>

            <div style={{ padding:"24px 28px" }}>
              {detailLoading ? (
                <div style={{ textAlign:"center", padding:40, color:"#999" }}>Loading...</div>
              ) : detail ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

                  <div>
                    <div style={{ fontWeight:700, marginBottom:12, fontSize:15 }}>Receipt Image</div>
                    {detail.receipt_image_base64 ? (
                      <img src={`data:image/png;base64,${detail.receipt_image_base64}`} alt="receipt" style={{ width:"100%", borderRadius:10, border:"1px solid #ddd" }} />
                    ) : (
                      <div style={{ background:"#f0f0f0", height:200, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"#999" }}>No image</div>
                    )}
                    <div style={{ marginTop:16 }}>
                      <div style={{ fontWeight:700, marginBottom:10, fontSize:15 }}>Extracted Data</div>
                      {[
                        ["Merchant", detail.merchant_name],
                        ["Amount", `${detail.ocr_amount} ${detail.ocr_currency}`],
                        ["Receipt Date", detail.ocr_date || "Not detected"],
                        ["Expense Date", detail.expense_date],
                        ["Employee", detail.employee_name],
                        ["Email", detail.employee_email],
                      ].map(([k,v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f0f0", fontSize:14 }}>
                          <span style={{ color:"#666" }}>{k}</span>
                          <span style={{ fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight:700, marginBottom:12, fontSize:15 }}>AI Audit Result</div>
                    <div style={{ background:VC[detail.ai_verdict]?.bg, border:`2px solid ${VC[detail.ai_verdict]?.dot}`, borderRadius:10, padding:16, marginBottom:16 }}>
                      <div style={{ fontWeight:700, fontSize:18, color:VC[detail.ai_verdict]?.color }}>{detail.ai_verdict}</div>
                      <div style={{ fontSize:14, color:VC[detail.ai_verdict]?.color, marginTop:8 }}>{detail.ai_explanation}</div>
                    </div>
                    {detail.policy_snippet && (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontWeight:700, marginBottom:8, fontSize:15 }}>Policy Reference</div>
                        <div style={{ background:"#f8f9fa", borderLeft:"4px solid #667eea", padding:"12px 16px", borderRadius:6, fontSize:13, color:"#555", fontStyle:"italic" }}>
                          "{detail.policy_snippet}"
                        </div>
                      </div>
                    )}
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontWeight:700, marginBottom:8, fontSize:15 }}>Business Purpose</div>
                      <div style={{ background:"#f8f9fa", padding:"12px 16px", borderRadius:8, fontSize:14, color:"#555" }}>{detail.description}</div>
                    </div>

                    <div style={{ background:"#f0f4ff", borderRadius:10, padding:16, border:"1px solid #c7d2fe" }}>
                      <div style={{ fontWeight:700, marginBottom:12, fontSize:15 }}>Finance Auditor Override</div>
                      {detail.override_by && (
                        <div style={{ marginBottom:10, padding:"8px 12px", background:"#fff", borderRadius:8, fontSize:13 }}>
                          Overridden by <strong>{detail.override_by}</strong>: "{detail.override_comment}"
                        </div>
                      )}
                      <select value={override.new_verdict} onChange={(e) => setOverride({...override,new_verdict:e.target.value})}
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #c7d2fe", fontSize:14, boxSizing:"border-box", marginBottom:10 }}>
                        <option value="">Select new verdict...</option>
                        <option value="Approved">Approved</option>
                        <option value="Flagged">Flagged</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <input value={override.auditor_name} onChange={(e) => setOverride({...override,auditor_name:e.target.value})}
                        placeholder="Your name (auditor)"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #c7d2fe", fontSize:14, boxSizing:"border-box", marginBottom:10 }} />
                      <textarea value={override.comment} onChange={(e) => setOverride({...override,comment:e.target.value})}
                        placeholder="Reason for override..."
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #c7d2fe", fontSize:14, boxSizing:"border-box", marginBottom:10, height:70, resize:"none" }} />
                      <button onClick={submitOverride}
                        style={{ width:"100%", padding:"10px", background:"#0f3460", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:14 }}>
                        Apply Override
                      </button>
                      {overrideMsg && (
                        <div style={{ marginTop:8, fontSize:13, color:overrideMsg.startsWith("Override")?"#155724":"#721c24" }}>{overrideMsg}</div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign:"center", padding:40, color:"#999" }}>Could not load details.</div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}