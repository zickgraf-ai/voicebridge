/* global __APP_VERSION__ */
import { useState } from 'react';

function openMailto(mailto, onFallback) {
  const link = document.createElement('a');
  link.href = mailto;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // If no mail client handles it, the page stays the same.
  // Show fallback after a short delay so the user always has the email.
  setTimeout(() => {
    onFallback();
  }, 1500);
}

export default function AboutScreen({ onBack }) {
  const [showEmailAlert, setShowEmailAlert] = useState(false);

  const partnershipSubject = 'TapToSpeak – Partnership Inquiry';
  const partnershipBody =
    "Hi Jeff, I'm a [role] at [organization]. I'm interested in learning more about TapToSpeak for our patients.";
  const partnershipMailto = `mailto:jeff@taptospeak.app?subject=${encodeURIComponent(partnershipSubject)}&body=${encodeURIComponent(partnershipBody)}`;

  const feedbackSubject = 'TapToSpeak – User Feedback';
  const feedbackMailto = `mailto:jeff@taptospeak.app?subject=${encodeURIComponent(feedbackSubject)}`;

  const handlePartnershipClick = (e) => {
    e.preventDefault();
    openMailto(partnershipMailto, () => setShowEmailAlert(true));
  };

  const handleFeedbackClick = (e) => {
    e.preventDefault();
    openMailto(feedbackMailto, () => setShowEmailAlert(true));
  };

  return (
    <div
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 14,
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#3B82F6',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '4px 0',
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {'\u2190'} Settings
      </button>

      {/* 1. App Identity */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '12px 0',
        }}
      >
        <img
          src="/icon-192.png"
          alt="TapToSpeak"
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
          }}
        />
        <h2
          style={{
            color: '#F1F5F9',
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          TapToSpeak
        </h2>
        <span style={{ color: '#64748B', fontSize: 13 }}>
          Version {__APP_VERSION__}
        </span>
        <p
          style={{
            color: '#94A3B8',
            fontSize: 15,
            margin: '4px 0 0',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Giving patients a voice when they need it most.
        </p>
      </div>

      {/* 2. Our Story */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: '0 0 10px', fontSize: 16 }}>
          Our Story
        </h3>
        <div
          style={{
            borderLeft: '3px solid #3B82F6',
            paddingLeft: 14,
          }}
        >
          <p
            style={{
              color: '#CBD5E1',
              fontSize: 15,
              margin: '0 0 10px',
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}
          >
            {'\u201C'}Hi, I&apos;m Jeff Zickgraf, creator of TapToSpeak. This
            app was born out of necessity. When my wife came out of surgery
            unable to speak, with a broken jaw and a broken dominant hand, I
            scrambled to find something that could give her a voice.
          </p>
          <p
            style={{
              color: '#CBD5E1',
              fontSize: 15,
              margin: '0 0 10px',
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}
          >
            The apps we tried were clunky and slow — not what you need when a
            nurse is asking questions and you can&apos;t answer. So that night,
            I built a prototype. I installed it on her phone the next morning,
            and it worked.
          </p>
          <p
            style={{
              color: '#CBD5E1',
              fontSize: 15,
              margin: 0,
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}
          >
            She couldn&apos;t speak, but I could hear her. I hope TapToSpeak
            helps your patients too.{'\u201D'}
          </p>
        </div>
      </div>

      {/* 3. For Healthcare Professionals — Most visually prominent section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0C4A6E, #164E63)',
          borderRadius: 14,
          padding: 18,
          border: '1px solid #0E7490',
          boxShadow: '0 4px 20px rgba(14, 116, 144, 0.25)',
        }}
      >
        <h3
          style={{
            color: '#67E8F9',
            margin: '0 0 8px',
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {'\u{1F3E5}'} For Healthcare Professionals
        </h3>
        <p
          style={{
            color: '#E0F2FE',
            fontSize: 15,
            margin: '0 0 14px',
            lineHeight: 1.6,
          }}
        >
          Are you a clinician, speech-language pathologist, or hospital
          administrator? I&apos;d love to hear how TapToSpeak could help your
          patients and explore partnership opportunities.
        </p>
        <button
          onClick={handlePartnershipClick}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0891B2, #0E7490)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            padding: 14,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(8, 145, 178, 0.35)',
          }}
        >
          {'\u{1F4E7}'} Contact for Partnerships
        </button>
      </div>

      {/* 4. Share Your Experience */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: '0 0 6px', fontSize: 16 }}>
          Share Your Experience
        </h3>
        <p
          style={{
            color: '#CBD5E1',
            fontSize: 15,
            margin: '0 0 12px',
            lineHeight: 1.6,
          }}
        >
          Using TapToSpeak with a patient or loved one? I&apos;d love to hear
          your story — your feedback helps shape what comes next.
        </p>
        <button
          onClick={handleFeedbackClick}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: 'transparent',
            color: '#3B82F6',
            fontSize: 14,
            fontWeight: 600,
            padding: 12,
            borderRadius: 10,
            border: '2px solid #3B82F6',
            cursor: 'pointer',
          }}
        >
          {'\u{1F4E8}'} Share Feedback
        </button>
      </div>

      {/* 5. Links */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {[
          {
            label: 'Privacy Policy',
            url: 'https://zickgraf.ai/taptospeak/privacy',
          },
          {
            label: 'Terms of Use',
            url: 'https://zickgraf.ai/taptospeak/terms',
          },
          { label: 'Website', url: 'https://zickgraf.ai/taptospeak' },
        ].map((link, i, arr) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 4px',
              color: '#3B82F6',
              fontSize: 14,
              textDecoration: 'none',
              borderBottom:
                i < arr.length - 1 ? '1px solid #334155' : 'none',
            }}
          >
            <span>{link.label}</span>
            <span style={{ color: '#64748B', fontSize: 12 }}>{'\u2197'}</span>
          </a>
        ))}
      </div>

      {/* 6. Footer */}
      <div
        style={{
          textAlign: 'center',
          color: '#475569',
          fontSize: 12,
          padding: '4px 0 16px',
        }}
      >
        {'\u00A9'} 2026 JZ Zickgraf. All rights reserved.
      </div>

      {/* Mailto fallback alert */}
      {showEmailAlert && (
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEmailAlert(false);
          }}
        >
          <div
            style={{
              background: '#1E293B',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 340,
              border: '1px solid #334155',
              textAlign: 'center',
            }}
          >
            <h3
              style={{ color: '#F1F5F9', margin: '0 0 8px', fontSize: 18 }}
            >
              {'\u{1F4E7}'} Email Us
            </h3>
            <p
              style={{
                color: '#94A3B8',
                fontSize: 14,
                margin: '0 0 14px',
                lineHeight: 1.5,
              }}
            >
              If your email app didn&apos;t open, you can reach us at:
            </p>
            <div
              style={{
                background: '#0F172A',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#67E8F9',
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 14,
                userSelect: 'all',
                cursor: 'text',
                border: '1px solid #334155',
              }}
            >
              jeff@taptospeak.app
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard
                    ?.writeText('jeff@taptospeak.app')
                    .then(() => setShowEmailAlert(false));
                }}
                style={{
                  flex: 1,
                  background:
                    'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: 10,
                  padding: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy Email
              </button>
              <button
                onClick={() => setShowEmailAlert(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
