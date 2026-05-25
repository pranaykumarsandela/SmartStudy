import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Lock, Calendar, CheckCircle, Mail, Zap, Award, Smartphone, RefreshCw, 
  Minus, Plus, Save, Monitor, Sun, Moon, Download, Trash2, AlertTriangle, Copy
} from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { useUserStore } from '../store/userStore';

const ToggleSwitch = ({ checked, onChange }) => (
  <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={onChange}>
    <div className="toggle-knob" />
  </div>
);

const PRESET_COLORS = [
  { id: 'indigo', color: '#6C63FF' },
  { id: 'cyan', color: '#06B6D4' },
  { id: 'mint', color: '#00E5A0' },
  { id: 'rose', color: '#F43F5E' },
  { id: 'amber', color: '#F59E0B' },
  { id: 'violet', color: '#8B5CF6' }
];


export default function Settings() {
  const { profile, updateProfile, clearAllSessions, logout, deleteAccount, subscribeToPush, testPush } = useUserStore();
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTz = systemTz === 'Asia/Calcutta' ? 'Asia/Kolkata' : systemTz;

  // --- GENERAL TAB STATE ---
  const [general, setGeneral] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    timezone: profile?.timezone || defaultTz || 'America/Los_Angeles',
    dailyGoal: profile?.daily_goal_minutes || 120,
    weeklyTarget: profile?.weekly_session_target || 10
  });

  const handleGeneralSave = async () => {
    try {
      await updateProfile({
        name: general.name,
        email: general.email,
        timezone: general.timezone,
        daily_goal_minutes: general.dailyGoal,
        weekly_session_target: general.weeklyTarget
      });
      showToast('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.');
    }
  };

  // --- NOTIFICATIONS TAB STATE ---
  const defaultPrefs = {
    notificationsEnabled: true,
    sessionReminders: true,
    streakAlerts: true,
    weeklyEmail: true,
    achievements: true,
    reminderTime: '15',
    quietStart: '22:00',
    quietEnd: '07:00',
    autoSyncCalendar: false
  };
  
  const [notifPrefs, setNotifPrefs] = useState(profile?.preferences || defaultPrefs);
  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  
  const handlePrefChange = async (key, value) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    try {
      await updateProfile({ preferences: newPrefs });
    } catch (err) {
      console.error(err);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestNotifPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          }
          
          const subJson = JSON.parse(JSON.stringify(subscription));
          console.log('Sending this push subscription to backend:', subJson);
          await subscribeToPush(subJson);
          handlePrefChange('notificationsEnabled', true);
          showToast('Push notifications enabled!');
        } catch (error) {
          console.error('Error enabling push:', error);
          showToast('Failed to enable push notifications');
          handlePrefChange('notificationsEnabled', false);
        }
      } else {
        handlePrefChange('notificationsEnabled', false);
      }
    } else {
      showToast('Push notifications are not supported by your browser');
    }
  };

  const copyCalendarLink = () => {
    const link = `${window.location.origin}/api/users/${profile._id}/calendar.ics`;
    navigator.clipboard.writeText(link);
    showToast('Calendar link copied to clipboard!');
  };

  // --- APPEARANCE TAB STATE ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accent, setAccent] = useState(localStorage.getItem('accent') || '#6C63FF');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-accent', accent);
    localStorage.setItem('accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let size = '16px';
    if (fontSize === 'small') size = '14px';
    if (fontSize === 'large') size = '18px';
    document.body.style.fontSize = size;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // --- DATA TAB STATE ---
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const clearData = async () => {
    try {
      await clearAllSessions();
      setShowClearModal(false);
      showToast('All sessions cleared.');
    } catch (e) {
      console.error(e);
      showToast('Failed to clear sessions.');
    }
  };

  const deleteAcc = async () => {
    try {
      await deleteAccount();
      // userStore handles local cleanup, router might need to redirect if logout doesn't
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
      showToast('Failed to delete account.');
    }
  };

  const tabVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <div style={{ paddingBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="page-title">Settings</h1>
      
      <div className="tabs-nav">
        {['general', 'notifications', 'appearance', 'data'].map(tab => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <motion.div key="general" variants={tabVariants} initial="hidden" animate="show" exit="hidden" className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Display Name</label>
                <input type="text" value={general.name} onChange={e => setGeneral({...general, name: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" value={general.email} onChange={e => setGeneral({...general, email: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Timezone</label>
              <select value={general.timezone} onChange={e => setGeneral({...general, timezone: e.target.value})} style={{ width: '100%' }}>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)' }}>Daily Study Goal</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => setGeneral(g => ({...g, dailyGoal: Math.max(15, g.dailyGoal - 15)}))} style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}><Minus size={20} /></button>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '80px', textAlign: 'center' }}>{formatDuration(general.dailyGoal)}</div>
                  <button onClick={() => setGeneral(g => ({...g, dailyGoal: g.dailyGoal + 15}))} style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}><Plus size={20} /></button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)' }}>Weekly Session Target</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => setGeneral(g => ({...g, weeklyTarget: Math.max(1, g.weeklyTarget - 1)}))} style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}><Minus size={20} /></button>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>{general.weeklyTarget}</div>
                  <button onClick={() => setGeneral(g => ({...g, weeklyTarget: g.weeklyTarget + 1}))} style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}><Plus size={20} /></button>
                </div>
              </div>
            </div>

            <button onClick={handleGeneralSave} className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <Save size={20} /> Save Changes
            </button>
          </motion.div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <motion.div key="notifications" variants={tabVariants} initial="hidden" animate="show" exit="hidden" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem' }}>Browser Push</h2>
                <ToggleSwitch checked={notifPrefs.notificationsEnabled} onChange={() => {
                  if (!notifPrefs.notificationsEnabled) {
                    requestNotifPermission();
                  } else {
                    handlePrefChange('notificationsEnabled', false);
                  }
                }} />
              </div>
              


              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { id: 'sessionReminders', label: 'Session Reminders', icon: Smartphone },
                  { id: 'streakAlerts', label: 'Streak Alerts', icon: Zap },
                  { id: 'weeklyEmail', label: 'Weekly Summary', icon: Mail },
                  { id: 'achievements', label: 'Achievements', icon: Award }
                ].map(setting => (
                  <div key={setting.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}><setting.icon size={20} color="var(--primary-accent)" /></div>
                      <div style={{ fontWeight: '500' }}>{setting.label}</div>
                    </div>
                    <ToggleSwitch checked={notifPrefs[setting.id]} onChange={() => handlePrefChange(setting.id, !notifPrefs[setting.id])} />
                  </div>
                ))}
                
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>Reminder timing:</span>
                    <select value={notifPrefs.reminderTime} onChange={e => handlePrefChange('reminderTime', e.target.value)} style={{ width: '120px' }}><option value="5">5 min</option><option value="15">15 min</option><option value="60">1 hour</option></select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>Quiet Hours:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="time" value={notifPrefs.quietStart} onChange={e => handlePrefChange('quietStart', e.target.value)} />
                      <span style={{ color: 'var(--text-secondary)' }}>to</span>
                      <input type="time" value={notifPrefs.quietEnd} onChange={e => handlePrefChange('quietEnd', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '24px' }}>Calendar Sync</h2>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Calendar size={32} color={'var(--primary-accent)'} /></div>
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Subscribe to your study schedule from Google Calendar, Apple Calendar, or Outlook using this secure feed URL.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input type="text" readOnly value={`${window.location.origin}/api/users/${profile._id}/calendar.ics`} style={{ flex: 1, backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px' }} />
                  <button onClick={copyCalendarLink} className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Copy size={20} /> Copy URL
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: '500' }}>Include completed sessions</span><ToggleSwitch checked={notifPrefs.autoSyncCalendar} onChange={() => handlePrefChange('autoSyncCalendar', !notifPrefs.autoSyncCalendar)} /></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <motion.div key="appearance" variants={tabVariants} initial="hidden" animate="show" exit="hidden" className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Theme Preferences</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { id: 'dark', label: 'Dark Mode', icon: Moon },
                  { id: 'light', label: 'Light Mode', icon: Sun },
                  { id: 'system', label: 'System Sync', icon: Monitor }
                ].map(t => (
                  <div key={t.id} onClick={() => setTheme(t.id)} style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${theme === t.id ? 'var(--primary-accent)' : 'var(--glass-border)'}`, background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <t.icon size={28} color={theme === t.id ? 'var(--primary-accent)' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: '500', color: theme === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Accent Color</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <div key={c.id} className={`color-swatch ${accent === c.color ? 'active' : ''}`} style={{ backgroundColor: c.color }} onClick={() => setAccent(c.color)} title={c.id} />
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Font Size</h3>
              <div style={{ display: 'flex', background: 'var(--glass-bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                {['small', 'medium', 'large'].map(size => (
                  <button key={size} onClick={() => setFontSize(size)} style={{ flex: 1, padding: '12px', border: 'none', background: fontSize === size ? 'var(--primary-accent)' : 'transparent', color: fontSize === size ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', fontWeight: '500', transition: 'all 0.2s' }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
          </motion.div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <motion.div key="data" variants={tabVariants} initial="hidden" animate="show" exit="hidden" className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            


            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: '#EF4444' }}>Danger Zone</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>These actions are permanent and cannot be undone.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #EF4444', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#EF4444', marginBottom: '4px' }}>Clear All Sessions</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Removes all your logged study time.</div>
                  </div>
                  <button onClick={() => setShowClearModal(true)} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #EF4444', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#EF4444', marginBottom: '4px' }}>Delete Account</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Permanently erase all data and settings.</div>
                  </div>
                  <button onClick={() => setShowDeleteModal(true)} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="modal-backdrop" onClick={() => setShowClearModal(false)} style={{ alignItems: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" onClick={e => e.stopPropagation()} style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
              <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '12px' }}>Are you sure?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This will instantly clear all your study sessions and streaks. This action cannot be reversed.</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setShowClearModal(false)} style={{ flex: 1, background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button onClick={clearData} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Yes, clear it</button>
              </div>
            </motion.div>
          </div>
        )}
        
        {showDeleteModal && (
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)} style={{ alignItems: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" onClick={e => e.stopPropagation()} style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
              <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '12px' }}>Delete Account?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This will permanently erase your profile, all study sessions, streaks, and preferences. This action cannot be reversed.</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button onClick={deleteAcc} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Yes, delete account</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="toast-container">
            <div className="toast">
              <CheckCircle size={20} color="var(--success-color)" />
              <span style={{ fontWeight: '500' }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
