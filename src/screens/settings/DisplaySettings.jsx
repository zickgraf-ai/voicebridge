import SegmentControl from '../../components/SegmentControl';
import { CATEGORIES } from '../../data/phrases';

function CategoryReorder({ categoryOrder, setCategoryOrder }) {
  const defaultOrder = CATEGORIES.map((c) => c.id);
  const order = categoryOrder && categoryOrder.length > 0 ? categoryOrder : defaultOrder;
  const catMap = {};
  for (const c of CATEGORIES) catMap[c.id] = c;

  const move = (index, direction) => {
    const newOrder = [...order];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const reset = () => setCategoryOrder(null);

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #334155',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ color: '#94A3B8', fontSize: 13 }}>
          {'\uD83D\uDCCB'} Category Order
        </div>
        {categoryOrder && categoryOrder.length > 0 && (
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '3px 8px',
              color: '#94A3B8',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {order.map((id, i) => {
          const c = catMap[id];
          if (!c) return null;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ flex: 1, color: '#E2E8F0', fontSize: 14 }}>{c.label}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${c.label} up`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  background: i === 0 ? '#1E293B' : '#334155',
                  color: i === 0 ? '#475569' : '#E2E8F0',
                  fontSize: 14,
                  cursor: i === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u2191'}
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${c.label} down`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  background: i === order.length - 1 ? '#1E293B' : '#334155',
                  color: i === order.length - 1 ? '#475569' : '#E2E8F0',
                  fontSize: 14,
                  cursor: i === order.length - 1 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u2193'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DisplaySettings({ settings, onUpdate, categoryOrder, setCategoryOrder }) {
  return (
    <>
      {/* Category Tab Size */}
      <SegmentControl
        label={'\uD83D\uDCC2 Category Tab Size'}
        value={settings.tabSize}
        onChange={(v) => onUpdate('tabSize', v)}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
          { label: 'XL', value: 'xl' },
        ]}
      />

      {/* Button Size */}
      <SegmentControl
        label={'\uD83D\uDCD0 Button Size'}
        value={settings.buttonSize}
        onChange={(v) => onUpdate('buttonSize', v)}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
        ]}
      />

      {/* Category Order */}
      <CategoryReorder
        categoryOrder={categoryOrder}
        setCategoryOrder={setCategoryOrder}
      />
    </>
  );
}
