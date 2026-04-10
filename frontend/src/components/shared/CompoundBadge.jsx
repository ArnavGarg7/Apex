// src/components/shared/CompoundBadge.jsx
import { motion } from 'framer-motion';
import { getCompoundColor, getCompoundLabel } from '@/utils/f1Colors';

export default function CompoundBadge({ compound, size = 'sm', showName = false }) {
  const color = getCompoundColor(compound);
  const label = getCompoundLabel(compound);
  const isLarge = size === 'lg';

  return (
    <motion.span
      key={compound}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1,   opacity: 1  }}
      transition={{ duration: 0.2, ease: 'backOut' }}
      title={compound}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isLarge ? 6 : 4,
        padding: isLarge ? '4px 10px' : '2px 7px',
        borderRadius: 100,
        background: color,
        color: compound === 'MEDIUM' ? '#000' : '#fff',
        fontFamily: 'Orbitron, monospace',
        fontSize: isLarge ? '0.7rem' : '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        boxShadow: `0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {label}
      {showName && compound !== 'UNKNOWN' && (
        <span style={{ opacity: 0.8 }}>{compound.charAt(0) + compound.slice(1).toLowerCase()}</span>
      )}
    </motion.span>
  );
}
