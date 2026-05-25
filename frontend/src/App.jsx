import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import AIPlan from './pages/AIPlan';
import { useUserStore } from './store/userStore';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useUserStore();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && window.addGlobalToast) {
      window.addGlobalToast('Please sign in to continue', 'warning');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const initialize = useUserStore(state => state.initialize);

  useEffect(() => {
    initialize();

    const accent = localStorage.getItem('accent') || '#6C63FF';
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    
    document.documentElement.style.setProperty('--primary-accent', accent);
    
    let size = '16px';
    if (fontSize === 'small') size = '14px';
    if (fontSize === 'large') size = '18px';
    document.body.style.fontSize = size;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth initialTab="login" />} />
        <Route path="/register" element={<Auth initialTab="register" />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="progress" element={<Progress />} />
            <Route path="profile" element={<Profile />} />
            <Route path="syllabus" element={<AIPlan />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
