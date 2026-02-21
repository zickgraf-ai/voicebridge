const TABS = [
  { id: 'talk', icon: '\u{1F4AC}', label: 'Talk' },
  { id: 'profile', icon: '\u{1F464}', label: 'Profile' },
  { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
  { id: 'care', icon: '\u{1F4CA}', label: 'Care' },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      style={{
        padding: `6px 8px calc(env(safe-area-inset-bottom, 0px) + 6px)`,
        display: 'flex',
        gap: 3,
        flexShrink: 0,
        background: '#1E293B',
      }}
    >
      {TABS.map((n) => {
        const isActive = active === n.id;
        return (
          <button
            key={n.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(n.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flex: 1,
              padding: '6px 0',
              color: isActive ? '#3B82F6' : '#64748B',
            }}
          >
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#3B82F6' : '#64748B',
              }}
            >
              {n.label}
            </span>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: isActive ? '#3B82F6' : 'transparent',
                marginTop: 1,
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
