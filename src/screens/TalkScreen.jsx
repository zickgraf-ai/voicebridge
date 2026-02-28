import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useVoices } from '../hooks/useVoices';
import { usePremiumSpeech } from '../hooks/usePremiumSpeech';
import { useLocation } from '../hooks/useLocation';
import { getIdentityPhrase } from '../utils/identity';
import { CATEGORY_PHRASES, CATEGORIES, LOCATION_PHRASES } from '../data/phrases';
import { SMART_PHRASES } from '../data/smartSuggest';
import { updateFrequencyMap } from '../utils/smartEngine';
import { useSuggestions } from '../hooks/useSuggestions';
import { getTypingSuggestions } from '../utils/typingSuggestions';
import SpeechBar from '../components/SpeechBar';
import CategoryBar from '../components/CategoryBar';
import PhraseGrid from '../components/PhraseGrid';
import PainScale from '../components/PainScale';
import PhraseBuilder from '../components/PhraseBuilder';
import CacheProgress from '../components/CacheProgress';
import AddPhraseModal from '../components/AddPhraseModal';

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
  const { state, addHistory, setFrequencyMap, setCustomPhrases } = useAppContext();
  const { profile, settings, history, frequencyMap, pinnedPhrases, locations, customPhrases, categoryOrder } = state;
  const voices = useVoices();
  const { speak: premiumSpeak, cancel: premiumCancel, cacheProgress, error: voiceError } = usePremiumSpeech();
  const { locationLabel } = useLocation(locations || []);

  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cat, setCat] = useState('smart');
  const [showPain, setShowPain] = useState(false);
  const [showAddPhrase, setShowAddPhrase] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  // Sync expanded state with editing
  useEffect(() => {
    if (editing) {
      setExpanded(true);
    }
  }, [editing]);

  const gridRef = useRef(null);
  const [gridRows, setGridRows] = useState(3);

  useEffect(() => {
    if (!gridRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height;
      if (h > 0) {
        setGridRows(Math.max(2, Math.floor(h / 85)));
      }
    });
    ro.observe(gridRef.current);
    return () => ro.disconnect();
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
      setExpanded(false);
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

  // Typing autocomplete suggestions
  const typingSuggestions = useMemo(() => {
    if (!expanded || !editing || !text.trim()) return [];
    return getTypingSuggestions(text, history, ALL_SCORABLE_PHRASES, 5);
  }, [text, expanded, editing, history]);

  const items = useMemo(() => {
    if (cat === 'smart') {
      return smartItems;
    }
    if (cat === 'mine') {
      return customPhrases || [];
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
  }, [cat, smartItems, profile.familyMembers, profile.medications, customPhrases]);
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
        <div role="alert" style={{
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
          setExpanded(false);
        }}
        onClear={() => {
          setText('');
          setEditing(false);
          setExpanded(false);
          premiumCancel();
        }}
        autoSpeak={settings.autoSpeak}
        editing={editing}
        setEditing={setEditing}
        expanded={expanded}
        onCollapse={() => {
          setEditing(false);
          setExpanded(false);
        }}
        suggestions={typingSuggestions}
        onSuggestionTap={(phrase) => {
          setText(phrase);
          setEditing(false);
          setExpanded(false);
          setAndSpeak(phrase, 'typed');
        }}
      />
      <div
        style={{
          maxHeight: expanded ? 0 : 200,
          opacity: expanded ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.2s ease-out, opacity 0.2s ease-out',
        }}
      >
        <CategoryBar
          active={cat}
          onSelect={(id) => {
            setCat(id);
            setShowPain(false);
            setDeleteMode(false);
          }}
          size={settings.tabSize}
          categoryOrder={categoryOrder}
        />
      </div>
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
        ) : cat === 'mine' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 5 }}>
            {/* Action bar for Mine category */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setShowAddPhrase(true)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {'\u2795'} Add Phrase
              </button>
              {customPhrases.length > 0 && (
                <button
                  onClick={() => setDeleteMode((d) => !d)}
                  style={{
                    minHeight: 44,
                    minWidth: 44,
                    padding: '0 14px',
                    background: deleteMode ? '#EF444433' : '#334155',
                    border: deleteMode ? '2px solid #EF4444' : '2px solid transparent',
                    borderRadius: 10,
                    color: deleteMode ? '#FCA5A5' : '#94A3B8',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  {deleteMode ? '\u2705 Done' : '\u{1F5D1}\uFE0F Edit'}
                </button>
              )}
            </div>
            {customPhrases.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#64748B',
                }}
              >
                <span style={{ fontSize: 48 }}>{'\u2B50'}</span>
                <span style={{ fontSize: 16 }}>
                  No custom phrases yet
                </span>
                <span style={{ fontSize: 13 }}>
                  Tap "Add Phrase" to create your own buttons
                </span>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <PhraseGrid
                  items={items}
                  onTap={deleteMode
                    ? (p) => {
                        setCustomPhrases((prev) =>
                          prev.filter((cp) => cp.t !== p.t || cp.i !== p.i)
                        );
                      }
                    : handleTap
                  }
                  color={deleteMode ? '#EF4444' : catColor}
                  pageSize={(gridRows - 1) * 3}
                  category={cat}
                />
              </div>
            )}
          </div>
        ) : (
          <PhraseGrid
            items={items}
            onTap={handleTap}
            color={catColor}
            pageSize={gridRows * 3}
            category={cat}
          />
        )}
      </div>
      <AddPhraseModal
        open={showAddPhrase}
        onClose={() => setShowAddPhrase(false)}
        onSave={(phrase) => {
          setCustomPhrases((prev) => [...prev, phrase]);
        }}
      />
    </div>
  );
}
