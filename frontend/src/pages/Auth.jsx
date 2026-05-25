import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight, Eye, EyeOff, Zap, Sparkles } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { formatDuration } from '../lib/utils';
import confetti from 'canvas-confetti';
import { GoogleLogin } from '@react-oauth/google';

export default function Auth({ initialTab = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, loginWithGoogle, forgotPassword } = useUserStore();
  const [tab, setTab] = useState(initialTab); // 'login' or 'register'
  
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPass, setForgotPass] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regGoal, setRegGoal] = useState(120);
  const [regTos, setRegTos] = useState(false);
  const [regError, setRegError] = useState('');

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score++;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(regPass);
  const strengthColors = ['#EF4444', '#F59E0B', '#06B6D4', '#00E5A0'];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 400);
      return;
    }
    try {
      await login(loginEmail, loginPass);
      window.addGlobalToast && window.addGlobalToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (!window.addGlobalToast) window.alert(err.message);
      setLoginError(true);
      setTimeout(() => setLoginError(false), 400);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass || regPass !== regConfirm || !regTos) {
      setRegError('shake');
      setTimeout(() => setRegError(''), 400);
      return;
    }
    try {
      await register({ name: regName, email: regEmail, password: regPass, daily_goal_minutes: regGoal });
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      if (!window.addGlobalToast) window.alert(err.message);
      setRegError('shake');
      setTimeout(() => setRegError(''), 400);
    }
  };
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      window.addGlobalToast && window.addGlobalToast('Welcome!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (!window.addGlobalToast) window.alert(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      window.addGlobalToast && window.addGlobalToast('Please enter your email', 'warning');
      return;
    }
    try {
      const res = await forgotPassword(resetEmail);
      if (res && res.simulatedLink) {
        window.alert(`Since email sending is not configured (SMTP), here is your simulated password reset link:\n\n${res.simulatedLink}`);
      } else {
        window.addGlobalToast && window.addGlobalToast('If the email exists, a reset link was sent to it.', 'success');
      }
      setForgotPass(false);
    } catch(err) {
      if (!window.addGlobalToast) window.alert('Failed to send reset link');
    }
  };
  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs */}
      <div className="auth-orb" style={{ width: '400px', height: '400px', background: 'var(--primary-accent)', top: '10%', left: '10%' }} />
      <div className="auth-orb" style={{ width: '300px', height: '300px', background: 'var(--success-color)', bottom: '20%', right: '15%', animationDelay: '-10s' }} />
      <div className="auth-orb" style={{ width: '250px', height: '250px', background: '#06B6D4', top: '40%', left: '50%', animationDelay: '-5s' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 1, margin: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>StudySmart</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Your AI-powered study companion</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', position: 'relative', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px', marginBottom: '32px' }}>
          <div className="auth-tab-indicator" style={{ width: 'calc(50% - 4px)', left: tab === 'login' ? '4px' : '50%' }} />
          <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: tab === 'login' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', zIndex: 1, cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => navigate('/register')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: tab === 'register' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', zIndex: 1, cursor: 'pointer' }}>Sign Up</button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} className="auth-input-icon" />
                <input type="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={`auth-input ${loginError ? 'error-shake' : ''}`} />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="auth-input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className={`auth-input ${loginError ? 'error-shake' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember me
                </label>
                <button type="button" onClick={() => setForgotPass(!forgotPass)} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer' }}>Forgot password?</button>
              </div>

              <AnimatePresence>
                {forgotPass && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input type="email" placeholder="Reset email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="auth-input" style={{ paddingLeft: '12px' }} />
                      <button type="button" onClick={handleForgotPassword} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                Sign In
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    window.addGlobalToast && window.addGlobalToast('Google login failed', 'error');
                  }}
                  theme="filled_black"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </motion.form>
          ) : (
            <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ position: 'relative' }}>
                <User size={18} className="auth-input-icon" />
                <input type="text" placeholder="Full name" value={regName} onChange={e => setRegName(e.target.value)} className={`auth-input ${regError ? 'error-shake' : ''}`} />
              </div>
              <div style={{ position: 'relative' }}>
                <Mail size={18} className="auth-input-icon" />
                <input type="email" placeholder="Email address" value={regEmail} onChange={e => setRegEmail(e.target.value)} className={`auth-input ${regError ? 'error-shake' : ''}`} />
              </div>
              
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="auth-input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={regPass} onChange={e => setRegPass(e.target.value)} className={`auth-input ${regError && regPass !== regConfirm ? 'error-shake' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4].map(level => (
                  <div key={level} style={{ flex: 1, height: '4px', borderRadius: '2px', background: regPass.length > 0 && strength >= level ? strengthColors[strength - 1] : 'var(--glass-border)', transition: 'background 0.3s' }} />
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} className="auth-input-icon" />
                <input type="password" placeholder="Confirm password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className={`auth-input ${regError && regPass !== regConfirm ? 'error-shake' : ''}`} />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Daily Study Goal</span>
                  <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>{formatDuration(parseInt(regGoal))}</span>
                </label>
                <input type="range" min="30" max="300" step="15" value={regGoal} onChange={e => setRegGoal(e.target.value)} style={{ width: '100%' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <input type="checkbox" checked={regTos} onChange={e => setRegTos(e.target.checked)} />
                <span>I agree to the <a href="#" style={{ color: 'var(--primary-accent)', textDecoration: 'none' }}>Terms of Service</a></span>
              </label>

              <button type="submit" className="shimmer-btn" style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Create Account <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    window.addGlobalToast && window.addGlobalToast('Google login failed', 'error');
                  }}
                  theme="filled_black"
                  shape="rectangular"
                  width="100%"
                  text="signup_with"
                />
              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
