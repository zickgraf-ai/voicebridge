import { PREMIUM_VOICES } from '../../hooks/usePremiumSpeech';

const SPEED_LABELS = { 0.8: 'Slow', 1.0: 'Normal', 1.2: 'Fast' };

function getVoiceSummary(settings) {
  if (settings.voiceProvider === 'premium') {
    const voice = PREMIUM_VOICES.find((v) => v.id === settings.premiumVoice);
    const name = voice ? voice.name : 'Nova';
    const speed = SPEED_LABELS[settings.voiceRate] || 'Normal';
    return `${name} \u00B7 ${speed} speed`;
  }
  const speed = SPEED_LABELS[settings.voiceRate] || 'Normal';
  return `Device voice \u00B7 ${speed} speed`;
}

function getDisplaySummary(settings) {
  const btn = settings.buttonSize === 'large' ? 'Large' : 'Normal';
  const tab = settings.tabSize === 'xl' ? 'XL' : settings.tabSize === 'large' ? 'Large' : 'Normal';
  return `Buttons: ${btn} \u00B7 Tabs: ${tab}`;
}

function getHealthSummary(settings) {
  if (settings.painReminder === 0) return 'Pain reminder: Off';
  const hrs = settings.painReminder / 60;
  return `Pain reminder: ${hrs}hr`;
}

function getLocationSummary(locations) {
  const count = (locations || []).length;
  return count > 0 ? `${count} saved` : 'None saved';
}

const HUB_ROWS = [
  { id: 'voice', icon: '\uD83C\uDFA4', label: 'Voice & Speech', getSummary: (s) => getVoiceSummary(s) },
  { id: 'display', icon: '\uD83D\uDCF1', label: 'Display', getSummary: (s) => getDisplaySummary(s) },
  { id: 'health', icon: '\u2764\uFE0F', label: 'Health & Alerts', getSummary: (s) => getHealthSummary(s) },
  { id: 'locations', icon: '\uD83D\uDCCD', label: 'Locations', getSummary: null },
  { id: 'backup', icon: '\uD83D\uDCBE', label: 'Backup & Restore', getSummary: () => 'Transfer settings between devices' },
  { id: 'about', icon: null, label: 'About TapToSpeak', getSummary: () => 'Our story, contact & partnerships' },
];

export default function SettingsHub({ settings, locations, onSelectSection, onNavigate }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 10,
        overflow: 'auto',
        padding: '4px 0',
      }}
    >
      <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 20, padding: '0 2px' }}>
        {'\u2699\uFE0F'} Settings
      </h2>

      {/* About TapToSpeak — prominent at top */}
      <button
        onClick={() => onNavigate('about')}
        style={{
          background: 'linear-gradient(135deg, #0C4A6E, #164E63)',
          border: '1px solid #0E7490',
          borderRadius: 14,
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxShadow: '0 2px 12px rgba(14, 116, 144, 0.2)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/icon-192.png"
            alt=""
            style={{ width: 36, height: 36, borderRadius: 8 }}
          />
          <span>
            <span style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600, display: 'block' }}>
              About TapToSpeak
            </span>
            <span style={{ color: '#67E8F9', fontSize: 12 }}>
              Our story, contact & partnerships
            </span>
          </span>
        </span>
        <span style={{ color: '#67E8F9', fontSize: 16 }}>{'\u203A'}</span>
      </button>

      {/* Setting category rows */}
      {HUB_ROWS.filter((r) => r.id !== 'about').map((row) => {
        const summary = row.id === 'locations'
          ? getLocationSummary(locations)
          : row.getSummary(settings);

        return (
          <button
            key={row.id}
            onClick={() => onSelectSection(row.id)}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{row.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 500 }}>
                {row.label}
              </div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                {summary}
              </div>
            </div>
            <span style={{ color: '#475569', fontSize: 18 }}>{'\u203A'}</span>
          </button>
        );
      })}

      {/* Version footer */}
      <div
        style={{
          textAlign: 'center',
          color: '#475569',
          fontSize: 12,
          padding: '8px 0 16px',
        }}
      >
        TapToSpeak v{__APP_VERSION__}
      </div>
    </div>
  );
}
