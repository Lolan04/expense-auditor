export default function StatusBadge({ status }) {
  const config = {
    APPROVED: { bg: '#d4edda', color: '#155724', emoji: '✅' },
    FLAGGED:  { bg: '#fff3cd', color: '#856404', emoji: '⚠️' },
    REJECTED: { bg: '#f8d7da', color: '#721c24', emoji: '❌' },
  };
  const s = config[status] || { bg: '#e2e3e5', color: '#383d41', emoji: '⏳' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
      {s.emoji} {status}
    </span>
  );
}