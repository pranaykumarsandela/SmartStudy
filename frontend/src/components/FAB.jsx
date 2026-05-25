import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function FAB() {
  const { setAddSessionModalOpen } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleFabClick = () => {
    setAddSessionModalOpen(true);
    if (location.pathname !== '/schedule') {
      navigate('/schedule');
    }
  };

  return (
    <motion.button
      className="fab-button"
      onClick={handleFabClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'absolute',
        bottom: '40px',
        right: '40px',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-accent)',
        color: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        boxShadow: '0 4px 16px rgba(108, 99, 255, 0.4)',
      }}
    >
      <Plus size={32} />
    </motion.button>
  );
}
