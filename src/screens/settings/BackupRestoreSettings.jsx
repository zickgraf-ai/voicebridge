import { useState } from 'react';

export default function BackupRestoreSettings({ profile, settings }) {
  const [backupMsg, setBackupMsg] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupConfirm, setBackupConfirm] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupEncrypting, setBackupEncrypting] = useState(false);

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
      const { encrypt } = await import('../../utils/crypto.js');
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

  return (
    <>
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
          {'\uD83D\uDCBE'} Backup & Restore
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
          {'\uD83D\uDD12'} Copy Encrypted Backup Link
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
              {'\uD83D\uDD12'} Encrypt Backup
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
    </>
  );
}
