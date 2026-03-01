import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useVoices } from '../hooks/useVoices';
import { useLocation } from '../hooks/useLocation';
import { PREMIUM_VOICES, usePremiumSpeech } from '../hooks/usePremiumSpeech';
import { getAudio, putAudio, clearAudio } from '../utils/audioCache';
import AUDIO_MANIFEST from '../data/audioManifest.json';
import SegmentControl from '../components/SegmentControl';
import { CATEGORIES } from '../data/phrases';

function speakTest(voices, settings) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('Hello, I need some water please.');
  u.rate = settings.voiceRate || 0.9;
  const v = voices.find((x) => x.voiceURI === settings.voiceURI) || voices[0];
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

const LOCATION_LABELS = ['Hospital', 'Home', 'Car', 'Therapy', 'Doctor', 'Pharmacy'];

function CategoryReorder({ categoryOrder, setCategoryOrder }) {
  const defaultOrder = CATEGORIES.map((c) => c.id);
  const order = categoryOrder && categoryOrder.length > 0 ? categoryOrder : defaultOrder;
  const catMap = {};
  for (const c of CATEGORIES) catMap[c.id] = c;

  const move = (index, direction) => {
    const newOrder = [...order];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const reset = () => setCategoryOrder(null);

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #334155',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ color: '#94A3B8', fontSize: 13 }}>
          {'\u{1F4CB}'} Category Order
        </div>
        {categoryOrder && categoryOrder.length > 0 && (
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '3px 8px',
              color: '#94A3B8',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {order.map((id, i) => {
          const c = catMap[id];
          if (!c) return null;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ flex: 1, color: '#E2E8F0', fontSize: 14 }}>{c.label}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${c.label} up`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  background: i === 0 ? '#1E293B' : '#334155',
                  color: i === 0 ? '#475569' : '#E2E8F0',
                  fontSize: 14,
                  cursor: i === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u2191'}
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${c.label} down`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  background: i === order.length - 1 ? '#1E293B' : '#334155',
                  color: i === order.length - 1 ? '#475569' : '#E2E8F0',
                  fontSize: 14,
                  cursor: i === order.length - 1 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u2193'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsScreen() {
  const { state, setSettings, setProfile, setLocations, setCategoryOrder } = useAppContext();
  const { settings, profile, locations, categoryOrder } = state;
  const voices = useVoices();
  const { coords, locationLabel, permissionGranted, requestPermission } = useLocation(locations || []);
  const { importVoice, removeVoice, voiceStatus } = usePremiumSpeech();
  const [backupMsg, setBackupMsg] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceTesting, setVoiceTesting] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [customLocationLabel, setCustomLocationLabel] = useState('');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupConfirm, setBackupConfirm] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupEncrypting, setBackupEncrypting] = useState(false);

  const isPremium = settings.voiceProvider === 'premium';

  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleBackupStart = () => {
    setBackupPassword('');
    setBackupConfirm('');
    setBackupError('');
    setShowBackupModal(true);
  };

  const handleBackupEncrypt = async () => {
    if (backupPassword.length < 8) {
      setBackupError('Password must be at least 8 characters');
      return;
    }
    if (backupPassword !== backupConfirm) {
      setBackupError('Passwords do not match');
      return;
    }
    setBackupEncrypting(true);
    setBackupError('');
    try {
      const { encrypt } = await import('../utils/crypto.js');
      const data = { profile, settings };
      const encrypted = await encrypt(JSON.stringify(data), backupPassword);
      const url = window.location.origin + '?restore=' + encrypted;
      navigator.clipboard?.writeText(url).then(
        () => setBackupMsg('Encrypted link copied!'),
        () => {
          prompt('Copy this encrypted backup link:', url);
          setBackupMsg('');
        }
      );
      setShowBackupModal(false);
      setTimeout(() => setBackupMsg(''), 3000);
    } catch {
      setBackupError('Encryption failed. Please try again.');
    } finally {
      setBackupEncrypting(false);
    }
  };

  const testPremiumVoice = async () => {
    setVoiceError('');
    setVoiceTesting(true);
    const testPhrase = 'Hello, I need some water please.';
    const voice = settings.premiumVoice || 'nova';

    // iOS Safari requires Audio to be created in the user gesture handler
    const audio = new Audio();
    audio.volume = 1;
    audio.onended = () => setVoiceTesting(false);

    try {
      // 1. Check manifest for bundled/static audio
      const manifest = AUDIO_MANIFEST[voice];
      const manifestFile = manifest && manifest[testPhrase];
      if (manifestFile) {
        audio.src = `/audio/${voice}/${manifestFile}`;
        audio.onended = () => setVoiceTesting(false);
        audio.onerror = () => {
          // Bundled file failed — try cache/API fallback
          testPremiumVoiceFallback(voice, testPhrase, audio);
        };
        await audio.play();
        return;
      }

      // 2. Check IndexedDB cache
      const cacheKey = voice + ':' + testPhrase;
      const cached = await getAudio(cacheKey);
      if (cached) {
        const url = URL.createObjectURL(cached);
        audio.src = url;
        audio.onended = () => { URL.revokeObjectURL(url); setVoiceTesting(false); };
        await audio.play();
        return;
      }

      // 3. Fetch from CDN (if manifest exists but not this phrase) or API
      if (manifestFile) {
        const resp = await fetch(`/audio/${voice}/${manifestFile}`);
        if (resp.ok) {
          const blob = await resp.blob();
          await putAudio(cacheKey, blob);
          const url = URL.createObjectURL(blob);
          audio.src = url;
          audio.onended = () => { URL.revokeObjectURL(url); setVoiceTesting(false); };
          await audio.play();
          return;
        }
      }

      // 4. Fetch from API
      const resp = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testPhrase, voice, speed: settings.voiceRate || 0.9 }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        await putAudio(cacheKey, blob);
        const url = URL.createObjectURL(blob);
        audio.src = url;
        audio.onended = () => { URL.revokeObjectURL(url); setVoiceTesting(false); };
        await audio.play();
      } else if (resp.status === 429) {
        setVoiceError('Voice service is rate limited. Try again in a moment.');
        speakTest(voices, settings);
        setVoiceTesting(false);
      } else if (resp.status === 500) {
        setVoiceError('Premium voice service unavailable. Using device voice.');
        speakTest(voices, settings);
        setVoiceTesting(false);
      } else {
        setVoiceError('Premium voice failed. Using device voice.');
        speakTest(voices, settings);
        setVoiceTesting(false);
      }
    } catch {
      setVoiceError('Could not reach voice server. Check your connection.');
      speakTest(voices, settings);
      setVoiceTesting(false);
    }
    setTimeout(() => setVoiceError(''), 5000);
  };

  const testPremiumVoiceFallback = async (voice, testPhrase, audio) => {
    try {
      const cacheKey = voice + ':' + testPhrase;
      const cached = await getAudio(cacheKey);
      if (cached) {
        const url = URL.createObjectURL(cached);
        audio.src = url;
        audio.onended = () => { URL.revokeObjectURL(url); setVoiceTesting(false); };
        audio.onerror = null;
        await audio.play();
        return;
      }
      // Last resort: device voice
      speakTest(voices, settings);
      setVoiceTesting(false);
    } catch {
      speakTest(voices, settings);
      setVoiceTesting(false);
    }
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
          role="switch"
          aria-checked={settings.autoSpeak}
          aria-label="Auto-speak on tap"
          tabIndex={0}
          onClick={() => update('autoSpeak', !settings.autoSpeak)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update('autoSpeak', !settings.autoSpeak); } }}
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

      {/* Voice Provider Toggle */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 12,
          border: '1px solid #334155',
        }}
      >
        <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
          {'\u{1F3A4}'} Voice Provider
        </div>
        <div role="radiogroup" aria-label="Voice provider" style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Premium', value: 'premium', desc: 'Cloud voices (better quality)' },
            { label: 'Device', value: 'device', desc: 'Built-in voices (works offline)' },
          ].map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={settings.voiceProvider === opt.value}
              onClick={() => update('voiceProvider', opt.value)}
              style={{
                flex: 1,
                background: settings.voiceProvider === opt.value ? '#3B82F6' : '#0F172A',
                border: '1px solid ' + (settings.voiceProvider === opt.value ? '#3B82F6' : '#334155'),
                borderRadius: 10,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{
                color: settings.voiceProvider === opt.value ? '#fff' : '#E2E8F0',
                fontSize: 14,
                fontWeight: 600,
              }}>
                {opt.label}
              </div>
              <div style={{
                color: settings.voiceProvider === opt.value ? '#BFDBFE' : '#64748B',
                fontSize: 11,
                marginTop: 2,
              }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Premium Voice Picker (when premium selected) */}
      {isPremium && (
        <div
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #8B5CF640',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
            {'\u2728'} Premium Voice
          </div>
          <div role="radiogroup" aria-label="Premium voice" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PREMIUM_VOICES.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={settings.premiumVoice === v.id}
                onClick={() => update('premiumVoice', v.id)}
                style={{
                  background: settings.premiumVoice === v.id ? '#8B5CF633' : '#0F172A',
                  border: '1px solid ' + (settings.premiumVoice === v.id ? '#8B5CF6' : '#334155'),
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: settings.premiumVoice === v.id ? '#8B5CF6' : '#475569',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: settings.premiumVoice === v.id ? '#E2E8F0' : '#94A3B8',
                    fontSize: 14,
                    fontWeight: settings.premiumVoice === v.id ? 600 : 400,
                  }}>
                    {v.name}
                  </div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>
                    {v.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Pack Management (when premium selected) */}
      {isPremium && (
        <div
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #334155',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
            Voice Packs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PREMIUM_VOICES.map((v) => {
              const manifest = AUDIO_MANIFEST[v.id];
              const manifestCount = manifest ? Object.keys(manifest).length : 0;
              const status = voiceStatus[v.id] || { cached: 0, total: manifestCount, importing: false };
              const isNova = v.id === 'nova';
              const isDownloaded = status.cached >= manifestCount && manifestCount > 0;
              const isImporting = status.importing;
              const hasManifest = manifestCount > 0;

              return (
                <div
                  key={v.id}
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
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 500 }}>
                      {v.name}
                    </div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>
                      {isNova && hasManifest
                        ? 'Bundled'
                        : isImporting
                          ? `Downloading... ${status.cached}/${manifestCount}`
                          : isDownloaded
                            ? 'Downloaded'
                            : hasManifest
                              ? `Available (~3.5 MB)`
                              : 'Not generated yet'}
                    </div>
                    {isImporting && manifestCount > 0 && (
                      <div
                        style={{
                          marginTop: 4,
                          height: 4,
                          borderRadius: 2,
                          background: '#334155',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(status.cached / manifestCount) * 100}%`,
                            background: '#8B5CF6',
                            borderRadius: 2,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {isNova && hasManifest ? (
                    <span
                      style={{
                        background: '#10B98133',
                        color: '#6EE7B7',
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      Bundled
                    </span>
                  ) : isImporting ? null : isDownloaded ? (
                    <button
                      onClick={() => removeVoice(v.id)}
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
                  ) : hasManifest ? (
                    <button
                      onClick={() => importVoice(v.id)}
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium Only toggle (skip device voice fallback) */}
      {isPremium && (
        <div
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ color: '#E2E8F0', fontSize: 14 }}>
              Always use premium voice
            </div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
              Wait for premium audio instead of falling back to device voice. Requires connection.
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings.premiumOnly}
            aria-label="Always use premium voice"
            onClick={() => update('premiumOnly', !settings.premiumOnly)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: settings.premiumOnly ? '#8B5CF6' : '#475569',
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: settings.premiumOnly ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
      )}

      {/* Device Voice picker (when device selected) */}
      {!isPremium && (
        <div
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #334155',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
            {'\u{1F5E3}\uFE0F'} Device Voice
          </div>
          <select
            value={settings.voiceURI}
            onChange={(e) => update('voiceURI', e.target.value)}
            aria-label="Device voice"
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
      )}

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
        onClick={isPremium ? testPremiumVoice : () => speakTest(voices, settings)}
        disabled={voiceTesting}
        style={{
          background: voiceTesting
            ? '#475569'
            : isPremium
              ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
              : 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          borderRadius: 12,
          padding: 12,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: voiceTesting ? 'default' : 'pointer',
          opacity: voiceTesting ? 0.8 : 1,
          transition: 'all 0.2s',
        }}
      >
        {voiceTesting
          ? 'Playing...'
          : '\u{1F50A} Test ' + (isPremium ? 'Premium ' : '') + 'Voice'}
      </button>
      {voiceError && (
        <div role="alert" style={{
          background: '#F59E0B22',
          border: '1px solid #F59E0B44',
          borderRadius: 10,
          padding: 10,
          color: '#FCD34D',
          fontSize: 13,
          textAlign: 'center',
        }}>
          {voiceError}
        </div>
      )}

      {/* Clear Voice Cache (premium only) */}
      {isPremium && (
        <button
          onClick={async () => {
            await clearAudio(settings.premiumVoice || 'nova');
            setCacheCleared(true);
            setTimeout(() => setCacheCleared(false), 3000);
          }}
          style={{
            background: cacheCleared ? '#10B98133' : '#1E293B',
            border: '1px solid ' + (cacheCleared ? '#10B981' : '#334155'),
            borderRadius: 12,
            padding: 10,
            color: cacheCleared ? '#6EE7B7' : '#94A3B8',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {cacheCleared
            ? '\u2705 Cache cleared! Voices will re-download.'
            : '\u{1F5D1}\uFE0F Clear Voice Cache'}
        </button>
      )}

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

      {/* Category Order */}
      <CategoryReorder
        categoryOrder={categoryOrder}
        setCategoryOrder={setCategoryOrder}
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

      {/* Location Labeling */}
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
          {'\u{1F4CD}'} Locations
        </div>
        <div style={{ color: '#64748B', fontSize: 12 }}>
          Save locations to get smarter suggestions based on where you are.
        </div>

        {/* Current location status */}
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

        {/* Saved locations */}
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
              {loc.label === 'Hospital' ? '\u{1F3E5}' :
               loc.label === 'Home' ? '\u{1F3E0}' :
               loc.label === 'Car' ? '\u{1F697}' :
               loc.label === 'Therapy' ? '\u{1FA7A}' :
               loc.label === 'Doctor' ? '\u{1F469}\u200D\u2695\uFE0F' :
               loc.label === 'Pharmacy' ? '\u{1F48A}' : '\u{1F4CD}'}
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

        {/* Save current location */}
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
            {'\u{1F4CD}'} Save This Location
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

      {/* Backup / Restore */}
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
          {'\u{1F4BE}'} Backup & Restore
        </div>
        <div style={{ color: '#64748B', fontSize: 12 }}>
          Copy a backup link to transfer your profile and settings to
          another browser or device.
        </div>
        <button
          onClick={handleBackupStart}
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            border: 'none',
            borderRadius: 12,
            padding: 12,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {'\u{1F512}'} Copy Encrypted Backup Link
        </button>
        {backupMsg && (
          <div
            style={{
              color: '#10B981',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {'\u2705'} {backupMsg}
          </div>
        )}
      </div>

      {/* Version */}
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

      {/* Backup Password Modal */}
      {showBackupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBackupModal(false); }}
        >
          <div
            style={{
              background: '#1E293B',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 360,
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ color: '#F1F5F9', margin: '0 0 4px', fontSize: 18 }}>
              {'\u{1F512}'} Encrypt Backup
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 14px' }}>
              Choose a password to protect your backup. You'll need this password to restore on another device.
            </p>
            <input
              type="password"
              placeholder="Password (8+ characters)"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '2px solid #334155',
                background: '#0F172A',
                color: '#E2E8F0',
                fontSize: 14,
                outline: 'none',
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={backupConfirm}
              onChange={(e) => setBackupConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBackupEncrypt(); }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '2px solid #334155',
                background: '#0F172A',
                color: '#E2E8F0',
                fontSize: 14,
                outline: 'none',
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />
            {backupError && (
              <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>
                {backupError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowBackupModal(false)}
                style={{
                  flex: 1,
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
              <button
                onClick={handleBackupEncrypt}
                disabled={backupEncrypting}
                style={{
                  flex: 1,
                  background: backupEncrypting ? '#475569' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: 10,
                  padding: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: backupEncrypting ? 'default' : 'pointer',
                }}
              >
                {backupEncrypting ? 'Encrypting...' : 'Encrypt & Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
