import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { loadState, saveState } from '../utils/storage';

export const MAX_PROSE_CHARS = 2000;
export const MAX_PROSE_PARAGRAPHS = 10;
export const MAX_SAVED_PROSE = 5;

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
 * LongProse — extended text input with paragraph-pause speech
 * and up to 5 saved entries for quick replay.
 */
export default memo(function LongProse({ onSpeakParagraph, onStop, speaking: externalSpeaking, isPremium }) {
  const [text, setText] = useState('');
  const [paragraphIndex, setParagraphIndex] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  const speakingParagraphsRef = useRef([]);

  // Saved prose entries persisted in localStorage
  const [savedProse, setSavedProse] = useState(() => loadState('savedProse', []));
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [playingId, setPlayingId] = useState(null);

  // Persist saved prose whenever it changes
  useEffect(() => {
    saveState('savedProse', savedProse);
  }, [savedProse]);

  const paragraphs = splitParagraphs(text);
  const hasParagraphs = paragraphs.length > 0;
  const tooManyParagraphs = paragraphs.length > MAX_PROSE_PARAGRAPHS;
  const charsRemaining = MAX_PROSE_CHARS - text.length;
  const overLimit = tooManyParagraphs || charsRemaining < 0;
  const canSpeak = hasParagraphs && !overLimit;
  const canSave = hasParagraphs && !overLimit && !speaking && savedProse.length < MAX_SAVED_PROSE;

  // Sync with external speaking state (e.g. when TTS finishes)
  useEffect(() => {
    if (externalSpeaking === false && speaking && paragraphIndex === -1) {
      setSpeaking(false);
      setPlayingId(null);
    }
  }, [externalSpeaking, speaking, paragraphIndex]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setSpeaking(false);
    setParagraphIndex(-1);
    setPlayingId(null);
    speakingParagraphsRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onStop();
  }, [onStop]);

  const startSpeaking = useCallback((paras) => {
    if (paras.length === 0) return;
    speakingParagraphsRef.current = paras;
    stopRef.current = false;
    setSpeaking(true);

    let idx = 0;

    const speakNext = () => {
      if (stopRef.current || idx >= paras.length) {
        setSpeaking(false);
        setParagraphIndex(-1);
        setPlayingId(null);
        speakingParagraphsRef.current = [];
        return;
      }
      setParagraphIndex(idx);
      onSpeakParagraph(paras[idx], () => {
        idx++;
        if (stopRef.current || idx >= paras.length) {
          setSpeaking(false);
          setParagraphIndex(-1);
          setPlayingId(null);
          speakingParagraphsRef.current = [];
          return;
        }
        // Pause between paragraphs (800ms for natural cadence)
        timerRef.current = setTimeout(speakNext, 800);
      });
    };

    speakNext();
  }, [onSpeakParagraph]);

  const speakAll = useCallback(() => {
    if (!canSpeak) return;
    startSpeaking(paragraphs);
  }, [paragraphs, canSpeak, startSpeaking]);

  const playSaved = useCallback((entry) => {
    if (speaking) handleStop();
    const paras = splitParagraphs(entry.text);
    if (paras.length === 0) return;
    setPlayingId(entry.id);
    startSpeaking(paras);
  }, [speaking, handleStop, startSpeaking]);

  const handleSave = useCallback(() => {
    const trimmedTitle = saveTitle.trim();
    if (!trimmedTitle || !canSave) return;
    const entry = {
      id: Date.now().toString(),
      title: trimmedTitle,
      text,
    };
    setSavedProse((prev) => [...prev, entry]);
    setIsSaveMode(false);
    setSaveTitle('');
    setText('');
  }, [saveTitle, canSave, text]);

  const deleteSaved = useCallback((id) => {
    if (playingId === id) handleStop();
    setSavedProse((prev) => prev.filter((e) => e.id !== id));
  }, [playingId, handleStop]);

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
      {/* Saved prose entries */}
      {savedProse.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 240,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {savedProse.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: playingId === entry.id ? '#14B8A622' : '#1E293B',
                border: playingId === entry.id ? '1px solid #14B8A6' : '1px solid #334155',
                borderRadius: 10,
                padding: '6px 10px',
                minHeight: 44,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: '#E2E8F0',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}
              >
                {entry.title}
              </span>
              <button
                onClick={() => playSaved(entry)}
                disabled={speaking && playingId !== entry.id}
                aria-label={'Play ' + entry.title}
                style={{
                  width: 40,
                  height: 40,
                  background: speaking && playingId !== entry.id ? '#334155' : '#14B8A6',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 18,
                  cursor: speaking && playingId !== entry.id ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {'\u25B6'}
              </button>
              <button
                onClick={() => deleteSaved(entry.id)}
                disabled={speaking}
                aria-label={'Delete ' + entry.title}
                style={{
                  width: 40,
                  height: 40,
                  background: 'transparent',
                  border: '1px solid #47556944',
                  borderRadius: 10,
                  color: speaking ? '#475569' : '#94A3B8',
                  fontSize: 16,
                  cursor: speaking ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {'\u2715'}
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Premium voice note */}
      {isPremium && !speaking && (
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          Prose uses device voice to keep costs down
        </div>
      )}

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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {playingId
                ? <>Playing: {savedProse.find((e) => e.id === playingId)?.title} &mdash; {paragraphIndex + 1} of {speakingParagraphsRef.current.length}</>
                : <>Speaking paragraph {paragraphIndex + 1} of {speakingParagraphsRef.current.length}</>}
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
        ) : isSaveMode ? (
          <>
            {/* Title input for saving */}
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title for this prose..."
              autoFocus
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') { setIsSaveMode(false); setSaveTitle(''); }
              }}
              aria-label="Prose title"
              style={{
                flex: 1,
                height: 44,
                background: '#0F172A',
                border: '2px solid #14B8A6',
                borderRadius: 10,
                color: '#E2E8F0',
                fontSize: 15,
                padding: '0 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSave}
              disabled={!saveTitle.trim()}
              aria-label="Confirm save"
              style={{
                height: 48,
                minWidth: 56,
                background: saveTitle.trim() ? '#14B8A6' : '#334155',
                border: 'none',
                borderRadius: 12,
                color: saveTitle.trim() ? '#fff' : '#64748B',
                fontSize: 20,
                fontWeight: 600,
                cursor: saveTitle.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {'\u2713'}
            </button>
            <button
              onClick={() => { setIsSaveMode(false); setSaveTitle(''); }}
              aria-label="Cancel save"
              style={{
                height: 48,
                minWidth: 56,
                background: '#334155',
                border: 'none',
                borderRadius: 12,
                color: '#E2E8F0',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {'\u2715'}
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
                  : savedProse.length > 0 ? `${savedProse.length}/${MAX_SAVED_PROSE} saved` : 'No text yet'}
              {text.length > 0 && (
                <span style={{ marginLeft: 8, color: charsRemaining < 200 ? '#F59E0B' : '#64748B' }}>
                  {charsRemaining} chars left
                </span>
              )}
            </div>
            {/* Save button */}
            {canSave && (
              <button
                onClick={() => setIsSaveMode(true)}
                aria-label="Save prose"
                style={{
                  height: 48,
                  minWidth: 80,
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: 12,
                  color: '#E2E8F0',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {'\uD83D\uDCBE'} Save
              </button>
            )}
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
