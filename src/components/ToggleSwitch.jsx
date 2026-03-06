export default function ToggleSwitch({ checked, onChange, ariaLabel, color }) {
  const activeColor = color || '#10B981';
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange();
        }
      }}
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        cursor: 'pointer',
        background: checked ? activeColor : '#475569',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: checked ? 26 : 2,
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}
