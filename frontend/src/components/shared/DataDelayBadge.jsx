// src/components/shared/DataDelayBadge.jsx
export default function DataDelayBadge() {
  return (
    <span
      className="badge badge-delay"
      title="Live data is delayed by approximately 30 seconds per F1 regulations"
      aria-label="Data delayed approximately 30 seconds"
    >
      ~30s delayed
    </span>
  );
}
