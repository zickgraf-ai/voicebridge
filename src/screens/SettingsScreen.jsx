import { useAppContext } from '../context/AppContext';
import { useVoices } from '../hooks/useVoices';
import SegmentControl from '../components/SegmentControl';

function speakTest(voices, settings) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('Hello, I need some water please.');
  u.rate = settings.voiceRate || 0.9;
  const v = voices.find((x) => x.voiceURI === settings.voiceURI) || voices[0];
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export default function SettingsScreen() {
  const { state, setSettings } = useAppContext();
  const { settings } = state;
  const voices = useVoices();

  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  return (
    <div
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 10,
        overflow: 'auto',
      }}
    >
      <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 20 }}>
        {'\u2699\uFE0F'} Settings
      </h2>

      {/* Auto-speak toggle */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 500 }}>
            {'\u{1F50A}'} Auto-speak on tap
          </div>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>
            Speaks when you tap a button
          </div>
        </div>
        <div
          onClick={() => update('autoSpeak', !settings.autoSpeak)}
          style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            cursor: 'pointer',
            background: settings.autoSpeak ? '#10B981' : '#475569',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 2,
              left: settings.autoSpeak ? 26 : 2,
              transition: 'all 0.2s',
            }}
          />
        </div>
      </div>

      {/* Voice picker */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 12,
          border: '1px solid #334155',
        }}
      >
        <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
          {'\u{1F5E3}\uFE0F'} Voice
        </div>
        <select
          value={settings.voiceURI}
          onChange={(e) => update('voiceURI', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '2px solid #334155',
            background: '#0F172A',
            color: '#E2E8F0',
            fontSize: 14,
            outline: 'none',
          }}
        >
          {voices.map((v, i) => (
            <option key={i} value={v.voiceURI}>
              {v.name}
              {v.default ? ' \u2605' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Speed */}
      <SegmentControl
        label={'\u{1F50A} Speed'}
        value={settings.voiceRate}
        onChange={(v) => update('voiceRate', v)}
        options={[
          { label: 'Slow', value: 0.7 },
          { label: 'Normal', value: 0.9 },
          { label: 'Fast', value: 1.1 },
        ]}
      />

      {/* Test Voice */}
      <button
        onClick={() => speakTest(voices, settings)}
        style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          borderRadius: 12,
          padding: 12,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {'\u{1F50A}'} Test Voice
      </button>

      {/* Category Tab Size */}
      <SegmentControl
        label={'\u{1F4C2} Category Tab Size'}
        value={settings.tabSize}
        onChange={(v) => update('tabSize', v)}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
          { label: 'XL', value: 'xl' },
        ]}
      />

      {/* Button Size */}
      <SegmentControl
        label={'\u{1F4D0} Button Size'}
        value={settings.buttonSize}
        onChange={(v) => update('buttonSize', v)}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
        ]}
      />

      {/* Pain Reminder */}
      <SegmentControl
        label={'\u23F0 Pain Reminder'}
        value={settings.painReminder}
        onChange={(v) => update('painReminder', v)}
        options={[
          { label: '1hr', value: 60 },
          { label: '2hr', value: 120 },
          { label: '4hr', value: 240 },
          { label: 'Off', value: 0 },
        ]}
      />

      {/* Caregiver Alert */}
      <SegmentControl
        label={'\u{1F4F1} Alert Caregiver'}
        value={settings.caregiverAlert}
        onChange={(v) => update('caregiverAlert', v)}
        options={[
          { label: 'Pain 5+', value: 5 },
          { label: '6+', value: 6 },
          { label: '7+', value: 7 },
          { label: 'Off', value: 0 },
        ]}
      />
    </div>
  );
}
