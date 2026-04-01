import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import EmployeePortal from './pages/EmployeePortal';
import AuditorDashboard from './pages/AuditorDashboard';

function App() {
  return (
    <BrowserRouter>
      <nav style={{
        background: '#1a1a2e',
        padding: '16px 30px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center'
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', marginRight: '20px' }}>
          💼 ExpenseAI
        </span>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '15px' }}>
          📤 Employee Portal
        </Link>
        <Link to="/dashboard" style={{ color: '#ffc107', textDecoration: 'none', fontSize: '15px' }}>
          🏦 Finance Dashboard
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<EmployeePortal />} />
        <Route path="/dashboard" element={<AuditorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
