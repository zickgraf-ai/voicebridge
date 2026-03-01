import { memo, useMemo } from 'react';
import { CATEGORIES, TAB_SIZES } from '../data/phrases';

export default memo(function CategoryBar({ active, onSelect, size, categoryOrder }) {
  const s = TAB_SIZES[size] || TAB_SIZES.xl;

  const orderedCategories = useMemo(() => {
    if (!categoryOrder || categoryOrder.length === 0) return CATEGORIES;
    const catMap = {};
    for (const c of CATEGORIES) catMap[c.id] = c;
    const ordered = categoryOrder
      .filter((id) => catMap[id])
      .map((id) => catMap[id]);
    // Append any categories not in the order (safety net)
    for (const c of CATEGORIES) {
      if (!categoryOrder.includes(c.id)) ordered.push(c);
    }
    return ordered;
  }, [categoryOrder]);

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
      {orderedCategories.map((c) => (
        <button
          key={c.id}
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
