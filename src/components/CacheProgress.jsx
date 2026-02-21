/**
 * Subtle non-blocking download progress indicator for voice caching.
 * Shows as a small bar at the top when downloading.
 */
export default function CacheProgress({ cached, total, loading }) {
  if (!loading || total === 0) return null;

  const pct = Math.round((cached / total) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '4px 12px',
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#94A3B8',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: '#334155',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: pct + '%',
              background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
      <span>
        Downloading voice... {cached}/{total}
      </span>
    </div>
  );
}
