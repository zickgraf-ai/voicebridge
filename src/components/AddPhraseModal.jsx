import { useState } from 'react';

const EMOJI_OPTIONS = [
  '\u2B50', '\u2764\uFE0F', '\u{1F44D}', '\u{1F44B}', '\u{1F64F}',
  '\u{1F4AC}', '\u{1F4A1}', '\u{1F3E0}', '\u{1F4DE}', '\u{1F4A7}',
  '\u{1F35C}', '\u{1F48A}', '\u{1F6BB}', '\u{1F6CF}\uFE0F', '\u{1F4FA}',
  '\u{1F3B5}', '\u{1F4D6}', '\u270B', '\u{1F60A}', '\u{1F622}',
  '\u{1F62E}', '\u{1F914}', '\u{1F917}', '\u{1F634}',
];

export default function AddPhraseModal({ onAdd, onClose }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('\u2B50');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({ t: trimmed, i: emoji });
    onClose();
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
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#1E293B',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: '0 0 12px', fontSize: 18 }}>
          {'\u2795'} Add Custom Phrase
        </h3>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your phrase..."
          autoFocus
          maxLength={100}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '2px solid #334155',
            background: '#0F172A',
            color: '#E2E8F0',
            fontSize: 16,
            outline: 'none',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />

        {/* Emoji picker */}
        <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
          Choose an icon:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: emoji === e ? '2px solid #F97316' : '2px solid #33415500',
                background: emoji === e ? '#F9731622' : '#0F172A',
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Preview */}
        {text.trim() && (
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #F9731644',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 24 }}>{emoji}</span>
            <span style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 500 }}>
              {text.trim()}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: 10,
              color: '#94A3B8',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            style={{
              flex: 1,
              background: text.trim()
                ? 'linear-gradient(135deg, #F97316, #EA580C)'
                : '#475569',
              border: 'none',
              borderRadius: 10,
              padding: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'default',
              opacity: text.trim() ? 1 : 0.5,
            }}
          >
            Add Phrase
          </button>
        </div>
      </div>
    </div>
  );
}
