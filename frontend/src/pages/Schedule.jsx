import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2, Edit2 } from 'lucide-react';
import { DndContext, useDroppable, useDraggable, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useUserStore } from '../store/userStore';
import { formatDuration, getZonedDate, getZonedDateString } from '../lib/utils';

const subjectColors = {
  Mathematics: '#6C63FF',
  Physics: '#38bdf8',
  History: '#fb923c',
  Science: '#34d399',
  English: '#a78bfa',
  Chemistry: '#f472b6',
  Biology: '#4ade80',
  ComputerScience: '#60a5fa',
  Default: '#6C63FF'
};

function DroppableColumn({ dayIdx, isToday, isPast, dateLabel, dateString, openAddModalForDate, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dayIdx}` });
  
  return (
    <div 
      ref={setNodeRef}
      className="timeline-column"
      style={{
        backgroundColor: isOver ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
      }}
    >
      <div className="timeline-header">
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIdx]}
        </div>
        <div style={{ position: 'relative', display: 'inline-block', marginTop: '4px' }}>
          {isToday && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', zIndex: -1 }} />
          )}
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: isToday ? '#fff' : 'var(--text-primary)' }}>
            {dateLabel}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
        {React.Children.count(children) === 0 && !isPast && (
          <div className="empty-day-box" onClick={() => openAddModalForDate(dateString)}>
            <Plus size={20} style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{ fontSize: '0.85rem' }}>Add session</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ session, toggleComplete, editSession, deleteSession, index }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session._id,
    data: session
  });
  
  const { profile } = useUserStore();
  const customSub = profile?.custom_subjects?.find(s => s.name === session.subject);
  const accentColor = customSub?.color || subjectColors[session.subject] || subjectColors.Default;
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `3px solid ${accentColor}`,
    padding: '12px',
    backgroundColor: 'var(--bg-color)',
    cursor: 'grab',
    zIndex: isDragging ? 100 : 1
  };

  const getDiffColor = (d) => {
    if (d === 'hard' || d === 'Hard') return '#EF4444';
    if (d === 'medium' || d === 'Medium') return '#F59E0B';
    return 'var(--success-color)';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={`glass-card timeline-card ${session.is_done ? 'completed' : ''}`}
      onDoubleClick={() => editSession(session)}
    >
      <div className="card-actions">
        <div style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); editSession(session); }}><Edit2 size={14} /></div>
        <div style={{ cursor: 'pointer', color: 'var(--success-color)' }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleComplete(session._id, session.is_done); }}>✔️</div>
        <div style={{ cursor: 'pointer', color: '#EF4444' }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); deleteSession(session._id); }}><Trash2 size={14} /></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', paddingRight: '20px' }}>
        <div className="card-subject line-clamp-2" style={{ fontWeight: '700', fontSize: '13px', color: session.is_done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: session.is_done ? 'line-through' : 'none' }}>
          {session.subject}
        </div>
        <div className="line-clamp-2" style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: session.is_done ? 'line-through' : 'none' }}>
          {session.topic || 'No specific topic'}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {session.time} <span style={{ opacity: 0.7 }}>({formatDuration(session.duration_minutes || 60)})</span>
        </div>
        <div style={{ 
          fontSize: '9px', padding: '2px 6px', borderRadius: '4px', 
          border: `1px solid ${getDiffColor(session.difficulty)}`, 
          color: getDiffColor(session.difficulty), textTransform: 'uppercase', fontWeight: 'bold'
        }}>
          {session.difficulty}
        </div>
      </div>
    </motion.div>
  );
}

// Counter Hook
function useCounter(target) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
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

export default function Schedule() {
  const { isAddSessionModalOpen, setAddSessionModalOpen, addSession, updateSession, deleteSession, sessions, profile, updateProfile } = useUserStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [editingSessionId, setEditingSessionId] = useState(null);
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMobileDay, setActiveMobileDay] = useState(getZonedDate(profile?.timezone).getDay());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form state
  const defaultSemester = profile?.syllabus?.length > 0 ? profile.syllabus[0].semester : '';
  const defaultSubject = profile?.syllabus?.length > 0 && profile.syllabus[0].subjects?.length > 0 ? profile.syllabus[0].subjects[0].subject : 'General';
  const [formData, setFormData] = useState({
    title: '',
    semester: defaultSemester,
    subject: defaultSubject,
    isCustomSubject: false,
    customSubjectColor: '#6C63FF',
    chapter: '',
    topic: '',
    date: getZonedDateString(profile?.timezone),
    time: '12:00',
    duration_minutes: 60,
    difficulty: 'Medium',
    notes: ''
  });

  const handleSaveSession = async () => {
    try {
      if (formData.isCustomSubject && formData.subject) {
        const newCustom = { name: formData.subject, color: formData.customSubjectColor };
        const existing = profile?.custom_subjects || [];
        if (!existing.find(s => s.name === formData.subject)) {
          await updateProfile({ custom_subjects: [...existing, newCustom] });
        }
      }

      if (editingSessionId) {
        await updateSession(editingSessionId, { ...formData });
      } else {
        await addSession({ ...formData });
      }
      
      setAddSessionModalOpen(false);
      setEditingSessionId(null);
      setFormData({ title: '', semester: defaultSemester, subject: defaultSubject, isCustomSubject: false, customSubjectColor: '#6C63FF', chapter: '', topic: '', date: getZonedDateString(profile?.timezone), time: '12:00', duration_minutes: 60, difficulty: 'Medium', notes: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModalForDate = (dateString) => {
    setFormData(prev => ({ ...prev, date: dateString }));
    setEditingSessionId(null);
    setAddSessionModalOpen(true);
  };

  const editSession = (session) => {
    setEditingSessionId(session._id);
    setFormData({
      semester: session.semester || '',
      subject: session.subject,
      chapter: session.chapter || '',
      topic: session.topic || '',
      date: session.date,
      time: session.time,
      duration_minutes: session.duration_minutes || 60,
      difficulty: session.difficulty || 'Medium',
      notes: session.notes || ''
    });
    setAddSessionModalOpen(true);
  };

  const today = getZonedDate(profile?.timezone);
  const currentDayOfWeek = today.getDay();
  
  const getWeekDates = (offset) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = getZonedDate(profile?.timezone);
      date.setDate(today.getDate() - currentDayOfWeek + i + (offset * 7));
      dates.push(date);
    }
    return dates;
  };
  
  const weekDates = getWeekDates(weekOffset);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const dayId = parseInt(over.id.split('-')[1]);
    const targetDate = weekDates[dayId];

    const today = getZonedDate(profile?.timezone);
    today.setHours(0, 0, 0, 0);
    const dropDate = getZonedDate(profile?.timezone);
    dropDate.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    dropDate.setHours(0, 0, 0, 0);
    
    if (dropDate < today) {
      if (window.addGlobalToast) window.addGlobalToast('Cannot move session to a past date', 'error');
      return;
    }

    const newDateString = targetDate.getFullYear() + '-' + String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + String(targetDate.getDate()).padStart(2, '0');
    
    try {
      await updateSession(active.id, { date: newDateString });
    } catch (error) {
      console.error("Failed to move session", error);
    }
  };

  const toggleComplete = async (id, currentIsDone) => {
    try {
      await updateSession(id, { is_done: !currentIsDone });
    } catch (error) {
      console.error("Failed to toggle completion", error);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const changeWeek = (dir) => {
    setDirection(dir);
    setWeekOffset(prev => prev + dir);
    if (isMobile) {
      setActiveMobileDay(dir > 0 ? 0 : 6);
    }
  };

  const jumpToToday = () => {
    setWeekOffset(0);
    setActiveMobileDay(currentDayOfWeek);
  };

  // Stats for Weekly Summary
  const stats = {
    completed: useCounter((sessions || []).filter(s => s.is_done).length),
    totalTime: useCounter((sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / 60), 
    subjects: useCounter(new Set((sessions || []).map(s => s.subject)).size),
    activeDays: useCounter(new Set((sessions || []).map(s => s.date)).size)
  };
  
  // Mobile touch handlers
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].clientX; };
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeMobileDay < 6) setActiveMobileDay(prev => prev + 1); // swipe left
      else if (diff < 0 && activeMobileDay > 0) setActiveMobileDay(prev => prev - 1); // swipe right
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Study Schedule</h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isMobile && (weekOffset !== 0 || activeMobileDay !== currentDayOfWeek) && (
            <button onClick={jumpToToday} className="glass-card" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)' }}>
              Jump to Today
            </button>
          )}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '8px', cursor: 'pointer' }} onClick={() => changeWeek(-1)}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ padding: '0 16px', fontWeight: 'bold' }}>
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '8px', cursor: 'pointer' }} onClick={() => changeWeek(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="shimmer-btn" onClick={() => { setEditingSessionId(null); setAddSessionModalOpen(true); }} style={{ 
            background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}>
            <Plus size={20} /> Add Session
          </button>
        </div>
      </div>

      {/* Week Timeline Container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={weekOffset}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div 
                className="timeline-container" 
                onTouchStart={isMobile ? handleTouchStart : undefined}
                onTouchEnd={isMobile ? handleTouchEnd : undefined}
              >
                {weekDates.map((date, idx) => {
                  const isToday = weekOffset === 0 && idx === currentDayOfWeek;
                  const targetDateString = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                  const daySessions = (sessions || []).filter(s => s.date === targetDateString);
                  
                  const todayStr = getZonedDateString(profile?.timezone);
                  const isPast = targetDateString < todayStr;

                  // Mobile active day filtering
                  if (isMobile && idx !== activeMobileDay) return null;

                  return (
                    <DroppableColumn 
                      key={idx} 
                      dayIdx={idx} 
                      isToday={isToday} 
                      isPast={isPast}
                      dateLabel={date.getDate()} 
                      dateString={targetDateString}
                      openAddModalForDate={openAddModalForDate}
                    >
                      {daySessions.map((session, sIdx) => (
                        <DraggableCard 
                          key={session._id} 
                          session={session} 
                          index={sIdx}
                          toggleComplete={toggleComplete} 
                          editSession={editSession} 
                          deleteSession={handleDeleteSession} 
                        />
                      ))}
                    </DroppableColumn>
                  );
                })}
              </div>
            </DndContext>
          </motion.div>
        </AnimatePresence>
      </div>

      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {[0,1,2,3,4,5,6].map(d => (
            <div key={d} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d === activeMobileDay ? 'var(--primary-accent)' : 'var(--glass-border)' }} />
          ))}
        </div>
      )}

      {/* Weekly Summary Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ marginTop: '24px', padding: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: 'var(--success-color)' }}>{stats.completed}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sessions Completed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: 'var(--primary-accent)' }}>{stats.totalTime}h</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Study Time</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#06B6D4' }}>{stats.subjects}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Subjects</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#F59E0B' }}>{stats.activeDays}/7</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Days</div>
        </div>
      </motion.div>

      {/* Add Session Modal */}
      <AnimatePresence>
        {isAddSessionModalOpen && (
          <div className="modal-backdrop" onClick={() => setAddSessionModalOpen(false)}>
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="modal-card"
              style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}
            >
              <button style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setAddSessionModalOpen(false)}>
                <X size={24} />
              </button>
              
              <h2 style={{ margin: '0 0 16px 0' }}>{editingSessionId ? 'Edit Session' : 'Add New Session'}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Title */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Study Session 1" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                </div>

                {/* Semester & Subject Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: profile?.syllabus?.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>
                  {profile?.syllabus?.length > 0 && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Semester</label>
                      <select 
                        value={formData.semester} 
                        onChange={e => {
                          const newSem = e.target.value;
                          const semObj = profile.syllabus.find(s => s.semester === newSem);
                          const firstSubj = semObj?.subjects?.length > 0 ? semObj.subjects[0].subject : '';
                          setFormData({...formData, semester: newSem, subject: firstSubj, chapter: '', topic: '', isCustomSubject: false});
                        }} 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                      >
                        {profile.syllabus.map(s => (
                          <option key={s.semester} value={s.semester}>{s.semester}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subject</label>
                    <select 
                      value={formData.isCustomSubject ? 'custom' : formData.subject} 
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setFormData({...formData, isCustomSubject: true, subject: '', chapter: '', topic: ''});
                        } else {
                          setFormData({...formData, isCustomSubject: false, subject: e.target.value, chapter: '', topic: ''});
                        }
                      }} 
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', marginBottom: formData.isCustomSubject ? '8px' : '0' }}
                    >
                      <option value="">Select a subject...</option>
                      {(() => {
                        const selectedSemester = profile?.syllabus?.find(s => s.semester === formData.semester);
                        if (selectedSemester?.subjects?.length > 0) {
                          return (
                            <optgroup label="Syllabus Subjects">
                              {selectedSemester.subjects.map(s => (
                                <option key={s.subject} value={s.subject}>{s.subject}</option>
                              ))}
                            </optgroup>
                          );
                        }
                        return null;
                      })()}
                      {profile?.custom_subjects?.length > 0 && (
                        <optgroup label="Custom Subjects">
                          {profile.custom_subjects.map((sub, i) => (
                            <option key={`cus-${i}`} value={sub.name}>{sub.name}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="custom">+ Add Custom Subject...</option>
                    </select>

                    {formData.isCustomSubject && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          value={formData.subject} 
                          onChange={e => setFormData({...formData, subject: e.target.value})} 
                          placeholder="Subject Name" 
                          style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} 
                        />
                        <input 
                          type="color" 
                          value={formData.customSubjectColor} 
                          onChange={e => setFormData({...formData, customSubjectColor: e.target.value})}
                          style={{ width: '50px', padding: '2px', height: '46px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapter & Topic Selection */}
                {(() => {
                  const selectedSemester = profile?.syllabus?.find(s => s.semester === formData.semester);
                  const selectedSyllabus = selectedSemester?.subjects?.find(s => s.subject === formData.subject);
                  
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Unit / Chapter</label>
                        {selectedSyllabus?.chapters?.length > 0 ? (
                          <>
                            <input 
                              list="chapter-options" 
                              value={formData.chapter} 
                              onChange={e => setFormData({...formData, chapter: e.target.value, topic: ''})} 
                              placeholder="Select or type custom unit..."
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                            />
                            <datalist id="chapter-options">
                              {selectedSyllabus.chapters.map(c => (
                                <option key={c.name} value={c.name} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <input 
                            type="text" 
                            value={formData.chapter} 
                            onChange={e => setFormData({...formData, chapter: e.target.value, topic: ''})} 
                            placeholder="e.g. Unit 1" 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} 
                          />
                        )}
                      </div>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Topic</label>
                          <span style={{ fontSize: '0.8rem', color: formData.topic.length > 100 ? '#ef4444' : 'var(--text-secondary)' }}>{formData.topic.length}/100</span>
                        </div>
                        {(() => {
                          const selectedChapter = selectedSyllabus?.chapters?.find(c => c.name === formData.chapter);
                          if (selectedChapter?.topics?.length > 0) {
                            return (
                              <>
                                <input 
                                  list="topic-options" 
                                  value={formData.topic} 
                                  onChange={e => setFormData({...formData, topic: e.target.value.substring(0, 100)})} 
                                  placeholder="Select or type custom topic..."
                                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                                />
                                <datalist id="topic-options">
                                  {selectedChapter.topics.map(t => (
                                    <option key={t} value={t} />
                                  ))}
                                </datalist>
                              </>
                            );
                          }
                          return (
                            <div style={{ position: 'relative' }}>
                              <input 
                                list="custom-topic-suggestions"
                                value={formData.topic} 
                                onChange={e => setFormData({...formData, topic: e.target.value.substring(0, 100)})} 
                                placeholder="What are you studying?" 
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} 
                              />
                              <datalist id="custom-topic-suggestions">
                                {Array.from(new Set(sessions.filter(s => s.subject === formData.subject && s.topic).map(s => s.topic))).map((t, i) => (
                                  <option key={i} value={t} />
                                ))}
                              </datalist>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* Date & Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date</label>
                    <input type="date" value={formData.date} min={getZonedDateString(profile?.timezone)} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time</label>
                    <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                  </div>
                </div>

                {/* Duration & Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Duration</label>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formatDuration(formData.duration_minutes)}</span>
                    </div>
                    <input type="range" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} min="15" max="240" step="15" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Difficulty</label>
                    <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>
                
                <button onClick={handleSaveSession} className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer' }}>
                  {editingSessionId ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
