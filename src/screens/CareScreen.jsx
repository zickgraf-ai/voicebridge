import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

export default function CareScreen() {
  const { state } = useAppContext();
  const { profile, history } = state;
  const [tab, setTab] = useState('overview');

  // Compute stats from real history
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayEntries = history.filter(
      (h) => new Date(h.timestamp).toDateString() === today
    );

    const phrasesToday = todayEntries.length;

    // Find most recent pain entry
    const painEntry = todayEntries.find((h) =>
      h.phrase?.startsWith('My pain is ')
    );
    const painLevel = painEntry
      ? painEntry.phrase.match(/My pain is (\d+)/)?.[1] + '/10'
      : '--';

    // Find next med from profile
    const nextMed = profile.medications?.[0]?.nextDose || '--';

    // Estimate food intake from food-related phrases
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

  // Format activity log from real history
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
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {['overview', 'activity'].map((t) => (
          <button
            key={t}
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
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
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
            {stats.painLevel !== '--' && (
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
            )}
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
      </div>
    </div>
  );
}
