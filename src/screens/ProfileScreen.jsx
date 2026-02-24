import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getIdentityPhrase } from '../utils/identity';

const RELATIONSHIPS = [
  'Husband', 'Wife', 'Partner', 'Mom', 'Dad', 'Son', 'Daughter',
  'Sister', 'Brother', 'Friend', 'Doctor', 'Nurse', 'Therapist',
  'Aide', 'Grandma', 'Grandpa',
];

const CONDITIONS = ['Jaw Surgery', 'Stroke', 'Post-Intubation', 'ALS', 'Autism'];

const inp = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '2px solid #334155',
  background: '#0F172A',
  color: '#E2E8F0',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function ProfileScreen({ onDone }) {
  const { state, setProfile } = useAppContext();
  const { profile } = state;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [dob, setDob] = useState(profile.dob);
  const [address, setAddress] = useState(profile.address);
  const [cond, setCond] = useState(profile.condition);

  // Family form
  const [fn, setFn] = useState('');
  const [fr, setFr] = useState('');

  // Meds form
  const [mn, setMn] = useState('');
  const [ms, setMs] = useState('');

  const steps = ['Identity', 'Family', 'Meds', 'Connect'];
  const stepIcons = ['\u{1FAAA}', '\u{1F465}', '\u{1F48A}', '\u{1F517}'];

  const saveIdentity = () => {
    setProfile((p) => ({ ...p, name, dob, address, condition: cond }));
  };

  const handleNext = () => {
    if (step === 0) saveIdentity();
    if (step < 3) setStep((s) => s + 1);
    else if (onDone) onDone();
  };

  return (
    <div
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 10,
        overflow: 'hidden',
      }}
    >
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              background: i <= step ? '#3B82F6' : '#334155',
            }}
          />
        ))}
      </div>

      {/* Step heading */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 20 }}>
          {stepIcons[step]} {steps[step]}
        </h2>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: '#3B82F611',
                border: '1px solid #3B82F633',
                borderRadius: 10,
                padding: 10,
                color: '#93C5FD',
                fontSize: 13,
              }}
            >
              {'\u{1FAAA}'} Nurses often need your name, date of birth and address. Fill
              these in and tap &quot;My Info&quot; on the Talk screen to speak them
              automatically.
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>
                Patient Name
              </div>
              <input
                style={inp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>
                Date of Birth
              </div>
              <input
                style={inp}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="e.g. January 15, 1985"
              />
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>
                Address
              </div>
              <input
                style={inp}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Seattle WA 98101"
              />
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>
                Condition
              </div>
              <input
                style={inp}
                value={cond}
                onChange={(e) => setCond(e.target.value)}
                placeholder="Condition"
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCond(c + ' Recovery')}
                    style={{
                      background: cond.includes(c) ? '#3B82F622' : '#1E293B',
                      border: `1px solid ${cond.includes(c) ? '#3B82F6' : '#475569'}`,
                      borderRadius: 12,
                      padding: '8px 14px',
                      color: '#E2E8F0',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {(name || dob || address) && (
              <div
                style={{
                  background: '#1E293B',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>
                  Preview — &quot;My Info&quot; will say:
                </div>
                <div
                  style={{
                    color: '#E2E8F0',
                    fontSize: 14,
                    fontStyle: 'italic',
                  }}
                >
                  {getIdentityPhrase({ name, dob, address })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.familyMembers.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#E2E8F0', fontSize: 15 }}>
                  {f.photo} {f.name} —{' '}
                  <span style={{ color: '#94A3B8' }}>{f.relationship}</span>
                </span>
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      familyMembers: p.familyMembers.filter((_, j) => j !== i),
                    }))
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '4px 8px',
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
            <div
              style={{
                background: '#0F172A',
                borderRadius: 12,
                padding: 14,
                border: '1px dashed #475569',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <input
                style={inp}
                value={fn}
                onChange={(e) => setFn(e.target.value)}
                placeholder="Name"
              />
              <div>
                <div
                  style={{ color: '#94A3B8', fontSize: 12, marginBottom: 6 }}
                >
                  Relationship — tap or type
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setFr(r)}
                      style={{
                        background: fr === r ? '#3B82F622' : '#1E293B',
                        border: `1px solid ${fr === r ? '#3B82F6' : '#475569'}`,
                        borderRadius: 10,
                        padding: '6px 12px',
                        color: fr === r ? '#93C5FD' : '#E2E8F0',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: fr === r ? 600 : 400,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  style={inp}
                  value={fr}
                  onChange={(e) => setFr(e.target.value)}
                  placeholder="Or type custom..."
                />
              </div>
              <button
                onClick={() => {
                  if (fn && fr) {
                    setProfile((p) => ({
                      ...p,
                      familyMembers: [
                        ...p.familyMembers,
                        { name: fn, relationship: fr, photo: '\u{1F464}' },
                      ],
                    }));
                    setFn('');
                    setFr('');
                  }
                }}
                style={{
                  background: fn && fr ? '#10B981' : '#475569',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: fn && fr ? 'pointer' : 'default',
                  fontSize: 15,
                  opacity: fn && fr ? 1 : 0.5,
                }}
              >
                + Add {fn ? fn : ''}
                {fn && fr ? ' (' + fr + ')' : ''}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.medications.map((m, i) => (
              <div
                key={i}
                style={{
                  background: '#1E293B',
                  borderRadius: 12,
                  padding: '10px 14px',
                  border: '1px solid #475569',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#E2E8F0', fontSize: 14 }}>
                    {'\u{1F48A}'} {m.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: 12 }}>
                    {m.schedule}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      medications: p.medications.filter((_, j) => j !== i),
                    }))
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '4px 8px',
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
            <div
              style={{
                background: '#0F172A',
                borderRadius: 12,
                padding: 14,
                border: '1px dashed #475569',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <input
                style={inp}
                value={mn}
                onChange={(e) => setMn(e.target.value)}
                placeholder="Medication"
              />
              <input
                style={inp}
                value={ms}
                onChange={(e) => setMs(e.target.value)}
                placeholder="Schedule (e.g. Every 6 hours)"
              />
              <button
                onClick={() => {
                  if (mn) {
                    setProfile((p) => ({
                      ...p,
                      medications: [
                        ...p.medications,
                        { name: mn, schedule: ms, nextDose: 'TBD' },
                      ],
                    }));
                    setMn('');
                    setMs('');
                  }
                }}
                style={{
                  background: mn ? '#10B981' : '#475569',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: mn ? 'pointer' : 'default',
                  fontSize: 15,
                  opacity: mn ? 1 : 0.5,
                }}
              >
                + Add{mn ? ' ' + mn : ''}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                background: '#3B82F611',
                border: '1px solid #3B82F633',
                borderRadius: 10,
                padding: 10,
                color: '#93C5FD',
                fontSize: 13,
              }}
            >
              {'\u{1F517}'} Integrations are coming soon. These will let you
              import contacts, calendar events, and health data to personalize
              your phrases.
            </div>
            {[
              { n: 'Google Contacts', i: '\u{1F465}' },
              { n: 'Google Calendar', i: '\u{1F4C5}' },
              { n: 'Apple Health', i: '\u2764\uFE0F\u200D\u{1FA79}' },
              { n: 'Facebook', i: '\u{1F464}' },
            ].map((a) => (
              <div
                key={a.n}
                style={{
                  background: '#1E293B',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: 0.6,
                }}
              >
                <span style={{ fontSize: 22 }}>{a.i}</span>
                <span style={{ flex: 1, color: '#E2E8F0', fontSize: 14 }}>
                  {a.n}
                </span>
                <span
                  style={{
                    background: '#475569',
                    borderRadius: 8,
                    padding: '6px 14px',
                    color: '#94A3B8',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            border: 'none',
            borderRadius: 12,
            padding: '14px 16px',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            flex: 1,
          }}
        >
          {step === 3 ? '\u2728 Done' : 'Next \u2192'}
        </button>
      </div>
    </div>
  );
}
