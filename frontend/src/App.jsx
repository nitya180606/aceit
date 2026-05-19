import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Tests from './pages/Tests';
import Community from './pages/Community';
import GD from './pages/GD';
import Profile from './pages/Profile';
import ATS from './pages/ATS';

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {user && <Navbar />}
      <div className={user ? 'main-with-sidebar' : ''}>
        <Routes>
          <Route path="/login"     element={!user ? <Login />    : <Navigate to="/dashboard" />} />
          <Route path="/register"  element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/tests"     element={<ProtectedRoute><Tests /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/gd"        element={<ProtectedRoute><GD /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ats"       element={<ProtectedRoute><ATS /></ProtectedRoute>} />
          <Route path="/"          element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
    </div>
  );
}
export default App;