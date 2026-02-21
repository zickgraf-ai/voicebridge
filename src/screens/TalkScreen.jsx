import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useVoices } from '../hooks/useVoices';
import { usePremiumSpeech } from '../hooks/usePremiumSpeech';
import { useLocation } from '../hooks/useLocation';
import { getIdentityPhrase } from '../utils/identity';
import { CATEGORY_PHRASES, CATEGORIES, LOCATION_PHRASES } from '../data/phrases';
import { SMART_PHRASES } from '../data/smartSuggest';
import { updateFrequencyMap } from '../utils/smartEngine';
import { useSuggestions } from '../hooks/useSuggestions';
import SpeechBar from '../components/SpeechBar';
import CategoryBar from '../components/CategoryBar';
import PhraseGrid from '../components/PhraseGrid';
import PainScale from '../components/PainScale';
import PhraseBuilder from '../components/PhraseBuilder';
import CacheProgress from '../components/CacheProgress';

// Collect all phrases for the smart engine to score
const ALL_SCORABLE_PHRASES = (() => {
  const seen = new Set();
  const result = [];
  for (const phrases of Object.values(SMART_PHRASES)) {
    for (const p of phrases) {
      if (!seen.has(p.t)) {
        seen.add(p.t);
        result.push(p);
      }
    }
  }
  for (const [catId, phrases] of Object.entries(CATEGORY_PHRASES)) {
    for (const p of phrases) {
      if (!seen.has(p.t)) {
        seen.add(p.t);
        result.push(p);
      }
    }
  }
  for (const phrases of Object.values(LOCATION_PHRASES)) {
    for (const p of phrases) {
      if (!seen.has(p.t)) {
        seen.add(p.t);
        result.push(p);
      }
    }
  }
  return result;
})();

export default function TalkScreen() {
  const { state, addHistory, setFrequencyMap } = useAppContext();
  const { profile, settings, history, frequencyMap, pinnedPhrases, locations } = state;
  const voices = useVoices();
  const { speak: premiumSpeak, cancel: premiumCancel, cacheProgress, error: voiceError } = usePremiumSpeech();
  const { locationLabel } = useLocation(locations || []);

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

  // Unified speak function that handles both premium and device voices
  const doSpeak = useCallback(
    (t) => {
      const speakText = t || text;
      if (!speakText) return;
      premiumSpeak(speakText, {
        voiceRate: settings.voiceRate,
        webVoices: voices,
        webVoiceURI: settings.voiceURI,
      });
    },
    [text, voices, settings, premiumSpeak]
  );

  const setAndSpeak = useCallback(
    (newText, source = 'button') => {
      setText(newText);
      setShowPain(false);
      setEditing(false);
      if (settings.autoSpeak) {
        premiumSpeak(newText, {
          voiceRate: settings.voiceRate,
          webVoices: voices,
          webVoiceURI: settings.voiceURI,
        });
      }
      addHistory({ phrase: newText, category: cat, source });
      setFrequencyMap((prev) => updateFrequencyMap(prev, newText, locationLabel));
    },
    [settings, voices, cat, addHistory, setFrequencyMap, premiumSpeak]
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

  // Smart suggestions: local-first with AI upgrade
  const { suggestions: smartItems } = useSuggestions({
    frequencyMap,
    allPhrases: ALL_SCORABLE_PHRASES,
    history,
    medications: profile.medications || [],
    pinnedPhrases: pinnedPhrases || [],
    locationLabel,
    condition: profile.condition,
    familyNames: (profile.familyMembers || []).map((f) => f.name),
    count: 9,
  });

  const items = (() => {
    if (cat === 'smart') {
      return smartItems;
    }
    if (cat === 'people') {
      const familyButtons = profile.familyMembers.flatMap((f) => [
        { t: 'Call ' + f.name, i: f.photo || '\u{1F464}' },
        { t: "Where's " + f.name + '?', i: '\u2753' },
      ]);
      return [...familyButtons, ...(CATEGORY_PHRASES.people || [])];
    }
    if (cat === 'medical') {
      const medButtons = profile.medications.map((m) => ({
        t: 'Time for ' + m.name,
        i: '\u{1F48A}',
      }));
      const base = CATEGORY_PHRASES.medical || [];
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
      <CacheProgress
        cached={cacheProgress.cached}
        total={cacheProgress.total}
        loading={cacheProgress.loading}
      />
      {voiceError && (
        <div style={{
          background: '#F59E0B22',
          border: '1px solid #F59E0B44',
          borderRadius: 8,
          padding: '6px 10px',
          color: '#FCD34D',
          fontSize: 12,
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {voiceError}
        </div>
      )}
      <SpeechBar
        text={text}
        setText={setText}
        onSpeak={() => {
          doSpeak();
          if (text.trim()) {
            addHistory({ phrase: text.trim(), category: cat, source: 'typed' });
            setFrequencyMap((prev) => updateFrequencyMap(prev, text.trim(), locationLabel));
          }
        }}
        onClear={() => {
          setText('');
          setEditing(false);
          premiumCancel();
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
            locationLabel={locationLabel}
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
