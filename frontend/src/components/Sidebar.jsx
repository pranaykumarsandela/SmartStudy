import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar as CalendarIcon, PieChart, Sparkles, User, Settings, PanelLeftClose, PanelLeftOpen, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/schedule', label: 'Schedule', icon: CalendarIcon },
  { path: '/progress', label: 'Progress', icon: PieChart },
  { path: '/syllabus', label: 'Syllabus', icon: BookOpen },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useUserStore();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <h2 className="sidebar-title" style={{ color: 'var(--color-heading)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <Sparkles size={24} color="var(--primary-accent)" style={{ flexShrink: 0 }} /> {!collapsed && "StudySmart"}
        </h2>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span style={{ transition: 'opacity 0.2s', opacity: collapsed ? 0 : 1 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--nav-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--nav-avatar-bg)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'
            )}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile?.name || 'Student'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile?.email || 'student@example.com'}</div>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <button className="logout-btn" onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
