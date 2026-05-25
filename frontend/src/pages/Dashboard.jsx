import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, Flame, Target, Plus, 
  Calendar, Sparkles, Code, BookOpen, PenTool, Coffee
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { formatDuration, getZonedDate, getZonedDateString } from '../lib/utils';
import api from '../lib/api';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const fadeUpVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };



export default function Dashboard() {
  const { profile, sessions, isLoading: storeLoading, setAddSessionModalOpen } = useUserStore();
  const navigate = useNavigate();
  const [dateStr, setDateStr] = useState('');
  const [quote, setQuote] = useState("The secret of getting ahead is getting started.");
  
  const handleAddSessionClick = () => {
    setAddSessionModalOpen(true);
    navigate('/schedule');
  };

  const todayDateStr = getZonedDateString(profile?.timezone);
  const todaySessions = sessions.filter(s => s.date === todayDateStr);
  
  const totalStudyTimeMinutes = todaySessions.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalStudyTimeHours = formatDuration(totalStudyTimeMinutes);

  const past7DaysSessions = sessions.filter(s => {
    const d = new Date(s.date);
    const now = getZonedDate(profile?.timezone);
    return (now - d) / (1000 * 60 * 60 * 24) <= 7 && s.is_done;
  }).length;
  const weeklyGoalPct = profile?.weekly_session_target > 0 
    ? Math.min(Math.round((past7DaysSessions / profile.weekly_session_target) * 100), 100) 
    : 0;

  const stats = [
    { label: "Today's Sessions", value: todaySessions.length.toString(), icon: BookOpen, color: '#3B82F6' },
    { label: 'Study Time', value: totalStudyTimeHours, icon: Clock, color: 'var(--primary-accent)' },
    { label: 'Active Streak', value: `${profile?.streak_count || 0} Days`, icon: Flame, color: '#F59E0B' },
    { label: 'Weekly Goal', value: `${weeklyGoalPct}%`, icon: Target, color: 'var(--success-color)' }
  ];

  const streakDays = Array.from({ length: 30 }, (_, i) => {
    const d = getZonedDate(profile?.timezone);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return sessions.some(s => s.date === dateStr && s.is_done);
  });

  useEffect(() => {
    const today = getZonedDate(profile?.timezone);
    setDateStr(today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, [profile?.timezone]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const { data } = await api.get('/ai/quote');
        if (data.quote) setQuote(data.quote);
      } catch (err) {
        console.error('Failed to fetch quote', err);
      }
    };
    fetchQuote();
  }, []);

  const getDifficultyColor = (level) => {
    switch(level) {
      case 'easy': return 'var(--success-color)';
      case 'medium': return '#F59E0B'; 
      case 'hard': return '#EF4444'; 
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Hero Section */}
      <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>
              {getZonedDate(profile?.timezone).getHours() < 12 ? 'Good morning' : getZonedDate(profile?.timezone).getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {profile?.name || 'Student'} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>Today is {dateStr}</p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {storeLoading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: '110px' }} />)
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'contents' }}>
              {stats.map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: `${stat.color}22`, padding: '16px', borderRadius: '12px', display: 'flex' }}><stat.icon size={28} color={stat.color} /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions Row */}
      <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <button onClick={handleAddSessionClick} className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Plus size={20} /> Add Session
        </button>
        <button onClick={() => window.addGlobalToast('Exporting schedule...', 'success')} className="shimmer-btn glass-card" style={{ color: 'var(--text-primary)', padding: '14px 24px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Calendar size={20} /> View Full Schedule
        </button>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        {/* Today's Schedule Preview */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Today's Schedule</h2>
          {storeLoading ? (
            <div className="timeline-scroll">
              {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card skeleton" style={{ minWidth: '280px', height: '80px', borderRadius: '100px', flexShrink: 0 }} />)}
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="float-anim" style={{ background: 'rgba(0, 229, 160, 0.1)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Coffee size={40} color="var(--success-color)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Sessions Today</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You have no upcoming sessions. Take a break or add a new one!</p>
            </div>
          ) : (
            <div className="timeline-scroll">
              {todaySessions.map((session, i) => (
                <motion.div key={session._id || i} whileHover={{ y: -4 }} className="glass-card" style={{ minWidth: '300px', padding: '16px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '50%', display: 'flex' }}><BookOpen size={20} color="var(--primary-accent)" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '2px', textDecoration: session.is_done ? 'line-through' : 'none', color: session.is_done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{session.subject}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{session.time}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${getDifficultyColor(session.difficulty)}`, color: getDifficultyColor(session.difficulty) }}>
                    {session.difficulty}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Motivational Widget */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Daily Motivation</h2>
          {storeLoading ? (
            <div className="glass-card skeleton" style={{ height: '160px' }} />
          ) : (
            <div className="glass-card gradient-border-anim" style={{ padding: '32px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', borderTopWidth: '2px', borderLeftWidth: '2px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={quote} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ fontSize: '1.2rem', fontStyle: 'italic', fontWeight: '500' }}>
                  "{quote}"
                </motion.div>
              </AnimatePresence>
              <Sparkles size={24} color="var(--success-color)" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.5 }} />
            </div>
          )}
        </motion.div>

        {/* Streak Calendar */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            30-Day Activity <Flame size={20} color="#F59E0B" />
          </h2>
          {storeLoading ? (
            <div className="glass-card skeleton" style={{ height: '220px' }} />
          ) : (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', height: '140px', alignContent: 'flex-start', flexDirection: 'column' }}>
                {streakDays.map((isCompleted, i) => <div key={i} className={`heatmap-cell ${isCompleted ? 'completed' : ''}`} title={isCompleted ? 'Goal achieved!' : 'No activity'} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Less</span><div className="heatmap-cell" /><div className="heatmap-cell completed" style={{ opacity: 0.6 }} /><div className="heatmap-cell completed" /><span>More</span>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
