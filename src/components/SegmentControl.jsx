export default function SegmentControl({ label, options, value, onChange }) {
  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #334155',
      }}
    >
      <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {options.map((o) => (
          <button
            key={o.label}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: value === o.value ? '#3B82F6' : '#0F172A',
              color: value === o.value ? '#fff' : '#94A3B8',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
