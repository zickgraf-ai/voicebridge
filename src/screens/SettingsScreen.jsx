import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import SettingsHub from './settings/SettingsHub';
import SettingsSubPage from './settings/SettingsSubPage';
import VoiceSpeechSettings from './settings/VoiceSpeechSettings';
import DisplaySettings from './settings/DisplaySettings';
import HealthAlertSettings from './settings/HealthAlertSettings';
import LocationSettings from './settings/LocationSettings';
import BackupRestoreSettings from './settings/BackupRestoreSettings';
import PasscodeModal from './settings/PasscodeModal';

const SECTION_TITLES = {
  voice: 'Voice & Speech',
  display: 'Display',
  health: 'Health & Alerts',
  locations: 'Locations',
  backup: 'Backup & Restore',
};

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function SettingsScreen({ onNavigate }) {
  const { state, setSettings, setLocations, setCategoryOrder } = useAppContext();
  const { settings, profile, locations, categoryOrder } = state;
  const [activeSection, setActiveSection] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const lockTimerRef = useRef(null);
  const lockDeadlineRef = useRef(null);

  const caregiverLock = settings.caregiverLock || { enabled: false, passcode: '' };
  const isLocked = caregiverLock.enabled && !unlocked;

  const resetLockTimer = useCallback(() => {
    lockDeadlineRef.current = Date.now() + LOCK_TIMEOUT_MS;
    setRemainingSeconds(Math.ceil(LOCK_TIMEOUT_MS / 1000));
  }, []);

  // Start/stop countdown timer when unlocked
  useEffect(() => {
    if (!caregiverLock.enabled || !unlocked) {
      clearInterval(lockTimerRef.current);
      return;
    }

    resetLockTimer();

    lockTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, lockDeadlineRef.current - Date.now());
      setRemainingSeconds(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setUnlocked(false);
        clearInterval(lockTimerRef.current);
      }
    }, 1000);

    return () => clearInterval(lockTimerRef.current);
  }, [caregiverLock.enabled, unlocked, resetLockTimer]);

  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    if (unlocked) resetLockTimer();
  };

  const handleLockNow = () => {
    setUnlocked(false);
    clearInterval(lockTimerRef.current);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Locked/unlocked banner for hub
  const lockBanner = caregiverLock.enabled && (
    isLocked ? (
      <div
        style={{
          background: '#EF444422',
          border: '1px solid #EF444444',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div style={{ color: '#FCA5A5', fontSize: 14, fontWeight: 600 }}>
            {'\uD83D\uDD12'} Settings locked by caregiver
          </div>
          <div style={{ color: '#FDA4AF', fontSize: 12, marginTop: 2 }}>
            Enter PIN to make changes
          </div>
        </div>
        <button
          onClick={() => setShowPasscodeModal(true)}
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Unlock
        </button>
      </div>
    ) : (
      <div
        style={{
          background: '#10B98122',
          border: '1px solid #10B98144',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ color: '#6EE7B7', fontSize: 13 }}>
          {'\uD83D\uDD13'} Unlocked &middot; Auto-locks in {formatTime(remainingSeconds)}
        </div>
        <button
          onClick={handleLockNow}
          style={{
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#E2E8F0',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Lock Now
        </button>
      </div>
    )
  );

  // Hub view
  if (!activeSection) {
    return (
      <div style={{ padding: 14, height: '100%' }}>
        <SettingsHub
          settings={settings}
          locations={locations}
          onSelectSection={isLocked ? () => setShowPasscodeModal(true) : setActiveSection}
          onNavigate={onNavigate}
          lockBanner={lockBanner}
        />
        {showPasscodeModal && (
          <PasscodeModal
            mode="verify"
            correctPasscode={caregiverLock.passcode}
            onSuccess={() => { setShowPasscodeModal(false); setUnlocked(true); }}
            onCancel={() => setShowPasscodeModal(false)}
          />
        )}
      </div>
    );
  }

  // Sub-page view
  const title = SECTION_TITLES[activeSection] || 'Settings';

  return (
    <div style={{ padding: 14, height: '100%' }}>
      <SettingsSubPage title={title} onBack={() => setActiveSection(null)} locked={isLocked}>
        {lockBanner}
        {activeSection === 'voice' && (
          <VoiceSpeechSettings settings={settings} onUpdate={update} />
        )}
        {activeSection === 'display' && (
          <DisplaySettings
            settings={settings}
            onUpdate={update}
            categoryOrder={categoryOrder}
            setCategoryOrder={setCategoryOrder}
          />
        )}
        {activeSection === 'health' && (
          <HealthAlertSettings settings={settings} onUpdate={update} />
        )}
        {activeSection === 'locations' && (
          <LocationSettings locations={locations} setLocations={setLocations} />
        )}
        {activeSection === 'backup' && (
          <BackupRestoreSettings profile={profile} settings={settings} />
        )}
      </SettingsSubPage>
      {showPasscodeModal && (
        <PasscodeModal
          mode="verify"
          correctPasscode={caregiverLock.passcode}
          onSuccess={() => { setShowPasscodeModal(false); setUnlocked(true); }}
          onCancel={() => setShowPasscodeModal(false)}
        />
      )}
    </div>
  );
}
