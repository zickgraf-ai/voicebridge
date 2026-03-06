import { useState } from 'react';
import { useLocation } from '../../hooks/useLocation';

const LOCATION_LABELS = ['Hospital', 'Home', 'Car', 'Therapy', 'Doctor', 'Pharmacy'];

export default function LocationSettings({ locations, setLocations }) {
  const { coords, locationLabel, permissionGranted, requestPermission } = useLocation(locations || []);
  const [savingLocation, setSavingLocation] = useState(false);
  const [customLocationLabel, setCustomLocationLabel] = useState('');

  return (
    <>
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ color: '#94A3B8', fontSize: 13 }}>
          {'\uD83D\uDCCD'} Locations
        </div>
        <div style={{ color: '#64748B', fontSize: 12 }}>
          Save locations to get smarter suggestions based on where you are.
        </div>

        {locationLabel && (
          <div style={{
            background: '#10B98122',
            border: '1px solid #10B98144',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#6EE7B7',
            fontSize: 13,
          }}>
            Currently at: {locationLabel}
          </div>
        )}

        {(locations || []).map((loc, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <span style={{ fontSize: 16 }}>
              {loc.label === 'Hospital' ? '\uD83C\uDFE5' :
               loc.label === 'Home' ? '\uD83C\uDFE0' :
               loc.label === 'Car' ? '\uD83D\uDE97' :
               loc.label === 'Therapy' ? '\uD83E\uDE7A' :
               loc.label === 'Doctor' ? '\uD83D\uDC69\u200D\u2695\uFE0F' :
               loc.label === 'Pharmacy' ? '\uD83D\uDC8A' : '\uD83D\uDCCD'}
            </span>
            <span style={{ flex: 1, color: '#E2E8F0', fontSize: 14 }}>{loc.label}</span>
            <button
              aria-label={`Remove ${loc.label} location`}
              onClick={() => {
                setLocations((prev) => prev.filter((_, j) => j !== i));
              }}
              style={{
                background: '#EF444433',
                border: '1px solid #EF444455',
                borderRadius: 6,
                padding: '4px 8px',
                color: '#FCA5A5',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        ))}

        {!savingLocation ? (
          <button
            onClick={() => {
              if (!permissionGranted) {
                requestPermission();
              }
              setSavingLocation(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              border: 'none',
              borderRadius: 10,
              padding: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {'\uD83D\uDCCD'} Save This Location
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!coords ? (
              <div style={{ color: '#F59E0B', fontSize: 12 }}>
                {permissionGranted
                  ? 'Getting location...'
                  : 'Please allow location access when prompted.'}
              </div>
            ) : (
              <>
                <div style={{ color: '#94A3B8', fontSize: 12 }}>
                  Choose a label for this location:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LOCATION_LABELS.map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        setLocations((prev) => [
                          ...prev,
                          {
                            label,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            radius: 200,
                          },
                        ]);
                        setSavingLocation(false);
                        setCustomLocationLabel('');
                      }}
                      style={{
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#E2E8F0',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <input
                    type="text"
                    value={customLocationLabel}
                    onChange={(e) => setCustomLocationLabel(e.target.value)}
                    placeholder="Or type a custom name..."
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      background: '#0F172A',
                      color: '#E2E8F0',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customLocationLabel.trim()) {
                        setLocations((prev) => [
                          ...prev,
                          {
                            label: customLocationLabel.trim(),
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            radius: 200,
                          },
                        ]);
                        setSavingLocation(false);
                        setCustomLocationLabel('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (customLocationLabel.trim()) {
                        setLocations((prev) => [
                          ...prev,
                          {
                            label: customLocationLabel.trim(),
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            radius: 200,
                          },
                        ]);
                        setSavingLocation(false);
                        setCustomLocationLabel('');
                      }
                    }}
                    disabled={!customLocationLabel.trim()}
                    style={{
                      background: customLocationLabel.trim()
                        ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                        : '#334155',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: customLocationLabel.trim() ? 'pointer' : 'default',
                      opacity: customLocationLabel.trim() ? 1 : 0.5,
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setSavingLocation(false)}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 10px',
                color: '#94A3B8',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}
