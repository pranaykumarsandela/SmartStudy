import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useUserStore();
  
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score++;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPass);
  const strengthColors = ['#EF4444', '#F59E0B', '#06B6D4', '#00E5A0'];

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(token, newPass);
      window.addGlobalToast && window.addGlobalToast('Password reset successfully!', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs */}
      <div className="auth-orb" style={{ width: '400px', height: '400px', background: 'var(--primary-accent)', top: '10%', left: '10%' }} />
      <div className="auth-orb" style={{ width: '300px', height: '300px', background: 'var(--success-color)', bottom: '20%', right: '15%', animationDelay: '-10s' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 1, margin: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-heading)' }}>Reset Password</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your new password below.</p>
        </div>

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} className="auth-input-icon" />
            <input type={showPass ? 'text' : 'password'} placeholder="New Password" value={newPass} onChange={e => {setNewPass(e.target.value); setError('');}} className="auth-input" />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {/* Password Strength */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map(level => (
              <div key={level} style={{ flex: 1, height: '4px', borderRadius: '2px', background: newPass.length > 0 && strength >= level ? strengthColors[strength - 1] : 'var(--glass-border)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} className="auth-input-icon" />
            <input type="password" placeholder="Confirm Password" value={confirmPass} onChange={e => {setConfirmPass(e.target.value); setError('');}} className="auth-input" />
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
