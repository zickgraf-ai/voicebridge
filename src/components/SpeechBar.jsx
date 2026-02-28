import { useRef, useEffect, memo } from 'react';

export default memo(function SpeechBar({
  text,
  setText,
  onSpeak,
  onClear,
  autoSpeak,
  editing,
  setEditing,
  expanded = false,
  onCollapse,
  suggestions = [],
  onSuggestionTap,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current.setSelectionRange) {
        ref.current.setSelectionRange(9999, 9999);
      }
    }
  }, [editing]);

  const has = text && text.trim().length > 0;

  // ─── Expanded Mode ───
  if (expanded && editing) {
    return (
      <div
        role="region"
        aria-label="Speech bar"
        style={{
          background: 'linear-gradient(135deg, #1E3A5F, #1E293B)',
          borderRadius: 14,
          border: '2px solid #F59E0B',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'height 0.25s ease-out',
        }}
      >
        {/* Text Input Area (64px) */}
        <div style={{ padding: '8px 12px', height: 64, display: 'flex', alignItems: 'center' }}>
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setEditing(false);
                onSpeak();
              }
            }}
            placeholder="Type your message..."
            aria-label="Type your message"
            enterKeyHint="send"
            maxLength={200}
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              fontWeight: 500,
              outline: 'none',
              padding: 0,
              resize: 'none',
              lineHeight: 1.3,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Autocomplete Dropdown (vertical list) */}
        {suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Typing suggestions"
            aria-live="polite"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0 8px 4px',
              maxHeight: 160,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              flexShrink: 0,
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                role="option"
                onClick={() => onSuggestionTap(s)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #33415544',
                  padding: '10px 12px',
                  minHeight: 44,
                  color: '#E2E8F0',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: '#94A3B8', fontSize: 14 }}>{'\u21B3'}</span>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons (80px row) */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', height: 80, alignItems: 'center' }}>
          <button
            onClick={() => {
              setEditing(false);
              onSpeak();
            }}
            aria-label="Speak message"
            style={{
              flex: 2,
              height: 72,
              background: '#10B981',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              fontSize: 24,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {'\u25B6\uFE0F'} Speak
          </button>
          <button
            onClick={onClear}
            aria-label="Clear message"
            style={{
              flex: 1,
              height: 72,
              background: '#334155',
              border: 'none',
              borderRadius: 14,
              color: '#E2E8F0',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {'\u2715'} Clear
          </button>
        </div>

        {/* Collapse Handle (32px) */}
        <button
          onClick={onCollapse}
          aria-label="Collapse speech bar"
          style={{
            width: '100%',
            height: 32,
            background: '#1E293B',
            border: 'none',
            borderTop: '1px solid #334155',
            color: '#94A3B8',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          Collapse {'\u25BC'}
        </button>
      </div>
    );
  }

  // ─── Collapsed Mode (original) ───
  return (
    <div
      role="region"
      aria-label="Speech bar"
      style={{
        background: has
          ? 'linear-gradient(135deg, #1E3A5F, #2563EB)'
          : '#1E293B',
        borderRadius: 14,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 52,
        flexShrink: 0,
        border: editing
          ? '2px solid #F59E0B'
          : has
            ? '2px solid #3B82F6'
            : '2px dashed #334155',
        transition: 'height 0.25s ease-out',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setEditing(false);
                onSpeak();
              }
            }}
            placeholder="Type your message..."
            aria-label="Type your message"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              fontWeight: 500,
              outline: 'none',
              padding: 0,
            }}
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label={has ? `Current message: ${text}. Tap to edit` : 'Tap here to type a message'}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditing(true); }}
            style={{
              fontSize: 18,
              color: has ? '#fff' : '#64748B',
              fontWeight: 500,
              cursor: 'text',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-live="polite">{text || 'Tap here to type...'}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {has && editing && (
          <>
            <button
              onClick={() => {
                setEditing(false);
                onSpeak();
              }}
              aria-label="Speak message"
              style={{
                background: '#10B981',
                border: 'none',
                borderRadius: 10,
                width: 48,
                height: 42,
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {'\u25B6\uFE0F'}
            </button>
            <button
              onClick={onClear}
              aria-label="Clear message"
              style={{
                background: '#33415566',
                border: 'none',
                borderRadius: 8,
                width: 40,
                height: 38,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
              }}
            >
              {'\u2715'}
            </button>
          </>
        )}
        {has && !editing && (
          <>
            {!autoSpeak ? (
              <button
                onClick={onSpeak}
                aria-label="Speak message"
                style={{
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: 10,
                  width: 52,
                  height: 42,
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px #3B82F644',
                }}
              >
                {'\u25B6\uFE0F'}
              </button>
            ) : (
              <button
                onClick={onSpeak}
                aria-label="Replay message"
                style={{
                  background: '#334155',
                  border: 'none',
                  borderRadius: 8,
                  width: 40,
                  height: 38,
                  fontSize: 17,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u{1F504}'}
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit message"
              style={{
                background: '#334155',
                border: 'none',
                borderRadius: 8,
                width: 40,
                height: 38,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {'\u270F\uFE0F'}
            </button>
            <button
              onClick={onClear}
              aria-label="Clear message"
              style={{
                background: '#33415566',
                border: 'none',
                borderRadius: 8,
                width: 40,
                height: 38,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
              }}
            >
              {'\u2715'}
            </button>
          </>
        )}
        {!has && !editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Open keyboard"
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: 8,
              width: 40,
              height: 38,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {'\u2328\uFE0F'}
          </button>
        )}
      </div>
    </div>
  );
});
