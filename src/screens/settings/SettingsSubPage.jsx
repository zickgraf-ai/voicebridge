export default function SettingsSubPage({ title, onBack, locked, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to settings"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#3B82F6',
            fontSize: 22,
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {'\u2039'}
        </button>
        <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 20, flex: 1 }}>
          {title}
        </h2>
      </div>
      <div
        data-testid="subpage-content"
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          ...(locked ? { opacity: 0.5, pointerEvents: 'none' } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
