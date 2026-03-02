import { memo, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, TAB_SIZES } from '../data/phrases';

export default memo(function CategoryBar({ active, onSelect, size }) {
  const s = TAB_SIZES[size] || TAB_SIZES.xl;
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active]);

  return (
    <div
      role="tablist"
      aria-label="Phrase categories"
      style={{
        display: 'flex',
        gap: s.gap + 2,
        flexShrink: 0,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        padding: '2px 2px',
      }}
    >
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          ref={active === c.id ? activeRef : undefined}
          role="tab"
          aria-selected={active === c.id}
          onClick={() => onSelect(c.id)}
          style={{
            background: active === c.id ? c.color + '30' : '#1E293B',
            border: `2px solid ${active === c.id ? c.color : '#33415500'}`,
            borderRadius: s.radius,
            padding: s.pad,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            minWidth: s.minW,
            minHeight: s.h,
            gap: s.gap,
          }}
        >
          <span style={{ fontSize: s.icon, lineHeight: 1 }}>{c.icon}</span>
          <span
            style={{
              fontSize: s.label,
              color: active === c.id ? '#fff' : '#94A3B8',
              fontWeight: active === c.id ? 700 : 500,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {c.label}
          </span>
        </button>
      ))}
    </div>
  );
});
