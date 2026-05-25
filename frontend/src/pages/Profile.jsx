import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Edit2, Check, BookOpen, Clock, Zap, Target, Plus, Sun, Sunrise, Sunset, Moon, Calendar, X } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { formatDuration } from '../lib/utils';

function useCounter(target) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return count;
}

export default function Profile() {
  const { profile: userProfile, updateProfile, sessions } = useUserStore();
  
  const handleRemoveCustomSubject = async (subjectName) => {
    if (!window.confirm(`Are you sure you want to remove ${subjectName}?`)) return;
    const newCustomSubjects = userProfile.custom_subjects.filter(s => s.name !== subjectName);
    try {
      await updateProfile({ custom_subjects: newCustomSubjects });
    } catch (err) {
      console.error(err);
    }
  };
  
  const [profile, setProfile] = useState({
    name: userProfile?.name || 'User',
    email: userProfile?.email || '',
    avatar: userProfile?.avatar || null
  });

  const [subjects, setSubjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#6C63FF');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userProfile) {
      setProfile({ name: userProfile.name, email: userProfile.email, avatar: userProfile.avatar });
    }
    
    const colors = ['var(--primary-accent)', '#06B6D4', 'var(--success-color)', '#F59E0B', '#EF4444', '#8B5CF6'];
    let extracted = [];
    
    if (userProfile?.syllabus) {
      userProfile.syllabus.forEach((item) => {
        if (item.subjects && Array.isArray(item.subjects)) {
          item.subjects.forEach((s) => {
            if (s.subject) extracted.push({ name: s.subject, type: 'syllabus', color: colors[extracted.length % colors.length] });
          });
        }
      });
    }

    if (userProfile?.custom_subjects) {
      userProfile.custom_subjects.forEach((s) => {
        if (s.name) extracted.push({ name: s.name, type: 'custom', color: s.color || colors[extracted.length % colors.length] });
      });
    }
    
    // Deduplicate by name
    const uniqueSubjects = [];
    const seen = new Set();
    extracted.forEach(sub => {
      if (!seen.has(sub.name)) {
        seen.add(sub.name);
        uniqueSubjects.push(sub);
      }
    });

    setSubjects(uniqueSubjects);
  }, [userProfile]);

  const handleRemoveSubject = async (subjectToRemove) => {
    if (!userProfile) return;
    try {
      let updates = {};
      if (subjectToRemove.type === 'custom') {
        updates.custom_subjects = (userProfile.custom_subjects || []).filter(s => s.name !== subjectToRemove.name);
      } else {
        updates.syllabus = (userProfile.syllabus || []).map(semester => ({
          ...semester,
          subjects: (semester.subjects || []).filter(s => s.subject !== subjectToRemove.name)
        }));
      }
      await updateProfile(updates);
    } catch (err) {
      console.error('Failed to remove subject', err);
    }
  };


  const completedSessions = (sessions || []).filter(s => s.completed || s.is_done);
  const totalSessionsCount = completedSessions.length;
  const totalStudyMinutes = completedSessions.reduce((acc, s) => acc + (s.duration_minutes || 60), 0);
  const totalStudyTimeH = Math.round(totalStudyMinutes / 60);
  const bestStreak = userProfile?.longest_streak || 0;

  const animatedSessions = useCounter(totalSessionsCount);
  const animatedTimeMins = useCounter(totalStudyMinutes);
  const animatedStreak = useCounter(bestStreak);
  const animatedSubjects = useCounter(subjects.length);

  const [studyTime, setStudyTime] = useState(userProfile?.preferred_study_time || 'evening');
  const [sessionLength, setSessionLength] = useState(userProfile?.daily_goal_minutes || 60);

  const handleStudyTimeChange = async (timeId) => {
    setStudyTime(timeId);
    try {
      await updateProfile({ preferred_study_time: timeId });
    } catch (err) {
      console.error('Failed to save study time', err);
    }
  };

  const handleSessionLengthSave = async (e) => {
    try {
      await updateProfile({ daily_goal_minutes: parseInt(sessionLength) });
    } catch (err) {
      console.error('Failed to save session length', err);
    }
  };

  const handleEdit = (field) => {
    if (editing === field) setEditing(null);
    else setEditing(field);
  };

  const handleSave = async (e, field) => {
    if (e.key === 'Enter') {
      try {
        await updateProfile({ [field]: profile[field] });
        setEditing(null);
      } catch (err) {
        console.error('Failed to update', err);
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          await updateProfile({ avatar: dataUrl });
        } catch (err) {
          console.error('Failed to update avatar', err);
          alert('Failed to update avatar. Please try again.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };


  return (
    <div style={{ paddingBottom: '40px', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      


      <h1 style={{
        fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-heading), Syne, sans-serif',
        background: 'var(--profile-title-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '24px', position: 'relative', zIndex: 1
      }}>
        Profile
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', position: 'relative', zIndex: 1 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Avatar & Basic Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-card" 
            style={{ 
              padding: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--profile-card-bg)', overflow: 'hidden', position: 'relative'
            }}
          >

          
          {/* Avatar */}
          <div 
            className="avatar-container"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              marginTop: 16,
              position: 'relative', zIndex: 1,
              background: 'var(--profile-avatar-bg)',
              border: '3px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden'
            }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--profile-avatar-text)' }}>{profile.name.charAt(0).toUpperCase()}</span>
            )}
            <div className="avatar-overlay" style={{ borderRadius: '50%', position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} color="#fff" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
          </div>

          <div style={{ padding: '24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Name Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AnimatePresence mode="wait">
                {editing === 'name' ? (
                  <motion.input 
                    key="input-name" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="inline-edit-input" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} onKeyDown={e => handleSave(e, 'name')} autoFocus
                    style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-heading), Syne, sans-serif', textAlign: 'center' }}
                  />
                ) : (
                  <motion.span key="text-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-heading), Syne, sans-serif' }}>
                    {profile.name}
                  </motion.span>
                )}
              </AnimatePresence>
              <button onClick={() => handleEdit('name')} style={{ 
                background: 'rgba(108,99,255,0.15)', borderRadius: '20px', padding: '3px 8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}>
                {editing === 'name' ? <Check size={14} color="#6C63FF" /> : <Edit2 size={14} color="#6C63FF" />}
              </button>
            </div>

            {/* Email Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AnimatePresence mode="wait">
                {editing === 'email' ? (
                  <motion.input 
                    key="input-email" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="inline-edit-input" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} onKeyDown={e => handleSave(e, 'email')} autoFocus
                    style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}
                  />
                ) : (
                  <motion.span key="text-email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {profile.email}
                  </motion.span>
                )}
              </AnimatePresence>
              <button onClick={() => handleEdit('email')} style={{
                background: 'rgba(108,99,255,0.15)', borderRadius: '20px', padding: '3px 8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}>
                {editing === 'email' ? <Check size={12} color="#6C63FF" /> : <Edit2 size={12} color="#6C63FF" />}
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5A0' }} />
              <span style={{ fontSize: '11px', color: '#00E5A0' }}>Verified</span>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Calendar size={12} /> Member since {new Date(userProfile?.createdAt || new Date()).getFullYear()}
            </div>
          </div>
        </motion.div>

        {/* Study Preferences (Moved to Left Column) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }} className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Study Preferences</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)' }}>Preferred Study Time</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { id: 'morning', label: 'Morning', icon: Sunrise },
                { id: 'afternoon', label: 'Afternoon', icon: Sun },
                { id: 'evening', label: 'Evening', icon: Sunset },
                { id: 'night', label: 'Night', icon: Moon }
              ].map(time => (
                <button 
                  key={time.id} onClick={() => handleStudyTimeChange(time.id)}
                  style={{ 
                    background: studyTime === time.id ? 'rgba(108, 99, 255, 0.2)' : 'var(--glass-bg)',
                    border: `1px solid ${studyTime === time.id ? 'var(--primary-accent)' : 'var(--glass-border)'}`,
                    color: studyTime === time.id ? 'var(--primary-accent)' : 'var(--text-primary)',
                    padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                >
                  <time.icon size={20} />
                  <span style={{ fontSize: '0.8rem' }}>{time.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Preferred Session Length</label>
              <span style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{formatDuration(sessionLength)}</span>
            </div>
            <input 
              type="range" min="15" max="240" step="15" 
              value={sessionLength} 
              onChange={e => setSessionLength(e.target.value)} 
              onMouseUp={handleSessionLengthSave}
              onTouchEnd={handleSessionLengthSave}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)' }}>Break Frequency</label>
            <select style={{ width: '100%' }}>
              <option>Pomodoro (5m break every 25m)</option>
              <option>50/10 (10m break every 50m)</option>
              <option>Custom</option>
              <option>No breaks (Not recommended)</option>
            </select>
          </div>
          
        </motion.div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}
          >
            {[
              { icon: BookOpen, val: animatedSessions, label: 'Sessions', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' },
              { icon: Clock, val: formatDuration(animatedTimeMins), label: 'Total Time', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
              { icon: Zap, val: animatedStreak, label: 'Best Streak', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
              { icon: Target, val: animatedSubjects, label: 'Subjects', color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
            ].map((s, i) => (
              <motion.div key={i} whileHover={{ translateY: -2, background: 'rgba(108,99,255,0.10)' }} style={{
                background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)', borderRadius: '16px', padding: '20px 16px', textAlign: 'center', transition: 'all 0.2s ease'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading), Syne, sans-serif', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>



          {/* Subjects I Study */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="glass-card" style={{ padding: '24px', background: 'var(--profile-card-bg)', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Subjects I Study</h3>
              <div style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>
                {subjects.length}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {subjects.map((sub, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.03), duration: 0.3 }}
                  whileHover={{ translateY: -2, scale: 1.02, background: `color-mix(in srgb, ${sub.color} 25%, transparent)`, boxShadow: `0 4px 12px color-mix(in srgb, ${sub.color} 30%, transparent)` }}
                  style={{ 
                    padding: '8px 16px', borderRadius: '99px', border: `1px solid ${sub.color}`, color: sub.color, 
                    background: `color-mix(in srgb, ${sub.color} 12%, transparent)`, 
                    fontWeight: 600, fontSize: '13px', transition: 'all 0.18s ease',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {sub.name}
                  <button 
                    onClick={() => handleRemoveSubject(sub)}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', display: 'flex', marginLeft: '4px', opacity: 0.7 }}
                    title={`Remove ${sub.name}`}
                    onMouseOver={e => e.currentTarget.style.opacity = 1}
                    onMouseOut={e => e.currentTarget.style.opacity = 0.7}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>



        </div>
      </div>
    </div>
  );
}
