import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const EXPIRY_OPTIONS = [
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  { label: '1 week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Permanent', value: null },
];

const QUICK_PIN_PHRASES = [
  { text: 'Ask about swelling', icon: '\u{1F50D}' },
  { text: 'Rate your pain', icon: '\u{1F534}' },
  { text: 'Time for medication', icon: '\u{1F48A}' },
  { text: 'Drink water', icon: '\u{1F4A7}' },
  { text: 'Do mouth rinse', icon: '\u{1FAA5}' },
  { text: 'Try to eat something', icon: '\u{1F37D}\uFE0F' },
  { text: 'Time to walk', icon: '\u{1F6B6}' },
  { text: 'Ice your jaw', icon: '\u{1F9CA}' },
];

export default function CareScreen() {
  const { state, setPinnedPhrases } = useAppContext();
  const { profile, history, pinnedPhrases, settings } = state;
  const [tab, setTab] = useState('overview');
  const [showPinUI, setShowPinUI] = useState(false);
  const [customPinText, setCustomPinText] = useState('');
  const [pinExpiry, setPinExpiry] = useState(null); // null = permanent

  // Compute stats from real history
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayEntries = history.filter(
      (h) => new Date(h.timestamp).toDateString() === today
    );

    const phrasesToday = todayEntries.length;

    const painEntry = todayEntries.find((h) =>
      h.phrase?.startsWith('My pain is ')
    );
    const painLevel = painEntry
      ? painEntry.phrase.match(/My pain is (\d+)/)?.[1] + '/10'
      : '--';

    const nextMed = profile.medications?.[0]?.nextDose || '--';

    const foodPhrases = todayEntries.filter(
      (h) =>
        h.category === 'food' ||
        /water|smoothie|broth|shake|juice|tea|yogurt|soup|ice cream|pudding|applesauce/i.test(
          h.phrase
        )
    );
    const foodPct = phrasesToday > 0
      ? Math.min(100, Math.round((foodPhrases.length / Math.max(phrasesToday, 1)) * 100))
      : 0;

    return { phrasesToday, painLevel, nextMed, foodPct };
  }, [history, profile.medications]);

  const activityLog = useMemo(() => {
    return history.slice(0, 20).map((h) => {
      const d = new Date(h.timestamp);
      const time =
        d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
      const isPain = h.phrase?.startsWith('My pain is ');
      const isFood =
        h.category === 'food' ||
        /water|smoothie|broth|shake|juice|tea/i.test(h.phrase);
      const color = isPain ? '#EF4444' : isFood ? '#10B981' : '#3B82F6';
      return { time, text: h.phrase, color };
    });
  }, [history]);

  const handleAddPin = (text, icon) => {
    const newPin = {
      text,
      icon: icon || '\u{1F4CC}',
      addedBy: 'Caregiver',
      addedAt: new Date().toISOString(),
      expiresAt: pinExpiry ? new Date(Date.now() + pinExpiry).toISOString() : null,
    };
    setPinnedPhrases((prev) => [...prev, newPin]);
    setShowPinUI(false);
    setCustomPinText('');
    setPinExpiry(null);
  };

  const handleRemovePin = (index) => {
    setPinnedPhrases((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter out expired pins for display
  const activePins = (pinnedPhrases || []).filter(
    (p) => !p.expiresAt || new Date(p.expiresAt).getTime() > Date.now()
  );

  const card = {
    background: '#1E293B',
    borderRadius: 12,
    padding: 12,
    border: '1px solid #334155',
  };

  return (
    <div
      style={{
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      {/* Patient header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {'\u{1F469}'}
        </div>
        <div>
          <div style={{ color: '#F1F5F9', fontSize: 17, fontWeight: 600 }}>
            {profile.name}
          </div>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>
            {profile.condition}
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div role="tablist" aria-label="Care dashboard tabs" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {['overview', 'activity', 'pins'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#3B82F6' : '#1E293B',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              color: tab === t ? '#fff' : '#94A3B8',
              fontSize: 14,
              fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {t === 'pins' ? 'Pinned' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        aria-label={tab === 'pins' ? 'Pinned' : tab[0].toUpperCase() + tab.slice(1)}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tab === 'overview' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                {
                  i: '\u{1F4CA}',
                  v: String(stats.phrasesToday),
                  l: 'Phrases',
                  c: '#3B82F6',
                },
                {
                  i: '\u{1F60A}',
                  v: stats.painLevel,
                  l: 'Pain',
                  c: '#10B981',
                },
                {
                  i: '\u{1F48A}',
                  v: stats.nextMed,
                  l: 'Next Med',
                  c: '#8B5CF6',
                },
                {
                  i: '\u{1F37D}\uFE0F',
                  v: stats.foodPct + '%',
                  l: 'Food',
                  c: '#F59E0B',
                },
              ].map((s, j) => (
                <div key={j} style={{ ...card, textAlign: 'center' }}>
                  <span style={{ fontSize: 20 }}>{s.i}</span>
                  <div
                    style={{ color: s.c, fontSize: 24, fontWeight: 700 }}
                  >
                    {s.v}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: 11 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            {stats.painLevel !== '--' && (() => {
              const painNum = parseInt(stats.painLevel, 10);
              const threshold = settings.caregiverAlert || 6;
              const isAboveThreshold = !isNaN(painNum) && painNum >= threshold;
              return isAboveThreshold ? (
                <div
                  role="alert"
                  style={{
                    background: 'linear-gradient(135deg, #DC262622, #EF444433)',
                    border: '2px solid #EF4444',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{'\u{1F6A8}'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#FCA5A5', fontSize: 16, fontWeight: 700 }}>
                      Pain Alert: {stats.painLevel}
                    </div>
                    <div style={{ color: '#FDA4AF', fontSize: 12, marginTop: 2 }}>
                      Exceeds caregiver threshold of {threshold}/10. Check on patient.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#EF444422',
                    border: '1px solid #EF444444',
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{'\u26A0\uFE0F'}</span>
                  <div style={{ color: '#FCA5A5', fontSize: 13 }}>
                    Pain {'\u2191'} {stats.painLevel} recently
                  </div>
                </div>
              );
            })()}
            {stats.phrasesToday === 0 && (
              <div
                style={{
                  background: '#1E293B',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #334155',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: 14,
                }}
              >
                No activity yet today. Stats will populate as the Talk screen
                is used.
              </div>
            )}
          </>
        )}
        {tab === 'activity' && (
          <div style={card}>
            {activityLog.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: 14,
                  padding: 16,
                }}
              >
                No activity recorded yet. Use the Talk screen to start
                communicating.
              </div>
            ) : (
              activityLog.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom:
                      i < activityLog.length - 1
                        ? '1px solid #334155'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: c.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ flex: 1, color: '#E2E8F0', fontSize: 14 }}
                  >
                    {c.text}
                  </span>
                  <span style={{ color: '#64748B', fontSize: 12 }}>
                    {c.time}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
        {tab === 'pins' && (
          <>
            {/* Active pinned phrases */}
            {activePins.length > 0 ? (
              activePins.map((pin, i) => (
                <div
                  key={i}
                  style={{
                    ...card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{pin.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: 14 }}>
                      {pin.text}
                    </div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>
                      {pin.expiresAt
                        ? 'Expires ' + new Date(pin.expiresAt).toLocaleDateString()
                        : 'Permanent'}
                    </div>
                  </div>
                  <button
                    aria-label={`Remove pinned phrase: ${pin.text}`}
                    onClick={() => handleRemovePin(i)}
                    style={{
                      background: '#EF444433',
                      border: '1px solid #EF444455',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#FCA5A5',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  ...card,
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: 14,
                  padding: 16,
                }}
              >
                No pinned phrases. Pin phrases to always show them in the Smart tab.
              </div>
            )}

            {/* Pin a phrase UI */}
            {!showPinUI ? (
              <button
                onClick={() => setShowPinUI(true)}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {'\u{1F4CC}'} Pin a Phrase
              </button>
            ) : (
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600 }}>
                  {'\u{1F4CC}'} Pin a Phrase
                </div>

                {/* Quick pick from common phrases */}
                <div style={{ color: '#94A3B8', fontSize: 12 }}>Quick pick:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_PIN_PHRASES.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddPin(qp.text, qp.icon)}
                      style={{
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: '#E2E8F0',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{qp.icon}</span> {qp.text}
                    </button>
                  ))}
                </div>

                {/* Custom phrase input */}
                <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Or type custom:</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={customPinText}
                    onChange={(e) => setCustomPinText(e.target.value)}
                    placeholder="Type a phrase to pin..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '2px solid #334155',
                      background: '#0F172A',
                      color: '#E2E8F0',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPinText.trim()) {
                        handleAddPin(customPinText.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => customPinText.trim() && handleAddPin(customPinText.trim())}
                    disabled={!customPinText.trim()}
                    style={{
                      background: customPinText.trim()
                        ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                        : '#334155',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 16px',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: customPinText.trim() ? 'pointer' : 'default',
                      opacity: customPinText.trim() ? 1 : 0.5,
                    }}
                  >
                    Pin
                  </button>
                </div>

                {/* Expiry selector */}
                <div style={{ color: '#94A3B8', fontSize: 12 }}>Duration:</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {EXPIRY_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setPinExpiry(opt.value)}
                      style={{
                        background: pinExpiry === opt.value ? '#3B82F6' : '#0F172A',
                        border: '1px solid ' + (pinExpiry === opt.value ? '#3B82F6' : '#334155'),
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: pinExpiry === opt.value ? '#fff' : '#94A3B8',
                        fontSize: 13,
                        fontWeight: pinExpiry === opt.value ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Cancel */}
                <button
                  onClick={() => {
                    setShowPinUI(false);
                    setCustomPinText('');
                    setPinExpiry(null);
                  }}
                  style={{
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
