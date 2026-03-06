import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import SettingsHub from './settings/SettingsHub';
import SettingsSubPage from './settings/SettingsSubPage';
import VoiceSpeechSettings from './settings/VoiceSpeechSettings';
import DisplaySettings from './settings/DisplaySettings';
import HealthAlertSettings from './settings/HealthAlertSettings';
import LocationSettings from './settings/LocationSettings';
import BackupRestoreSettings from './settings/BackupRestoreSettings';

const SECTION_TITLES = {
  voice: 'Voice & Speech',
  display: 'Display',
  health: 'Health & Alerts',
  locations: 'Locations',
  backup: 'Backup & Restore',
};

export default function SettingsScreen({ onNavigate }) {
  const { state, setSettings, setLocations, setCategoryOrder } = useAppContext();
  const { settings, profile, locations, categoryOrder } = state;
  const [activeSection, setActiveSection] = useState(null);

  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  // Hub view
  if (!activeSection) {
    return (
      <div style={{ padding: 14, height: '100%' }}>
        <SettingsHub
          settings={settings}
          locations={locations}
          onSelectSection={setActiveSection}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  // Sub-page view
  const title = SECTION_TITLES[activeSection] || 'Settings';

  return (
    <div style={{ padding: 14, height: '100%' }}>
      <SettingsSubPage title={title} onBack={() => setActiveSection(null)}>
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
    </div>
  );
}
