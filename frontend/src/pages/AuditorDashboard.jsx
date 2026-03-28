import { useState, useEffect } from 'react';

const F   = "'Playfair Display', serif";
const API = 'https://expenseai-backend.onrender.com';

const inp = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8',
  borderRadius: '12px', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', background: '#fafafa', color: '#222', fontFamily: F
};

const statusColor  = s => s === 'APPROVED' ? '#00a855' : s === 'REJECTED' ? '#e60023' : '#f0a500';
const statusBg     = s => s === 'APPROVED' ? '#f0fff6' : s === 'REJECTED' ? '#fff5f5' : '#fffbf0';
const statusBorder = s => s === 'APPROVED' ? '#b8f0d0' : s === 'REJECTED' ? '#ffd0d0' : '#ffe8a0';
const statusEmoji  = s => s === 'APPROVED' ? '✅' : s === 'REJECTED' ? '❌' : '⚠️';
const statusLabel  = s => s === 'APPROVED' ? 'Approved' : s === 'REJECTED' ? 'Rejected' : 'Flagged';

const badge = s => ({
  padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
  fontWeight: '700', fontFamily: F, display: 'inline-flex',
  alignItems: 'center', gap: '4px',
  background: statusBg(s), color: statusColor(s),
  border: `1.5px solid ${statusBorder(s)}`
});

export default function AuditorDashboard() {
  const [claims,   setClaims]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [override, setOverride] = useState({ status: 'APPROVED', comment: '', by: '' });
  const [msg,      setMsg]      = useState('');
  const [loading,  setLoading]  = useState(true);
  const [imgError, setImgError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/receipts/all`);
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch { setClaims([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const applyOverride = async () => {
    if (!override.comment || !override.by) { setMsg('❌ Fill in all override fields.'); return; }
    const res  = await fetch(`${API}/api/receipts/override/${selected.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(override)
    });
    const data = await res.json();
    setMsg('✅ ' + data.message);
    setSelected(null);
    load();
  };

  const counts = {
    total:    claims.length,
    approved: claims.filter(c => c.status === 'APPROVED').length,
    flagged:  claims.filter(c => c.status === 'FLAGGED').length,
    rejected: claims.filter(c => c.status === 'REJECTED').length,
  };

  const sorted = [...claims].sort((a, b) => {
    const order = { REJECTED: 0, FLAGGED: 1, APPROVED: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const getImageUrl = path => {
    if (!path) return null;
    const filename = path.split('/').pop().split('\\').pop();
    return `${API}/uploads/${filename}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontFamily: F, fontWeight: '700', fontSize: '24px', color: '#111' }}>
              📊 Finance Auditor Dashboard
            </h1>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px', fontFamily: F }}>Review and override AI-audited expense claims</p>
          </div>
          <button onClick={load} style={{
            padding: '10px 22px', background: '#fff', color: '#555',
            border: '1.5px solid #e0e0e0', borderRadius: '12px', cursor: 'pointer',
            fontWeight: '700', fontFamily: F, fontSize: '13px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Claims', value: counts.total,    color: '#5a6aaa', bg: '#f0f2ff', border: '#d0d8ff', emoji: '📋' },
            { label: 'Approved',     value: counts.approved, color: '#00a855', bg: '#f0fff6', border: '#b8f0d0', emoji: '✅' },
            { label: 'Flagged',      value: counts.flagged,  color: '#f0a500', bg: '#fffbf0', border: '#ffe8a0', emoji: '⚠️' },
            { label: 'Rejected',     value: counts.rejected, color: '#e60023', bg: '#fff5f5', border: '#ffd0d0', emoji: '❌' },
          ].map(({ label, value, color, bg, border, emoji }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: '18px', padding: '22px 20px',
              border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              borderTop: `4px solid ${color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color, fontFamily: F, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px', fontFamily: F, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                </div>
                <div style={{ fontSize: '28px', background: bg, padding: '8px', borderRadius: '12px', border: `1px solid ${border}` }}>{emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            background: msg.startsWith('✅') ? '#f0fff6' : '#fff5f5',
            color: msg.startsWith('✅') ? '#00a855' : '#e60023',
            padding: '14px 18px', borderRadius: '12px', marginBottom: '20px',
            fontSize: '14px', fontFamily: F, fontWeight: '600',
            border: `1.5px solid ${msg.startsWith('✅') ? '#b8f0d0' : '#ffd0d0'}`
          }}>
            {msg}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                {['ID','Employee','Email','Category','Location','Amount','Date','Status','Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#bbb', fontFamily: F, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '60px', color: '#ccc', fontFamily: F, fontSize: '15px' }}>⏳ Loading claims...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '60px', fontFamily: F }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                  <div style={{ color: '#ccc', fontSize: '15px' }}>No claims yet. Submit from Employee Portal.</div>
                </td></tr>
              ) : sorted.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#bbb', fontFamily: F }}>#{c.id}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#222', fontWeight: '700', fontFamily: F }}>{c.employee_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#bbb', fontFamily: F }}>{c.employee_email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555', fontFamily: F }}>{c.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555', fontFamily: F }}>{c.location}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#222', fontWeight: '700', fontFamily: F }}>${c.amount}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#bbb', fontFamily: F }}>{c.claim_date}</td>
                  <td style={{ padding: '14px 16px' }}><span style={badge(c.status)}>{statusEmoji(c.status)} {statusLabel(c.status)}</span></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => { setSelected(c); setMsg(''); setImgError(false); }} style={{
                      padding: '7px 18px', background: '#e60023', color: '#fff',
                      border: 'none', borderRadius: '10px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '700', fontFamily: F,
                      boxShadow: '0 2px 8px rgba(230,0,35,0.25)'
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {selected && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '540px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <h3 style={{ margin: 0, color: '#111', fontFamily: F, fontWeight: '700', fontSize: '18px' }}>
                  🔍 Claim #{selected.id}
                </h3>
                <button onClick={() => setSelected(null)} style={{
                  background: '#f5f5f5', border: 'none', borderRadius: '50%',
                  width: '34px', height: '34px', fontSize: '16px', cursor: 'pointer', color: '#888'
                }}>✕</button>
              </div>

              {/* Receipt Image */}
              <div style={{ marginBottom: '18px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#bbb', fontFamily: F, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>🧾 Receipt Image</p>
                {!imgError && getImageUrl(selected.receipt_path) ? (
                  <img
                    src={getImageUrl(selected.receipt_path)}
                    alt="Receipt"
                    onError={() => setImgError(true)}
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '14px', border: '1.5px solid #f0f0f0', background: '#fafafa', display: 'block' }}
                  />
                ) : (
                  <div style={{ height: '90px', borderRadius: '14px', border: '1.5px dashed #e8e8e8', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#ccc', fontFamily: F, fontSize: '13px' }}>📄 PDF or preview unavailable</span>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              <div style={{ background: '#fafafa', borderRadius: '16px', padding: '18px', marginBottom: '16px', border: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#bbb', fontFamily: F, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>📋 Extracted Data</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['Employee', selected.employee_name],
                    ['Amount',   `$${selected.amount}`],
                    ['Category', selected.category],
                    ['Location', selected.location],
                    ['Date',     selected.claim_date],
                    ['Merchant', selected.merchant],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px', border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: '11px', color: '#bbb', fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{l}</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#333', fontFamily: F }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px', border: '1px solid #f0f0f0', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#bbb', fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Business Purpose</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', fontFamily: F }}>{selected.business_purpose}</div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <span style={badge(selected.status)}>{statusEmoji(selected.status)} {statusLabel(selected.status)}</span>
              </div>

              {/* AI Reason */}
              <div style={{ background: '#fff8f0', border: '1.5px solid #ffe0c0', borderRadius: '14px', padding: '16px', marginBottom: '22px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#e08030', fontFamily: F, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>🤖 AI Reason</p>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#a06030', fontFamily: F, lineHeight: '1.7' }}>{selected.reason}</p>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#c09050', fontFamily: F, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>📄 Policy Applied</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#b08040', fontFamily: F, fontStyle: 'italic', lineHeight: '1.6' }}>{selected.policy_snippet}</p>
              </div>

              {/* Override Panel */}
              <div style={{ borderTop: '2px dashed #f0f0f0', paddingTop: '20px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#888', fontFamily: F, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🔧 Finance Override</p>
                <select value={override.status} onChange={e => setOverride({ ...override, status: e.target.value })} style={{ ...inp, marginBottom: '10px' }}>
                  <option>APPROVED</option>
                  <option>REJECTED</option>
                  <option>FLAGGED</option>
                </select>
                <input placeholder="👤 Reviewer name (e.g. Priya — Finance)" value={override.by} onChange={e => setOverride({ ...override, by: e.target.value })} style={{ ...inp, marginBottom: '10px' }} />
                <textarea placeholder="💬 Override reason / comment..." value={override.comment} onChange={e => setOverride({ ...override, comment: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', marginBottom: '16px', lineHeight: '1.7' }} />
                <button onClick={applyOverride} style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #e60023, #ff4d6d)',
                  color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '15px', fontFamily: F,
                  boxShadow: '0 4px 16px rgba(230,0,35,0.3)'
                }}>
                  ✅ Apply Override
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}