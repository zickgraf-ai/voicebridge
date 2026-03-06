import { useState } from 'react';
import { useVoices } from '../../hooks/useVoices';
import { PREMIUM_VOICES, usePremiumSpeech } from '../../hooks/usePremiumSpeech';
import { getAudio, putAudio, clearAudio } from '../../utils/audioCache';
import AUDIO_MANIFEST from '../../data/audioManifest.json';
import SegmentControl from '../../components/SegmentControl';
import ToggleSwitch from '../../components/ToggleSwitch';

function speakTest(voices, settings) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('Hello, I need some water please.');
  u.rate = settings.voiceRate || 1.0;
  const v = voices.find((x) => x.voiceURI === settings.voiceURI) || voices[0];
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export default function VoiceSpeechSettings({ settings, onUpdate }) {
  const voices = useVoices();
  const { importVoice, removeVoice, voiceStatus } = usePremiumSpeech();
  const [voiceError, setVoiceError] = useState('');
  const [voiceTesting, setVoiceTesting] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const isPremium = settings.voiceProvider === 'premium';

  const testPremiumVoice = async () => {
    setVoiceError('');
    setVoiceTesting(true);
    const testPhrase = 'Hello, I need some water please.';
    const voice = settings.premiumVoice || 'nova';
    const audio = new Audio();
    audio.volume = 1;
    audio.playbackRate = settings.voiceRate || 1.0;
    audio.onended = () => setVoiceTesting(false);

    try {
      const manifest = AUDIO_MANIFEST[voice];
      const manifestFile = manifest && manifest[testPhrase];
      if (manifestFile) {
        audio.src = `/audio/${voice}/${manifestFile}`;
        audio.onended = () => setVoiceTesting(false);
        audio.onerror = () => testPremiumVoiceFallback(voice, testPhrase, audio);
        await audio.play();
        return;
      }

      const cacheKey = voice + ':' + testPhrase;
      const cached = await getAudio(cacheKey);
      if (cached) {
        const url = URL.createObjectURL(cached);
        audio.src = url;
        audio.onended = () => { URL.revokeObjectURL(url); setVoiceTesting(false); };
        await audio.play();
        return;
      }

      const resp = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testPhrase, voice }),
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
      speakTest(voices, settings);
      setVoiceTesting(false);
    } catch {
      speakTest(voices, settings);
      setVoiceTesting(false);
    }
  };

  return (
    <>
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
            {'\uD83D\uDD0A'} Auto-speak on tap
          </div>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>
            Speaks when you tap a button
          </div>
        </div>
        <ToggleSwitch
          checked={settings.autoSpeak}
          onChange={() => onUpdate('autoSpeak', !settings.autoSpeak)}
          ariaLabel="Auto-speak on tap"
        />
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
          {'\uD83C\uDFA4'} Voice Provider
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
              onClick={() => onUpdate('voiceProvider', opt.value)}
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

      {/* Premium Voice Picker */}
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
                onClick={() => onUpdate('premiumVoice', v.id)}
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

      {/* Voice Pack Management */}
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
                              ? 'Available (~3.5 MB)'
                              : 'Not generated yet'}
                    </div>
                    {isImporting && manifestCount > 0 && (
                      <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#334155', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(status.cached / manifestCount) * 100}%`, background: '#8B5CF6', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                  {isNova && hasManifest ? (
                    <span style={{ background: '#10B98133', color: '#6EE7B7', fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      Bundled
                    </span>
                  ) : isImporting ? null : isDownloaded ? (
                    <button
                      onClick={() => removeVoice(v.id)}
                      style={{ background: '#EF444433', border: '1px solid #EF444455', borderRadius: 6, padding: '4px 8px', color: '#FCA5A5', fontSize: 11, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  ) : hasManifest ? (
                    <button
                      onClick={() => importVoice(v.id)}
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
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

      {/* Premium Only toggle */}
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
          <ToggleSwitch
            checked={settings.premiumOnly}
            onChange={() => onUpdate('premiumOnly', !settings.premiumOnly)}
            ariaLabel="Always use premium voice"
            color="#8B5CF6"
          />
        </div>
      )}

      {/* Device Voice picker */}
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
            {'\uD83D\uDDE3\uFE0F'} Device Voice
          </div>
          <select
            value={settings.voiceURI}
            onChange={(e) => onUpdate('voiceURI', e.target.value)}
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
        label={'\uD83D\uDD0A Speed'}
        value={settings.voiceRate}
        onChange={(v) => onUpdate('voiceRate', v)}
        options={[
          { label: 'Slow', value: 0.8 },
          { label: 'Normal', value: 1.0 },
          { label: 'Fast', value: 1.2 },
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
          : '\uD83D\uDD0A Test ' + (isPremium ? 'Premium ' : '') + 'Voice'}
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

      {/* Clear Voice Cache */}
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
            : '\uD83D\uDDD1\uFE0F Clear Voice Cache'}
        </button>
      )}
    </>
  );
}
