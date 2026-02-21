import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import TalkScreen from './screens/TalkScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import CareScreen from './screens/CareScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const { state, setProfile, setSettings } = useAppContext();
  const [view, setView] = useState('talk');

  // Restore from backup link (?restore=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('restore');
      if (!encoded) return;
      const json = decodeURIComponent(atob(encoded));
      const data = JSON.parse(json);
      if (data.profile) setProfile(data.profile);
      if (data.settings) setSettings(data.settings);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      // Invalid restore data — ignore
    }
  }, [setProfile, setSettings]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 700,
        height: '100dvh',
        margin: '0 auto',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          height: 36,
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{'\u{1F4AC}'}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#F1F5F9' }}>
            VoiceBridge
          </span>
        </div>
        {state.settings.autoSpeak && (
          <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>
            {'\u{1F50A}'} AUTO
          </span>
        )}
      </div>

      {/* Screen area — TalkScreen stays mounted to preserve suggestion cache */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: '100%', height: '100%', display: view === 'talk' ? 'contents' : 'none' }}>
          <TalkScreen />
        </div>
        {view === 'profile' && <ProfileScreen onDone={() => setView('talk')} />}
        {view === 'settings' && <SettingsScreen />}
        {view === 'care' && <CareScreen />}
      </div>

      <BottomNav active={view} onSelect={setView} />
    </div>
  );
}
