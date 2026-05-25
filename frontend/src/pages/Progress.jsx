import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Clock, Target, Lock, Zap, Award, BookOpen, Star } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import confetti from 'canvas-confetti';
import { useUserStore } from '../store/userStore';
import { formatDuration } from '../lib/utils';

// --- Small UI Components --- //
const FlameParticles = () => (
  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px' }}>
    {[...Array(5)].map((_, i) => (
      <div 
        key={i} 
        className="flame-particle" 
        style={{ 
          left: `${Math.random() * 20}px`, 
          animationDelay: `${Math.random() * 2}s` 
        }} 
      />
    ))}
  </div>
);

const Sparkles = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {[...Array(4)].map((_, i) => (
      <div 
        key={i} 
        className="sparkle" 
        style={{ 
          top: `${Math.random() * 80 + 10}%`, 
          left: `${Math.random() * 80 + 10}%`, 
          animationDelay: `${Math.random() * 1.5}s` 
        }} 
      />
    ))}
  </div>
);

// --- Custom Hooks --- //
function useCounter(target) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

// --- Main Page Component --- //
export default function Progress() {
  const { sessions, profile } = useUserStore();
  const completedSessions = (sessions || []).filter(s => s.is_done);

  // Compute areaData (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const areaData = last7Days.map(dateStr => {
    const d = new Date(dateStr);
    const dayName = daysMap[d.getDay()];
    const mins = completedSessions
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + (s.duration_minutes || 60), 0);
    return { day: dayName, minutes: mins };
  });

  // Compute barData
  const colors = ['var(--primary-accent)', '#06B6D4', '#F59E0B', 'var(--success-color)', '#EF4444', '#8B5CF6'];
  const subjectMins = {};
  completedSessions.forEach(s => {
    const sub = s.subject || 'General';
    subjectMins[sub] = (subjectMins[sub] || 0) + (s.duration_minutes || 60);
  });
  const barData = Object.keys(subjectMins).map((subject, idx) => ({
    subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
    time: subjectMins[subject],
    fill: colors[idx % colors.length]
  }));
  if (barData.length === 0) barData.push({ subject: 'None', time: 0, fill: colors[0] });

  // Compute pieData
  const difficulties = { Easy: 0, Medium: 0, Hard: 0 };
  completedSessions.forEach(s => {
    if (s.difficulty && difficulties[s.difficulty] !== undefined) {
      difficulties[s.difficulty] += 1;
    } else {
      difficulties.Medium += 1;
    }
  });
  const pieData = [
    { name: 'Easy', value: difficulties.Easy, color: 'var(--success-color)' },
    { name: 'Medium', value: difficulties.Medium, color: '#F59E0B' },
    { name: 'Hard', value: difficulties.Hard, color: '#EF4444' }
  ].filter(d => d.value > 0);
  if (pieData.length === 0) pieData.push({ name: 'None', value: 1, color: '#475569' });

  const computedTotalSessions = completedSessions.length;
  const computedTotalTimeH = Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) / 60);
  const computedAvgSession = computedTotalSessions > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) / computedTotalSessions) : 0;
  const computedStreak = profile?.longest_streak || 0;

  const totalSessions = useCounter(computedTotalSessions);
  const totalStudyTime = useCounter(computedTotalTimeH);
  const avgSession = useCounter(computedAvgSession);
  const studyStreak = useCounter(computedStreak);

  const initialAchievements = [
    { id: 1, title: 'First Steps', desc: 'Complete 1st session', unlocked: computedTotalSessions >= 1, icon: Target },
    { id: 2, title: 'Night Owl', desc: 'Study past midnight', unlocked: completedSessions.some(s => { if(!s.time) return false; const h = parseInt(s.time.split(':')[0]); return h >= 0 && h < 4; }), icon: Clock },
    { id: 3, title: 'Week Warrior', desc: 'Study 7 days in a row', unlocked: computedStreak >= 7, icon: Zap },
    { id: 4, title: 'Mastermind', desc: '10 hard sessions', unlocked: completedSessions.filter(s => s.difficulty === 'Hard').length >= 10, icon: Award }
  ];

  const [achievements, setAchievements] = useState(initialAchievements);

  const unlockBadge = (id) => {
    const badge = achievements.find(a => a.id === id);
    if (!badge.unlocked) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6C63FF', '#00E5A0', '#F59E0B']
      });
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, unlocked: true } : a));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      <h1 className="page-title" style={{ marginBottom: 0 }}>Your Progress</h1>

      {/* Goals & Streaks Row */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <motion.div variants={itemVariants} className="glass-card shimmer-bg" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
          <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={32} color="#F59E0B" />
            <FlameParticles />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Streak</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{studyStreak} Days</div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card shimmer-bg" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={32} color="var(--primary-accent)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Longest Streak</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{profile?.longest_streak || 0} Days</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Today's Goal */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Today's Goal</h2>
            <div style={{ color: 'var(--text-secondary)' }}>Daily study target</div>
          </div>
          {(() => {
            const todayMins = areaData[6].minutes;
            const dailyGoal = profile?.daily_goal_minutes || 120;
            const todayProgress = Math.min((todayMins / dailyGoal) * 100, 100);
            return (
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--primary-accent)' }}>{formatDuration(todayMins)}</span> / {formatDuration(dailyGoal)}
              </div>
            );
          })()}
        </div>
        <div style={{ height: '12px', background: 'var(--glass-bg)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          {(() => {
            const todayMins = areaData[6].minutes;
            const dailyGoal = 120;
            const todayProgress = Math.min((todayMins / dailyGoal) * 100, 100);
            return (
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${todayProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                viewport={{ once: true }}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-accent), var(--success-color))', borderRadius: '6px' }}
              />
            );
          })()}
        </div>
      </motion.div>

      {/* Weekly Goals Row */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '24px' }}>
          {(() => {
            const weeklyMins = Math.round(areaData.reduce((sum, d) => sum + d.minutes, 0));
            const weeklyGoal = 600;
            const weeklyProgress = Math.min((weeklyMins / weeklyGoal) * 100, 100);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '500' }}>Weekly Time</span>
                  <span style={{ color: 'var(--primary-accent)' }}>{formatDuration(weeklyMins)} / {formatDuration(weeklyGoal)}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--glass-bg)', borderRadius: '4px' }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${weeklyProgress}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--primary-accent)', borderRadius: '4px' }} />
                </div>
              </>
            );
          })()}
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '24px' }}>
          {(() => {
            const weeklySessionsCount = completedSessions.filter(s => {
              const d = new Date(s.date);
              const now = new Date();
              return (now - d) / (1000 * 60 * 60 * 24) <= 7;
            }).length;
            const weeklySessionsGoal = 10;
            const weeklySessionsProgress = Math.min((weeklySessionsCount / weeklySessionsGoal) * 100, 100);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '500' }}>Weekly Sessions</span>
                  <span style={{ color: 'var(--success-color)' }}>{weeklySessionsCount} / {weeklySessionsGoal}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--glass-bg)', borderRadius: '4px' }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${weeklySessionsProgress}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--success-color)', borderRadius: '4px' }} />
                </div>
              </>
            );
          })()}
        </motion.div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        {[
          { l: 'Total Sessions', v: totalSessions, i: BookOpen },
          { l: 'Study Time (h)', v: totalStudyTime, i: Clock },
          { l: 'Avg Session (m)', v: avgSession, i: Target },
          { l: 'Best Streak', v: studyStreak, i: Zap }
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <s.i size={24} color="var(--primary-accent)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{s.v}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.l}</div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* Daily Study Activity Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '24px' }}>Daily Study Activity</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" stroke="var(--primary-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study Time By Subject */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Time by Subject</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="subject" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--glass-bg)'}} />
                <Bar dataKey="time" radius={[6, 6, 0, 0]} animationDuration={1500} animationEasing="ease-out">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Session Difficulty */}
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>Difficulty Breakdown</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Medium</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dominant</div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ transition: 'transform 0.2s', cursor: 'pointer', outline: 'none' }} onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.transformOrigin = 'center';
                    }} onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '24px' }}>Achievements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {achievements.map((badge) => (
              <div 
                key={badge.id}
                onClick={() => unlockBadge(badge.id)}
                className="glass-card"
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  cursor: badge.unlocked ? 'default' : 'pointer',
                  filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                  opacity: badge.unlocked ? 1 : 0.6,
                  border: badge.unlocked ? '1px solid rgba(108, 99, 255, 0.4)' : '1px solid var(--glass-border)',
                  boxShadow: badge.unlocked ? '0 0 15px rgba(108, 99, 255, 0.2)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {badge.unlocked && <Sparkles />}
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%', marginBottom: '16px',
                  background: badge.unlocked ? 'linear-gradient(135deg, var(--primary-accent), var(--success-color))' : 'var(--glass-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {badge.unlocked ? <badge.icon size={28} color="#fff" /> : <Lock size={28} color="var(--text-secondary)" />}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{badge.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{badge.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
