import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Loader2, FileText, ChevronDown, ChevronRight, BookOpen, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export default function AIPlan() {
  const { uploadSyllabus, profile, updateProfile } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const fileInputRef = useRef(null);

  const handleDeleteSubject = async (e, semesterIdx, subjectName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${subjectName}?`)) return;
    
    const newSyllabus = JSON.parse(JSON.stringify(profile.syllabus));
    newSyllabus[semesterIdx].subjects = newSyllabus[semesterIdx].subjects.filter(s => s.subject !== subjectName);
    
    if (newSyllabus[semesterIdx].subjects.length === 0) {
      newSyllabus.splice(semesterIdx, 1);
    }
    
    try {
      await updateProfile({ syllabus: newSyllabus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      await uploadSyllabus(file);
      // Wait a moment for UX
      setTimeout(() => setIsUploading(false), 800);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const toggleSubject = (subj) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subj]: !prev[subj]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1 className="page-title gradient-text-anim" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
          Syllabus Intelligence
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Upload your syllabus and let AI extract your subjects and topics.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '32px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* File Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="glass-card" 
            style={{ 
              border: '2px dashed var(--glass-border)', 
              padding: '40px', 
              textAlign: 'center', 
              cursor: isUploading ? 'wait' : 'pointer',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
            />
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 className="spinner" size={32} color="var(--primary-accent)" />
                <span style={{ color: 'var(--text-secondary)' }}>Scanning syllabus with AI...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <UploadCloud size={48} color="var(--primary-accent)" />
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Drop your Syllabus (PDF/DOCX)</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI will automatically extract subjects and study topics</div>
              </div>
            )}
          </div>

          {profile?.syllabus?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen color="var(--primary-accent)" size={20} /> Extracted Curriculum
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {profile.syllabus.map((semesterObj, sIdx) => (
                  <div key={sIdx}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>{semesterObj.semester}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {semesterObj.subjects?.map(s => {
                        const isExpanded = expandedSubjects[s.subject];
                        return (
                          <div key={s.subject} className="glass-card" style={{ overflow: 'hidden' }}>
                            <div 
                              onClick={() => toggleSubject(s.subject)}
                              style={{ 
                                padding: '16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)',
                                borderBottom: isExpanded ? '1px solid var(--glass-border)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}>
                                <FileText size={18} color="var(--primary-accent)" />
                                {s.subject}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button 
                                  onClick={(e) => handleDeleteSubject(e, sIdx, s.subject)}
                                  style={{ background: 'none', border: 'none', color: 'var(--danger-color, #ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="Remove Subject"
                                >
                                  <Trash2 size={18} />
                                </button>
                                {isExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.1)' }}>
                                {s.chapters?.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {s.chapters.map((chapter, cIdx) => (
                                      <div key={cIdx}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                          {chapter.name}
                                        </div>
                                        {chapter.topics?.length > 0 ? (
                                          <ul style={{ paddingLeft: '24px', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {chapter.topics.map((t, idx) => (
                                              <li key={idx}>{t}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '8px' }}>No specific topics.</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No chapters extracted.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
