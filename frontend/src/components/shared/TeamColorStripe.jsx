// src/components/shared/TeamColorStripe.jsx
import { getTeamColor } from '@/utils/f1Colors';

export default function TeamColorStripe({ teamName, width = 3, height = '100%' }) {
  const color = getTeamColor(teamName);
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        background: color,
        borderRadius: 2,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}50`,
      }}
    />
  );
}
