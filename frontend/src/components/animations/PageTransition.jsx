// src/components/animations/PageTransition.jsx
import { motion } from 'framer-motion';
import { reducedMotion } from '@/utils/motionPrefs';

const variants = reducedMotion
  ? { initial: {}, animate: {}, exit: {} }
  : {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      exit:    { opacity: 0, y: -10, transition: { duration: 0.25, ease: 'easeIn' } },
    };

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
