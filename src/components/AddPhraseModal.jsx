import { useState, useRef, useEffect } from 'react';

const EMOJI_PICKS = [
  '\u2B50', '\u2764\uFE0F', '\u{1F44D}', '\u{1F44B}', '\u{1F4AC}', '\u{1F4A1}',
  '\u{1F64F}', '\u{1F3E0}', '\u{1F697}', '\u{1F4DE}', '\u{1F4A7}', '\u{1F37D}\uFE0F',
  '\u{1F48A}', '\u{1F6BB}', '\u{1F634}', '\u{1F60A}', '\u{1F622}', '\u{1F628}',
  '\u{1F4AA}', '\u{1F3E5}', '\u{1F6D2}', '\u2753', '\u26A0\uFE0F', '\u{1F514}',
  '\u270B', '\u{1F44C}', '\u274C', '\u2705', '\u{1F525}', '\u{1F4F1}',
];

export default function AddPhraseModal({ open, onClose, onSave }) {
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('\u2B50');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
    if (open) {
      setText('');
      setIcon('\u2B50');
    }
  }, [open]);

  if (!open) return null;

  const canSave = text.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ t: text.trim(), i: icon });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Add custom phrase"
      aria-modal="true"
      onClick={onClose}
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
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1E293B',
          border: '2px solid #F97316',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: 0, fontSize: 18, fontWeight: 600 }}>
          {'\u2795'} New Phrase Button
        </h3>

        {/* Text input */}
        <div>
          <label
            htmlFor="phrase-text"
            style={{ color: '#94A3B8', fontSize: 13, display: 'block', marginBottom: 6 }}
          >
            Phrase text
          </label>
          <input
            id="phrase-text"
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="e.g. I need a tissue"
            maxLength={60}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '2px solid #334155',
              background: '#0F172A',
              color: '#E2E8F0',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Emoji picker */}
        <div>
          <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 6 }}>
            Choose an icon
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {EMOJI_PICKS.map((e) => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                aria-label={`Select icon ${e}`}
                aria-pressed={icon === e}
                style={{
                  width: 44,
                  height: 44,
                  fontSize: 22,
                  background: icon === e ? '#F9731633' : '#0F172A',
                  border: `2px solid ${icon === e ? '#F97316' : '#334155'}`,
                  borderRadius: 10,
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
        </div>

        {/* Preview */}
        {canSave && (
          <div style={{ color: '#94A3B8', fontSize: 13 }}>
            Preview: <span style={{ fontSize: 20 }}>{icon}</span>{' '}
            <span style={{ color: '#E2E8F0' }}>{text.trim()}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2,
              padding: 12,
              borderRadius: 12,
              border: 'none',
              background: canSave
                ? 'linear-gradient(135deg, #F97316, #EA580C)'
                : '#475569',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: canSave ? 'pointer' : 'default',
              opacity: canSave ? 1 : 0.5,
            }}
          >
            Save Button
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94A3B8',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
