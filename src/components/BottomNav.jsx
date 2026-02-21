const TABS = [
  { id: 'talk', icon: '\u{1F4AC}', label: 'Talk' },
  { id: 'profile', icon: '\u{1F464}', label: 'Profile' },
  { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
  { id: 'care', icon: '\u{1F4CA}', label: 'Care' },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <div
      style={{
        borderTop: '1px solid #334155',
        padding: `4px 8px calc(env(safe-area-inset-bottom, 0px) + 6px)`,
        display: 'flex',
        gap: 3,
        flexShrink: 0,
        height: 52,
        background: '#0F172A',
      }}
    >
      {TABS.map((n) => (
        <button
          key={n.id}
          onClick={() => onSelect(n.id)}
          style={{
            background: active === n.id ? '#3B82F6' : 'transparent',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flex: 1,
            color: active === n.id ? '#fff' : '#64748B',
          }}
        >
          <span style={{ fontSize: 20 }}>{n.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: active === n.id ? 600 : 400,
            }}
          >
            {n.label}
          </span>
        </button>
      ))}
    </div>
  );
}
