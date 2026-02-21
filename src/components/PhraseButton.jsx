import { useState, useEffect, memo } from 'react';

export default memo(function PhraseButton({ text, icon, onTap, color }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(false), 200);
    return () => clearTimeout(timer);
  }, [flash]);

  const handleTap = () => {
    setFlash(true);
    onTap();
  };

  return (
    <button
      onClick={handleTap}
      aria-label={text}
      style={{
        background: flash
          ? 'linear-gradient(135deg, #10B981, #059669)'
          : 'linear-gradient(135deg, #1E293B, #334155)',
        border: `2px solid ${flash ? '#10B981' : color || '#475569'}`,
        borderRadius: 14,
        padding: '6px 4px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        transition: 'all 0.15s',
        transform: flash ? 'scale(0.95)' : 'scale(1)',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
      <span
        style={{
          fontSize: 14,
          color: '#E2E8F0',
          fontWeight: 500,
          textAlign: 'center',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
          padding: '0 3px',
        }}
      >
        {text}
      </span>
    </button>
  );
});
