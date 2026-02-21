import { useState, useEffect } from 'react';
import PhraseButton from './PhraseButton';

export default function PhraseGrid({ items, onTap, color, pageSize, category }) {
  const [page, setPage] = useState(0);

  // Reset to first page only when category changes (not on items reference change,
  // which happens every render for dynamic categories like people/medical)
  useEffect(() => setPage(0), [category]);

  const total = Math.ceil(items.length / pageSize);
  const visible = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        gap: 5,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: `repeat(${Math.ceil(pageSize / 3)}, 1fr)`,
          gap: 6,
        }}
      >
        {visible.map((p, i) => (
          <PhraseButton
            key={page + '-' + i}
            text={p.t}
            icon={p.i}
            color={color}
            onTap={() => onTap(p)}
          />
        ))}
      </div>
      {total > 1 && (
        <nav
          role="navigation"
          aria-label="Phrase pages"
          style={{
            display: 'flex',
            gap: 6,
            flexShrink: 0,
          }}
        >
          {page > 0 && (
            <button
              onClick={() => setPage((p) => p - 1)}
              aria-label={`Previous page, page ${page} of ${total}`}
              style={{
                flex: 1,
                minHeight: 48,
                background: '#1E293B',
                border: `2px solid ${color}44`,
                borderRadius: 12,
                color: '#E2E8F0',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {'\u2190'} Back
            </button>
          )}
          <button
            onClick={() => setPage((p) => (p + 1) % total)}
            aria-label={page < total - 1 ? `Next page, page ${page + 2} of ${total}` : `Back to first page`}
            style={{
              flex: 2,
              minHeight: 48,
              background: color + '20',
              border: `2px solid ${color}66`,
              borderRadius: 12,
              color: '#E2E8F0',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {page < total - 1 ? 'More' : 'Back to start'} {'\u2192'}{' '}
            <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 400 }}>
              {page + 1}/{total}
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
