import { useState, useEffect } from 'react';
import PhraseButton from './PhraseButton';

export default function PhraseGrid({ items, onTap, color, pageSize }) {
  const [page, setPage] = useState(0);

  // Reset to first page when items change
  useEffect(() => setPage(0), [items]);

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            height: 26,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              background: 'none',
              border: 'none',
              color: page === 0 ? '#334155' : '#94A3B8',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 12px',
            }}
          >
            {'\u2039'}
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: i === page ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === page ? color : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
            disabled={page === total - 1}
            style={{
              background: 'none',
              border: 'none',
              color: page === total - 1 ? '#334155' : '#94A3B8',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 12px',
            }}
          >
            {'\u203A'}
          </button>
        </div>
      )}
    </div>
  );
}
