import { useState, useRef, useCallback, useEffect, memo } from 'react';

export const MAX_PROSE_CHARS = 2000;
export const MAX_PROSE_PARAGRAPHS = 10;

/**
 * Split text into paragraphs (double-newline separated),
 * filtering out empty segments.
 */
export function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * LongProse — extended text input with paragraph-pause speech.
 *
 * Renders a large textarea for composing multi-paragraph messages
 * and speaks them with natural pauses between paragraphs.
 */
export default memo(function LongProse({ onSpeakParagraph, onStop, speaking: externalSpeaking }) {
  const [text, setText] = useState('');
  const [paragraphIndex, setParagraphIndex] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  const paragraphs = splitParagraphs(text);
  const hasParagraphs = paragraphs.length > 0;
  const tooManyParagraphs = paragraphs.length > MAX_PROSE_PARAGRAPHS;
  const charsRemaining = MAX_PROSE_CHARS - text.length;
  const overLimit = tooManyParagraphs || charsRemaining < 0;
  const canSpeak = hasParagraphs && !overLimit;

  // Sync with external speaking state (e.g. when TTS finishes)
  useEffect(() => {
    if (externalSpeaking === false && speaking && paragraphIndex === -1) {
      setSpeaking(false);
    }
  }, [externalSpeaking, speaking, paragraphIndex]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setSpeaking(false);
    setParagraphIndex(-1);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onStop();
  }, [onStop]);

  const speakAll = useCallback(() => {
    if (!canSpeak) return;

    stopRef.current = false;
    setSpeaking(true);

    let idx = 0;

    const speakNext = () => {
      if (stopRef.current || idx >= paragraphs.length) {
        setSpeaking(false);
        setParagraphIndex(-1);
        return;
      }
      setParagraphIndex(idx);
      onSpeakParagraph(paragraphs[idx], () => {
        idx++;
        if (stopRef.current || idx >= paragraphs.length) {
          setSpeaking(false);
          setParagraphIndex(-1);
          return;
        }
        // Pause between paragraphs (800ms for natural cadence)
        timerRef.current = setTimeout(speakNext, 800);
      });
    };

    speakNext();
  }, [paragraphs, canSpeak, onSpeakParagraph]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 8,
      }}
    >
      {/* Textarea */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <textarea
          ref={textareaRef}
          value={text}
          maxLength={MAX_PROSE_CHARS}
          onChange={(e) => setText(e.target.value.slice(0, MAX_PROSE_CHARS))}
          placeholder="Type or paste a longer message here...&#10;&#10;Separate paragraphs with blank lines for natural pauses."
          aria-label="Long prose input"
          disabled={speaking}
          style={{
            width: '100%',
            height: '100%',
            background: '#1E293B',
            border: speaking ? '2px solid #14B8A6' : '2px solid #334155',
            borderRadius: 14,
            color: '#E2E8F0',
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.5,
            padding: '12px 14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Status + Controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
          height: 56,
        }}
      >
        {speaking ? (
          <>
            {/* Progress indicator */}
            <div
              aria-live="polite"
              style={{
                flex: 1,
                fontSize: 14,
                color: '#94A3B8',
                paddingLeft: 4,
              }}
            >
              Speaking paragraph {paragraphIndex + 1} of {paragraphs.length}
            </div>
            {/* Stop button */}
            <button
              onClick={handleStop}
              aria-label="Stop speaking"
              style={{
                height: 48,
                minWidth: 100,
                background: '#EF4444',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {'\u23F9'} Stop
            </button>
          </>
        ) : (
          <>
            {/* Status: paragraph count + char counter */}
            <div
              style={{
                flex: 1,
                fontSize: 14,
                color: tooManyParagraphs ? '#EF4444' : '#94A3B8',
                paddingLeft: 4,
              }}
            >
              {tooManyParagraphs
                ? `${paragraphs.length}/${MAX_PROSE_PARAGRAPHS} paragraphs (too many)`
                : hasParagraphs
                  ? `${paragraphs.length} paragraph${paragraphs.length !== 1 ? 's' : ''}`
                  : 'No text yet'}
              {text.length > 0 && (
                <span style={{ marginLeft: 8, color: charsRemaining < 200 ? '#F59E0B' : '#64748B' }}>
                  {charsRemaining} chars left
                </span>
              )}
            </div>
            {/* Speak button */}
            <button
              onClick={speakAll}
              disabled={!canSpeak}
              aria-label="Speak all paragraphs"
              style={{
                height: 48,
                minWidth: 100,
                background: canSpeak ? '#14B8A6' : '#334155',
                border: 'none',
                borderRadius: 12,
                color: canSpeak ? '#fff' : '#64748B',
                fontSize: 16,
                fontWeight: 600,
                cursor: canSpeak ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {'\u25B6\uFE0F'} Speak
            </button>
            {/* Clear button */}
            <button
              onClick={() => setText('')}
              disabled={!text}
              aria-label="Clear text"
              style={{
                height: 48,
                minWidth: 64,
                background: text ? '#334155' : '#1E293B',
                border: text ? '1px solid #475569' : '1px solid #334155',
                borderRadius: 12,
                color: text ? '#E2E8F0' : '#64748B',
                fontSize: 16,
                fontWeight: 600,
                cursor: text ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {'\u2715'}
            </button>
          </>
        )}
      </div>
    </div>
  );
});
