/* global __APP_VERSION__ */

export default function AboutScreen({ onBack }) {
  return (
    <div
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 12,
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

      {/* App Identity */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '12px 0',
        }}
      >
        <span style={{ fontSize: 48 }}>{'\u{1F4AC}'}</span>
        <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 22, fontWeight: 700 }}>
          TapToSpeak
        </h2>
        <span style={{ color: '#64748B', fontSize: 13 }}>
          Version {__APP_VERSION__}
        </span>
        <p
          style={{
            color: '#94A3B8',
            fontSize: 14,
            margin: '4px 0 0',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Giving patients a voice when they need it most
        </p>
      </div>

      {/* Our Story */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: '0 0 8px', fontSize: 16 }}>
          Our Story
        </h3>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 10px', lineHeight: 1.6, fontStyle: 'italic' }}>
          {'\u201C'}Hi, I&apos;m Jeff Zickgraf, creator of TapToSpeak.
        </p>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>
          TapToSpeak was invented out of necessity when a family member after
          surgery found themselves unable to speak or answer nurses&apos; questions
          due to a broken dominant hand and broken jaw. We tried a few
          text-to-speech apps but they were clunky and difficult to quickly
          speak. That night I built a prototype and installed it on their phone
          the next morning and it worked for them!
        </p>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          They weren&apos;t able to speak but we could hear them. I hope the
          application helps you too.{'\u201D'}
        </p>
      </div>

      {/* Healthcare Professionals */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2A3D, #1A3A4A)',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #1E4D5E',
        }}
      >
        <h3 style={{ color: '#5EEAD4', margin: '0 0 6px', fontSize: 16 }}>
          {'\u{1F3E5}'} Healthcare Professionals
        </h3>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
          Interested in bringing TapToSpeak to your hospital, clinic, or
          rehabilitation center? We&apos;d love to partner with you to help
          more patients communicate.
        </p>
        <a
          href="mailto:taptospeak@zickgraf.ai?subject=Partnership%20Inquiry%20%E2%80%93%20TapToSpeak"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            padding: 12,
            borderRadius: 10,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {'\u{1F4E7}'} Inquire About Partnerships
        </a>
      </div>

      {/* Feedback */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #334155',
        }}
      >
        <h3 style={{ color: '#F1F5F9', margin: '0 0 6px', fontSize: 16 }}>
          {'\u{1F4AC}'} Share Your Experience
        </h3>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
          Your feedback helps us improve TapToSpeak for everyone. Whether
          it&apos;s a feature idea, a bug report, or a story about how the
          app helped — we want to hear from you.
        </p>
        <a
          href="mailto:taptospeak@zickgraf.ai?subject=Feedback%20%E2%80%93%20TapToSpeak"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            padding: 12,
            borderRadius: 10,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {'\u{1F4E8}'} Send Feedback
        </a>
      </div>

      {/* Links */}
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
          { label: 'Privacy Policy', url: 'https://taptospeak.app/privacy' },
          { label: 'Terms of Use', url: 'https://taptospeak.app/terms' },
          { label: 'Website', url: 'https://taptospeak.app' },
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
              borderBottom: i < arr.length - 1 ? '1px solid #334155' : 'none',
            }}
          >
            <span>{link.label}</span>
            <span style={{ color: '#64748B', fontSize: 12 }}>{'\u2197'}</span>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          color: '#475569',
          fontSize: 12,
          padding: '4px 0 16px',
        }}
      >
        {'\u00A9'} {new Date().getFullYear()} TapToSpeak. All rights reserved.
      </div>
    </div>
  );
}
