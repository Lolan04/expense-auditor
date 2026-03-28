import { useState } from 'react';

const F = "'Playfair Display', serif";
const API = 'https://expenseai-backend.onrender.com';

const lbl = {
  display: 'block', fontSize: '12px', fontWeight: '700',
  color: '#444', marginBottom: '7px', fontFamily: F,
  letterSpacing: '0.6px', textTransform: 'uppercase'
};

const inp = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #e8e8e8', borderRadius: '12px',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: '#fafafa', color: '#222', fontFamily: F,
  transition: 'border-color 0.2s'
};

const card = {
  background: '#ffffff', borderRadius: '20px',
  padding: '20px', border: '1px solid #f0f0f0',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '16px'
};

export default function EmployeePortal() {
  const [form, setForm] = useState({
    employee_name: '', employee_email: '',
    category: 'Meals', location: 'New York',
    business_purpose: '', claim_date: '', amount: ''
  });
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const isMobile = window.innerWidth < 600;

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (!file) { setError('Please select a receipt file.'); return; }
    setLoading(true); setError(''); setResult(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      const res  = await fetch(`${API}/api/receipts/submit`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Submission failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null); setFile(null);
    setForm({
      employee_name: '', employee_email: '',
      category: 'Meals', location: 'New York',
      business_purpose: '', claim_date: '', amount: ''
    });
  };

  const statusColor  = s => s === 'APPROVED' ? '#00a855' : s === 'REJECTED' ? '#e60023' : '#f0a500';
  const statusBg     = s => s === 'APPROVED' ? '#f0fff6' : s === 'REJECTED' ? '#fff5f5' : '#fffbf0';
  const statusBorder = s => s === 'APPROVED' ? '#b8f0d0' : s === 'REJECTED' ? '#ffd0d0' : '#ffe8a0';
  const statusEmoji  = s => s === 'APPROVED' ? '✅' : s === 'REJECTED' ? '❌' : '⚠️';
  const statusLabel  = s => s === 'APPROVED' ? 'Approved' : s === 'REJECTED' ? 'Rejected' : 'Flagged for Review';

  // ── RESULT SCREEN ──────────────────────────────────────
  if (result) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: isMobile ? '20px 12px' : '36px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '540px', width: '100%' }}>

        {/* Hero Status Card */}
        <div style={{
          background: '#fff', borderRadius: '24px',
          padding: isMobile ? '24px 20px' : '36px',
          textAlign: 'center', marginBottom: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: `2px solid ${statusBorder(result.audit.status)}`
        }}>
          <div style={{ fontSize: isMobile ? '42px' : '52px', marginBottom: '12px' }}>{statusEmoji(result.audit.status)}</div>
          <h2 style={{ margin: '0 0 6px', color: '#111', fontFamily: F, fontWeight: '700', fontSize: isMobile ? '18px' : '22px' }}>Audit Complete!</h2>
          <p style={{ color: '#999', margin: '0 0 20px', fontFamily: F, fontSize: '14px' }}>
            Claim <strong style={{ color: '#555' }}>#{result.claim_id}</strong> processed
          </p>
          <span style={{
            display: 'inline-block', padding: '8px 24px', borderRadius: '24px',
            fontWeight: '700', fontSize: '14px', fontFamily: F,
            background: statusBg(result.audit.status),
            color: statusColor(result.audit.status),
            border: `1.5px solid ${statusBorder(result.audit.status)}`
          }}>
            {statusEmoji(result.audit.status)} {statusLabel(result.audit.status)}
          </span>
        </div>

        {/* Claim Details */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>Claim Details</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
            {[
              ['🏪 Merchant', result.ocr_data.merchant],
              ['💰 Amount',   `$${result.ocr_data.amount}`],
              ['📁 Category', form.category],
              ['📍 Location', form.location],
              ['📅 Date',     result.ocr_data.date],
              ['💱 Currency', result.ocr_data.currency],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#fafafa', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', fontFamily: F, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#222', fontFamily: F }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Decision */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>AI Decision</h3>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888', fontFamily: F }}>
            <span style={{ color: '#bbb' }}>Status — </span>
            <span style={{ color: statusColor(result.audit.status), fontWeight: '700' }}>
              {statusLabel(result.audit.status)}
            </span>
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#444', fontFamily: F, lineHeight: '1.7' }}>
            {result.audit.reason}
          </p>
        </div>

        {/* Policy */}
        {result.audit.policy_snippet && (
          <div style={{ ...card, background: '#fff8f0', border: '1.5px solid #ffe0c0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>📄</span>
              <h3 style={{ margin: 0, fontFamily: F, fontSize: '14px', color: '#c05000', fontWeight: '700' }}>Policy Rule Applied</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#a06030', fontFamily: F, lineHeight: '1.7' }}>
              {result.audit.policy_snippet}
            </p>
          </div>
        )}

        {/* Email */}
        <div style={{ ...card, background: '#f0f8ff', border: '1.5px solid #cce4ff', textAlign: 'center' }}>
          <span style={{ fontSize: '16px' }}>📧 </span>
          <span style={{ fontSize: '14px', color: '#2266aa', fontFamily: F }}>
            Notification sent to <strong>{form.employee_email}</strong>
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '4px' }}>
          <button onClick={reset} style={{
            flex: 1, padding: '14px', background: '#fff', color: '#555',
            border: '1.5px solid #e0e0e0', borderRadius: '14px', cursor: 'pointer',
            fontWeight: '700', fontSize: '14px', fontFamily: F
          }}>
            ➕ New Claim
          </button>
          <a href="/dashboard" style={{
            flex: 1, padding: '14px',
            background: 'linear-gradient(135deg, #e60023, #ff4d6d)',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontWeight: '700', fontSize: '14px', fontFamily: F,
            textAlign: 'center', textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: '0 4px 14px rgba(230,0,35,0.28)'
          }}>
            📊 View Dashboard
          </a>
        </div>

      </div>
    </div>
  );

  // ── FORM SCREEN ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: isMobile ? '20px 12px' : '36px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '580px', width: '100%' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 6px', fontFamily: F, fontWeight: '700', fontSize: isMobile ? '20px' : '26px', color: '#111' }}>
            📤 Submit Expense Claim
          </h1>
          <p style={{ margin: 0, color: '#999', fontFamily: F, fontSize: '14px' }}>
            Fill in details for instant AI policy audit
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff5f5', color: '#e60023',
            padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
            fontSize: '14px', fontFamily: F, border: '1.5px solid #ffd0d0',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={submit}>

          {/* Personal Info */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>Personal Info</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input
                  name="employee_name"
                  value={form.employee_name}
                  onChange={handle}
                  required
                  placeholder="Abhiram Kumar"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input
                  name="employee_email"
                  type="email"
                  value={form.employee_email}
                  onChange={handle}
                  required
                  placeholder="you@company.com"
                  style={inp}
                />
              </div>
            </div>
          </div>

          {/* Expense Details */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>💼</span>
              <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>Expense Details</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={lbl}>Category</label>
                <select name="category" value={form.category} onChange={handle} style={inp}>
                  {['Meals','Transport','Lodging','Conference','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Location</label>
                <select name="location" value={form.location} onChange={handle} style={inp}>
                  {['New York','London','Mumbai','Chicago','Other'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input
                  name="claim_date"
                  type="date"
                  value={form.claim_date}
                  onChange={handle}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Amount (USD)</label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handle}
                  required
                  placeholder="0.00"
                  style={inp}
                />
              </div>
            </div>
          </div>

          {/* Business Purpose */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💬</span>
                <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>Business Purpose</h3>
              </div>
              <span style={{
                fontSize: '12px', fontFamily: F, fontWeight: '700',
                padding: '3px 10px', borderRadius: '12px',
                background: form.business_purpose.length < 15 ? '#fff5f5' : '#f0fff6',
                color:      form.business_purpose.length < 15 ? '#e60023' : '#00a855',
                border:    `1px solid ${form.business_purpose.length < 15 ? '#ffd0d0' : '#b8f0d0'}`
              }}>
                {form.business_purpose.length} / 15 min
              </span>
            </div>
            <textarea
              name="business_purpose"
              value={form.business_purpose}
              onChange={handle}
              required
              rows={3}
              placeholder="e.g. Client dinner with ABC Corp team to discuss Q2 contract renewal"
              style={{ ...inp, resize: 'vertical', lineHeight: '1.7' }}
            />
          </div>

          {/* Upload Receipt */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px' }}>🧾</span>
              <h3 style={{ margin: 0, fontFamily: F, fontSize: '15px', color: '#222', fontWeight: '700' }}>Upload Receipt</h3>
            </div>
            <label style={{
              display: 'block',
              border: `2px dashed ${file ? '#00a855' : '#e0e0e0'}`,
              borderRadius: '16px',
              padding: isMobile ? '22px 16px' : '28px',
              textAlign: 'center', cursor: 'pointer',
              background: file ? '#f0fff6' : '#fafafa',
              transition: 'all 0.2s'
            }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <div style={{ color: '#00a855', fontWeight: '700', fontFamily: F, fontSize: '14px' }}>{file.name}</div>
                  <div style={{ color: '#aaa', fontSize: '12px', fontFamily: F, marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <div style={{ color: '#aaa', fontFamily: F, fontSize: '14px' }}>Click to select receipt</div>
                  <div style={{ color: '#ccc', fontSize: '12px', fontFamily: F, marginTop: '4px' }}>JPG, PNG or PDF</div>
                </div>
              )}
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: isMobile ? '14px' : '16px',
            background: loading
              ? '#ccc'
              : 'linear-gradient(135deg, #e60023, #ff4d6d)',
            color: '#fff', border: 'none', borderRadius: '16px',
            fontSize: isMobile ? '15px' : '16px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: F, letterSpacing: '0.5px',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(230,0,35,0.3)',
            transition: 'all 0.2s'
          }}>
            {loading ? '⏳ Auditing your claim...' : '🚀 Submit for AI Audit'}
          </button>

        </form>
      </div>
    </div>
  );
}