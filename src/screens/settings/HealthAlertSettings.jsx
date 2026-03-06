import SegmentControl from '../../components/SegmentControl';

export default function HealthAlertSettings({ settings, onUpdate }) {
  return (
    <>
      {/* Pain Reminder */}
      <SegmentControl
        label={'\u23F0 Pain Reminder'}
        value={settings.painReminder}
        onChange={(v) => onUpdate('painReminder', v)}
        options={[
          { label: '1hr', value: 60 },
          { label: '2hr', value: 120 },
          { label: '4hr', value: 240 },
          { label: 'Off', value: 0 },
        ]}
      />

      {/* Caregiver Alert */}
      <SegmentControl
        label={'\uD83D\uDCF1 Alert Caregiver'}
        value={settings.caregiverAlert}
        onChange={(v) => onUpdate('caregiverAlert', v)}
        options={[
          { label: 'Pain 5+', value: 5 },
          { label: '6+', value: 6 },
          { label: '7+', value: 7 },
          { label: 'Off', value: 0 },
        ]}
      />
    </>
  );
}
