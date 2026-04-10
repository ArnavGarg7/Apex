import { useRef, useState } from 'react';

/**
 * MagneticWrapper adds a physical "magnetic" pull effect to its children
 * based on mouse position.
 */
export default function MagneticWrapper({ children, strength = 0.5 }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 ? 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        display: 'inline-block',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
}
