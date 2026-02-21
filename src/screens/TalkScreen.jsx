import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useVoices } from '../hooks/useVoices';
import { getIdentityPhrase } from '../utils/identity';
import { CATEGORY_PHRASES, CATEGORIES } from '../data/phrases';
import { SMART_PHRASES, getTimeOfDay } from '../data/smartSuggest';
import SpeechBar from '../components/SpeechBar';
import CategoryBar from '../components/CategoryBar';
import PhraseGrid from '../components/PhraseGrid';
import PainScale from '../components/PainScale';
import PhraseBuilder from '../components/PhraseBuilder';

function speakText(text, voices, settings) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = settings.voiceRate || 0.9;
  const voice =
    voices.find((v) => v.voiceURI === settings.voiceURI) || voices[0];
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export default function TalkScreen() {
  const { state, addHistory } = useAppContext();
  const { profile, settings } = state;
  const voices = useVoices();

  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [cat, setCat] = useState('smart');
  const [showPain, setShowPain] = useState(false);

  const gridRef = useRef(null);
  const [gridRows, setGridRows] = useState(3);

  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        const h = gridRef.current.clientHeight;
        setGridRows(Math.max(2, Math.floor(h / 85)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const doSpeak = useCallback(
    (t) => speakText(t || text, voices, settings),
    [text, voices, settings]
  );

  const setAndSpeak = useCallback(
    (newText, source = 'button') => {
      setText(newText);
      setShowPain(false);
      setEditing(false);
      if (settings.autoSpeak) speakText(newText, voices, settings);
      addHistory({ phrase: newText, category: cat, source });
    },
    [settings, voices, cat, addHistory]
  );

  const handleTap = useCallback(
    (p) => {
      if (p.a === 'pain') {
        setShowPain(true);
        return;
      }
      if (p.a === 'identity') {
        setAndSpeak(getIdentityPhrase(profile));
        return;
      }
      if (editing && text.trim()) {
        setText(text.trim() + ' ' + p.t);
        return;
      }
      setAndSpeak(p.t);
    },
    [setAndSpeak, editing, text, profile]
  );

  // Build dynamic items based on category + profile data
  const items = (() => {
    if (cat === 'smart') {
      return SMART_PHRASES[getTimeOfDay()] || SMART_PHRASES.afternoon;
    }
    if (cat === 'people') {
      // Generate "Call [Name]" and "Where's [Name]?" from profile family members
      const familyButtons = profile.familyMembers.flatMap((f) => [
        { t: 'Call ' + f.name, i: f.photo || '\u{1F464}' },
        { t: "Where's " + f.name + '?', i: '\u2753' },
      ]);
      return [...familyButtons, ...(CATEGORY_PHRASES.people || [])];
    }
    if (cat === 'medical') {
      // Inject medication buttons from profile
      const medButtons = profile.medications.map((m) => ({
        t: 'Time for ' + m.name,
        i: '\u{1F48A}',
      }));
      const base = CATEGORY_PHRASES.medical || [];
      // Insert med buttons after the static medical buttons
      return [...base, ...medButtons];
    }
    return CATEGORY_PHRASES[cat] || [];
  })();
  const catColor =
    CATEGORIES.find((c) => c.id === cat)?.color || '#3B82F6';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '6px 10px',
        gap: 6,
        overflow: 'hidden',
      }}
    >
      <SpeechBar
        text={text}
        setText={setText}
        onSpeak={() => {
          doSpeak();
          if (text.trim()) {
            addHistory({ phrase: text.trim(), category: cat, source: 'typed' });
          }
        }}
        onClear={() => {
          setText('');
          setEditing(false);
          window.speechSynthesis?.cancel();
        }}
        autoSpeak={settings.autoSpeak}
        editing={editing}
        setEditing={setEditing}
      />
      <CategoryBar
        active={cat}
        onSelect={(id) => {
          setCat(id);
          setShowPain(false);
        }}
        size={settings.tabSize}
      />
      <div ref={gridRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {showPain ? (
          <PainScale
            onSelect={(painText) => setAndSpeak(painText, 'button')}
          />
        ) : cat === 'build' ? (
          <PhraseBuilder
            onPhrase={(builtText) => setAndSpeak(builtText, 'builder')}
            gridRows={gridRows}
          />
        ) : (
          <PhraseGrid
            items={items}
            onTap={handleTap}
            color={catColor}
            pageSize={gridRows * 3}
          />
        )}
      </div>
    </div>
  );
}
