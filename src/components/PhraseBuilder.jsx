import { useState, useMemo } from 'react';
import PhraseGrid from './PhraseGrid';
import { BUILDERS, LOCATION_BUILDERS } from '../data/phrases';

export default function PhraseBuilder({ onPhrase, gridRows, locationLabel }) {
  const [starter, setStarter] = useState(null);

  // Merge base builders with location-specific builders
  const mergedBuilders = useMemo(() => {
    const locKey = locationLabel ? locationLabel.toLowerCase() : null;
    const locBuilders = locKey ? LOCATION_BUILDERS[locKey] : null;
    if (!locBuilders) return BUILDERS;

    const merged = { ...BUILDERS };
    for (const [starterKey, data] of Object.entries(locBuilders)) {
      if (merged[starterKey]) {
        // Append new sub-phrases (deduped by text)
        const existingTexts = new Set(merged[starterKey].s.map((s) => s.t));
        const newSubs = data.s.filter((s) => !existingTexts.has(s.t));
        merged[starterKey] = {
          ...merged[starterKey],
          s: [...merged[starterKey].s, ...newSubs],
        };
      } else {
        // New starter from location
        merged[starterKey] = data;
      }
    }
    return merged;
  }, [locationLabel]);

  const keys = Object.keys(mergedBuilders);

  if (starter) {
    const builderData = mergedBuilders[starter];
    if (!builderData) {
      setStarter(null);
      return null;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          gap: 5,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 34,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setStarter(null)}
            aria-label="Back to phrase starters"
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: 8,
              padding: '5px 14px',
              color: '#E2E8F0',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {'\u2190'} Back
          </button>
          <div
            style={{
              background: '#F59E0B22',
              border: '1px solid #F59E0B55',
              borderRadius: 8,
              padding: '5px 14px',
              color: '#FCD34D',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {starter} ...
          </div>
        </div>
        <PhraseGrid
          items={builderData.s}
          onTap={(p) => {
            onPhrase(starter + ' ' + p.t);
            setStarter(null);
          }}
          color="#F59E0B"
          pageSize={gridRows * 3}
        />
      </div>
    );
  }

  const ps = Math.min(keys.length, gridRows * 3);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: `repeat(${Math.ceil(ps / 3)}, 1fr)`,
        gap: 6,
        width: '100%',
        height: '100%',
      }}
    >
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => setStarter(k)}
          aria-label={`${k}, phrase starter`}
          style={{
            background: 'linear-gradient(135deg, #F59E0B12, #F59E0B06)',
            border: '2px solid #F59E0B44',
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 28 }}>{mergedBuilders[k].i}</span>
          <span
            style={{
              fontSize: 14,
              color: '#FCD34D',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {k}...
          </span>
        </button>
      ))}
    </div>
  );
}
