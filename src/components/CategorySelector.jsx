import { CATEGORIES } from '../data/phrases';
import { ALL_CATEGORY_IDS } from '../context/AppContext';
import ToggleSwitch from './ToggleSwitch';

const CATEGORY_DESCRIPTIONS = {
  smart: 'AI-powered suggestions based on time and context',
  mine: 'Your custom saved phrases',
  build: 'Build sentences word by word',
  quick: 'Yes, no, please, thank you, and more',
  medical: 'Pain, medications, and medical needs',
  food: 'Food, drinks, and nutrition requests',
  comfort: 'Temperature, positioning, and comfort requests',
  people: 'Call family members, ask where they are',
  emotions: 'Express how you feel emotionally',
  prose: 'Speak longer paragraphs and stories',
};

export default function CategorySelector({ enabledCategories, onUpdate, onClose }) {
  const catMap = {};
  for (const c of CATEGORIES) catMap[c.id] = c;

  const active = CATEGORIES.filter((c) => enabledCategories.includes(c.id));
  const hidden = CATEGORIES.filter((c) => !enabledCategories.includes(c.id));

  const toggle = (id) => {
    if (enabledCategories.includes(id)) {
      onUpdate(enabledCategories.filter((cid) => cid !== id));
    } else {
      onUpdate([...enabledCategories, id]);
    }
  };

  const enableAll = () => {
    onUpdate(ALL_CATEGORY_IDS);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ color: '#F1F5F9', margin: 0, fontSize: 18 }}>Categories</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {hidden.length > 0 && (
              <button
                onClick={enableAll}
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Enable All
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 12px',
                color: '#E2E8F0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>

        {/* Active categories */}
        <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Active
        </div>
        {active.map((c) => (
          <div
            key={c.id}
            data-testid={`category-row-${c.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              borderBottom: '1px solid #1E293B',
            }}
          >
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>{c.label}</div>
              <div style={{ color: '#64748B', fontSize: 11 }}>{CATEGORY_DESCRIPTIONS[c.id]}</div>
            </div>
            <ToggleSwitch
              checked={true}
              onChange={() => toggle(c.id)}
              ariaLabel={`Toggle ${c.label} category`}
            />
          </div>
        ))}

        {/* Hidden categories */}
        {hidden.length > 0 && (
          <>
            <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              More Categories
            </div>
            {hidden.map((c) => (
              <div
                key={c.id}
                data-testid={`category-row-${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: '1px solid #1E293B',
                }}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>{c.label}</div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>{CATEGORY_DESCRIPTIONS[c.id]}</div>
                </div>
                <ToggleSwitch
                  checked={false}
                  onChange={() => toggle(c.id)}
                  ariaLabel={`Toggle ${c.label} category`}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
