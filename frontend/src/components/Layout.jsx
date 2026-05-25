import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, X, CheckCircle, AlertTriangle, Zap, Award, Info, Moon, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import FAB from './FAB';
import { useUserStore } from '../store/userStore';

export default function Layout() {
  const location = useLocation();
  const { sessions, profile } = useUserStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifiedSessionIds, setNotifiedSessionIds] = useState(new Set());
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('studysmart-theme', next);
    setTheme(next);
  };
  
  // Notification Poller
  useEffect(() => {
    const checkSessions = () => {
      const now = new Date();
      // Format as YYYY-MM-DD to match session date
      const currentDate = now.toISOString().split('T')[0];
      // Format as HH:mm
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const preferences = profile?.preferences || { notificationsEnabled: true, sessionReminders: true };
      if (!preferences.notificationsEnabled || !preferences.sessionReminders) return;

      sessions.forEach(session => {
        if (!session.date || !session.time || session.completed) return;
        
        if (session.date === currentDate && session.time === currentTime) {
          if (!notifiedSessionIds.has(session._id)) {
            // Trigger Notification
            const newNotif = {
              id: Date.now(),
              type: 'reminder',
              title: "Time to Study!",
              desc: `Your session on ${session.topic || session.subject || 'General'} is starting now!`,
              icon: BellRing,
              color: 'var(--primary-accent)'
            };
            
            setNotifications(prev => [newNotif, ...prev]);
            setNotifiedSessionIds(prev => new Set(prev).add(session._id));

            if (window.addGlobalToast) {
              window.addGlobalToast(newNotif.title, 'info');
            }

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotif.title, { body: newNotif.desc });
            }
          }
        }
      });
    };

    const intervalId = setInterval(checkSessions, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [sessions, notifiedSessionIds, profile]);

  // Global Toast System (exposed via window for simplicity without Context)
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    window.addGlobalToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => {
        const newToasts = [{ id, message, type }, ...prev].slice(0, 3);
        return newToasts;
      });
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    return () => delete window.addGlobalToast;
  }, []);

  const getToastColors = (type) => {
    switch(type) {
      case 'success': return { bg: 'rgba(0, 229, 160, 0.1)', border: 'var(--success-color)', icon: CheckCircle };
      case 'error': return { bg: 'rgba(244, 63, 94, 0.1)', border: '#F43F5E', icon: AlertTriangle };
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', icon: Zap };
      default: return { bg: 'rgba(108, 99, 255, 0.1)', border: 'var(--primary-accent)', icon: Info };
    }
  };

  return (
    <div className="app-container">
      {/* Global Toast Stack */}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map(toast => {
            const colors = getToastColors(toast.type);
            const Icon = colors.icon;
            return (
              <motion.div 
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="glass-card toast-bar"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: colors.bg, border: `1px solid ${colors.border}`, minWidth: '300px' }}
              >
                <Icon size={20} color={colors.border} />
                <span style={{ fontWeight: '500', color: '#fff' }}>{toast.message}</span>
                <div className="toast-progress" style={{ color: colors.border }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Sidebar />
      
      <main className="main-content">
        {/* Top Bar for Notifications */}
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="topbar-btn"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', width: 20, height: 20 }}>
              <Sun 
                size={20} 
                color="var(--text-primary)" 
                style={{ position: 'absolute', top: 0, left: 0, opacity: theme === 'light' ? 1 : 0, transition: 'opacity 200ms ease' }} 
              />
              <Moon 
                size={20} 
                color="var(--text-primary)" 
                style={{ position: 'absolute', top: 0, left: 0, opacity: theme === 'dark' ? 1 : 0, transition: 'opacity 200ms ease' }} 
              />
            </div>
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className="topbar-btn"
              style={{ width: '40px', height: '40px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
            >
              {notifications.length > 0 ? <BellRing size={20} className="badge-bounce" color="var(--text-primary)" /> : <Bell size={20} color="var(--text-primary)" />}
              {notifications.length > 0 && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifications.length}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="glass-card notification-panel"
                  style={{ padding: '20px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Notifications</h3>
                    <button onClick={() => { setNotifications([]); setShowNotifs(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Clear All</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>All caught up!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <AnimatePresence>
                        {notifications.map(n => (
                          <motion.div key={n.id} exit={{ opacity: 0, x: 20 }} className="glass-card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ background: `${n.color}22`, padding: '8px', borderRadius: '50%' }}><n.icon size={16} color={n.color} /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>{n.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.desc}</div>
                            </div>
                            <button onClick={() => setNotifications(p => p.filter(x => x.id !== n.id))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="content-scrollable">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
        <FAB />
      </main>
    </div>
  );
}
