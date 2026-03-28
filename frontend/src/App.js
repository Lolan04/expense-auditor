import { BrowserRouter, Routes, Route, Link, useLocation, useEffect } from 'react-router-dom';
import EmployeePortal from './pages/EmployeePortal';
import AuditorDashboard from './pages/AuditorDashboard';

const API = 'https://expenseai-backend.onrender.com';

function NavBar() {
  const location = useLocation();
  const active = path => location.pathname === path;

  return (
    <nav style={{
      background: '#ffffff',
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      height: '70px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>

      {/* ── LOGO ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '48px' }}>

        {/* Icon Badge */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #e60023 0%, #ff4d6d 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(230,0,35,0.35)'
        }}>
          <span style={{
            color: 'white',
            fontSize: '22px',
            fontWeight: '900',
            fontFamily: "'Dancing Script', cursive"
          }}>E</span>
        </div>

        {/* Name + Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily: "'Dancing Script', cursive",
            fontWeight: '800',
            fontSize: '28px',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #e60023 0%, #ff6b35 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ExpenseAI
          </span>
          <span style={{
            fontSize: '10px',
            color: '#ccc',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '3px'
          }}>
            Smart Audit System
          </span>
        </div>
      </div>

      {/* ── NAV LINKS ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link to="/" style={{
          padding: '9px 20px',
          borderRadius: '24px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Playfair Display', serif",
          background: active('/')
            ? 'linear-gradient(135deg, #e60023, #ff4d6d)'
            : 'transparent',
          color: active('/') ? '#fff' : '#777',
          boxShadow: active('/')
            ? '0 3px 12px rgba(230,0,35,0.25)'
            : 'none',
          transition: 'all 0.2s'
        }}>
          📤 Employee Portal
        </Link>

        <Link to="/dashboard" style={{
          padding: '9px 20px',
          borderRadius: '24px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Playfair Display', serif",
          background: active('/dashboard')
            ? 'linear-gradient(135deg, #e60023, #ff4d6d)'
            : 'transparent',
          color: active('/dashboard') ? '#fff' : '#777',
          boxShadow: active('/dashboard')
            ? '0 3px 12px rgba(230,0,35,0.25)'
            : 'none',
          transition: 'all 0.2s'
        }}>
          📊 Finance Dashboard
        </Link>
      </div>

    </nav>
  );
}

function App() {

  // ── Keep-Alive ping every 10 minutes ──
  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch(`${API}/`)
        .catch(() => {});
    }, 600000);
    return () => clearInterval(keepAlive);
  }, []);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<EmployeePortal />} />
        <Route path="/dashboard" element={<AuditorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;