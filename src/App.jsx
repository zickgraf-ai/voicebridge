import { useState, useEffect, lazy, Suspense } from 'react';
import { useAppContext } from './context/AppContext';
import TalkScreen from './screens/TalkScreen';
import BottomNav from './components/BottomNav';

const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const CareScreen = lazy(() => import('./screens/CareScreen'));

export default function App() {
  const { state, setProfile, setSettings } = useAppContext();
  const [view, setView] = useState('talk');
  const [restoreModal, setRestoreModal] = useState(null); // holds encrypted payload
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreDecrypting, setRestoreDecrypting] = useState(false);

  function applyRestore(data) {
    if (data.profile) setProfile(data.profile);
    if (data.settings) setSettings(data.settings);
  }

  // Restore from backup link (?restore=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('restore');
    if (!encoded) return;

    // Clean URL immediately — before any prompt — to prevent re-triggering
    window.history.replaceState({}, '', window.location.pathname);

    // Check if this is a legacy (unencrypted) backup
    import('./utils/crypto.js').then(({ isLegacyBackup }) => {
      if (isLegacyBackup(encoded)) {
        try {
          const json = decodeURIComponent(atob(encoded));
          const data = JSON.parse(json);
          applyRestore(data);
        } catch {
          // Invalid legacy data — ignore
        }
      } else {
        // Encrypted backup — show password modal
        setRestoreModal(encoded);
      }
    });
  }, [setProfile, setSettings]);

  const handleRestoreDecrypt = async () => {
    if (!restorePassword) return;
    setRestoreDecrypting(true);
    setRestoreError('');
    try {
      const { decrypt } = await import('./utils/crypto.js');
      const json = await decrypt(restoreModal, restorePassword);
      const data = JSON.parse(json);
      applyRestore(data);
      setRestoreModal(null);
      setRestorePassword('');
    } catch {
      setRestoreError('Wrong password or corrupted backup');
    } finally {
      setRestoreDecrypting(false);
    }
  };

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
            TapToSpeak
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
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B' }}>Loading...</div>}>
          {view === 'profile' && <ProfileScreen onDone={() => setView('talk')} />}
          {view === 'settings' && <SettingsScreen />}
          {view === 'care' && <CareScreen />}
        </Suspense>
      </div>

      <BottomNav active={view} onSelect={setView} />

      {/* Restore Password Modal */}
      {restoreModal && (
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
              {'\u{1F512}'} Restore Backup
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 14px' }}>
              Enter the password used when this backup was created.
            </p>
            <input
              type="password"
              placeholder="Backup password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRestoreDecrypt(); }}
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
            {restoreError && (
              <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>
                {restoreError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setRestoreModal(null); setRestorePassword(''); setRestoreError(''); }}
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
                onClick={handleRestoreDecrypt}
                disabled={restoreDecrypting}
                style={{
                  flex: 1,
                  background: restoreDecrypting ? '#475569' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: 10,
                  padding: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: restoreDecrypting ? 'default' : 'pointer',
                }}
              >
                {restoreDecrypting ? 'Decrypting...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
