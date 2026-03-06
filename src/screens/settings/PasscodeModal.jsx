import { useState, useCallback } from 'react';

export default function PasscodeModal({ mode, correctPasscode, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [phase, setPhase] = useState(mode === 'set' ? 'enter' : 'verify');
  const [error, setError] = useState('');

  const handleDigit = useCallback((digit) => {
    setError('');
    const newPin = pin + digit;
    if (newPin.length > 4) return;
    setPin(newPin);

    if (newPin.length === 4) {
      if (phase === 'enter') {
        // Set mode: first entry done, ask for confirmation
        setFirstPin(newPin);
        setPin('');
        setPhase('confirm');
      } else if (phase === 'confirm') {
        // Set mode: compare with first entry
        if (newPin === firstPin) {
          onSuccess(newPin);
        } else {
          setError("PINs don't match. Try again.");
          setPin('');
          setPhase('enter');
          setFirstPin('');
        }
      } else if (phase === 'verify') {
        // Verify mode: compare with correct passcode
        if (newPin === correctPasscode) {
          onSuccess();
        } else {
          setError('Wrong PIN. Try again.');
          setPin('');
        }
      }
    }
  }, [pin, phase, firstPin, correctPasscode, onSuccess]);

  const handleBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const title = phase === 'enter'
    ? 'Set a 4-digit PIN'
    : phase === 'confirm'
      ? 'Confirm PIN'
      : 'Enter PIN';

  const subtitle = phase === 'enter'
    ? 'Choose a PIN to lock settings'
    : phase === 'confirm'
      ? 'Enter the same PIN again'
      : 'Enter your PIN to unlock';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#0F172A',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 320,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#F1F5F9', margin: '0 0 4px', fontSize: 20 }}>
            {title}
          </h3>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
            {subtitle}
          </p>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid="pin-dot"
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid #475569',
                background: i < pin.length ? '#3B82F6' : 'transparent',
                transition: 'background 0.15s',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            color: '#F87171',
            fontSize: 13,
            textAlign: 'center',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Number pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              aria-label={String(n)}
              onClick={() => handleDigit(String(n))}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                border: '1px solid #334155',
                background: '#1E293B',
                color: '#E2E8F0',
                fontSize: 24,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {n}
            </button>
          ))}
          {/* Bottom row: backspace, 0, empty */}
          <button
            aria-label="Backspace"
            onClick={handleBackspace}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {'\u232B'}
          </button>
          <button
            aria-label="0"
            onClick={() => handleDigit('0')}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              border: '1px solid #334155',
              background: '#1E293B',
              color: '#E2E8F0',
              fontSize: 24,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            0
          </button>
          <div style={{ width: 64, height: 64 }} />
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '10px 24px',
            color: '#94A3B8',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
