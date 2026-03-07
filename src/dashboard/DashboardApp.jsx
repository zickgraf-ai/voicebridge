import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 * 3 },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Card({ title, value, subtitle }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16, border: '1px solid #334155', flex: 1, minWidth: 140 }}>
      <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>{title}</div>
      <div style={{ color: '#F1F5F9', fontSize: 28, fontWeight: 700 }}>{value}</div>
      {subtitle && <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
      <h3 style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (resp.ok) {
        onLogin();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0F172A', padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1E293B', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360,
        border: '1px solid #334155',
      }}>
        <h2 style={{ color: '#F1F5F9', margin: '0 0 4px', fontSize: 20 }}>TapToSpeak Analytics</h2>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 16px' }}>Enter the dashboard password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '2px solid #334155', background: '#0F172A', color: '#E2E8F0',
            fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box',
          }}
        />
        {error && <div style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 10, borderRadius: 10, border: 'none',
            background: loading ? '#475569' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [rangeIdx, setRangeIdx] = useState(1); // default 30d
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState(null);
  const [phrases, setPhrases] = useState(null);
  const [voiceHealth, setVoiceHealth] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  const getRange = useCallback(() => {
    const r = RANGES[rangeIdx];
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - r.days * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }, [rangeIdx]);

  const fetchData = useCallback(async () => {
    const { from, to } = getRange();
    const qs = `from=${from}&to=${to}`;
    const opts = { credentials: 'include' };

    const [ov, tr, ph, vh, sg, st] = await Promise.allSettled([
      fetch(`/api/dashboard/overview?${qs}`, opts).then((r) => r.json()),
      fetch(`/api/dashboard/usage-trend?${qs}`, opts).then((r) => r.json()),
      fetch(`/api/dashboard/phrases?${qs}`, opts).then((r) => r.json()),
      fetch(`/api/dashboard/voice-health?${qs}`, opts).then((r) => r.json()),
      fetch(`/api/dashboard/suggestions?${qs}`, opts).then((r) => r.json()),
      fetch(`/api/dashboard/settings?${qs}`, opts).then((r) => r.json()),
    ]);

    if (ov.status === 'fulfilled') setOverview(ov.value);
    if (tr.status === 'fulfilled') setTrend(tr.value);
    if (ph.status === 'fulfilled') setPhrases(ph.value);
    if (vh.status === 'fulfilled') setVoiceHealth(vh.value);
    if (sg.status === 'fulfilled') setSuggestions(sg.value);
    if (st.status === 'fulfilled') setSettingsData(st.value);
  }, [getRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pieData = phrases ? [
    { name: 'Prebuilt', value: phrases.prebuilt_total },
    { name: 'Custom', value: phrases.custom_total },
  ].filter((d) => d.value > 0) : [];

  const successColor = (voiceHealth?.success_rate || 0) >= 95 ? '#10B981'
    : (voiceHealth?.success_rate || 0) >= 80 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#E2E8F0', padding: '20px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>TapToSpeak Analytics</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  background: i === rangeIdx ? '#3B82F6' : '#334155',
                  color: i === rangeIdx ? '#fff' : '#94A3B8',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Card title="Daily Active Pings" value={overview?.daily_active_pings ?? '-'} />
          <Card title="Avg Phrases/Day" value={overview?.avg_phrases_per_day ?? '-'} />
          <Card title="Premium Adoption" value={overview ? `${overview.premium_adoption_pct}%` : '-'} />
          <Card title="Suggestion Accept Rate" value={overview ? `${overview.suggestion_acceptance_rate}%` : '-'} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Usage Trend */}
          <Section title="Usage Trend">
            {trend?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend.data}>
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} labelFormatter={formatDate} />
                  <Line type="monotone" dataKey="pings" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#64748B', textAlign: 'center', padding: 40 }}>No data yet</div>
            )}
          </Section>

          {/* Phrase Leaderboard + Donut */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 300 }}>
              <Section title="Phrase Leaderboard">
                {phrases?.leaderboard?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {phrases.leaderboard.map((p, i) => (
                      <div key={p.phrase_id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#0F172A', borderRadius: 8, padding: '6px 10px',
                      }}>
                        <span style={{ color: '#64748B', fontSize: 12, width: 20 }}>#{i + 1}</span>
                        <span style={{ flex: 1, fontSize: 13 }}>{p.phrase_id.replace(/_/g, ' ')}</span>
                        <span style={{ color: '#3B82F6', fontWeight: 600, fontSize: 13 }}>{p.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748B', textAlign: 'center', padding: 20 }}>No data yet</div>
                )}
              </Section>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Section title="Prebuilt vs Custom">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: '#64748B', textAlign: 'center', padding: 20 }}>No data yet</div>
                )}
              </Section>
            </div>
          </div>

          {/* Premium Voice Health */}
          <Section title="Premium Voice Health">
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: successColor, fontSize: 28, fontWeight: 700 }}>{voiceHealth?.success_rate ?? 0}%</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Success Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F1F5F9', fontSize: 28, fontWeight: 700 }}>{voiceHealth?.avg_latency_ms ?? 0}ms</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Avg Latency</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F1F5F9', fontSize: 28, fontWeight: 700 }}>{voiceHealth?.cache_hit_rate ?? 0}%</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Cache Hit Rate</div>
              </div>
            </div>
            {voiceHealth?.daily?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={voiceHealth.daily}>
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} labelFormatter={formatDate} />
                  <Bar dataKey="successes" fill="#10B981" stackId="voice" />
                  <Bar dataKey="failures" fill="#EF4444" stackId="voice" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#64748B', textAlign: 'center', padding: 20 }}>No data yet</div>
            )}
          </Section>

          {/* Smart Suggestions */}
          <Section title="Smart Suggestions">
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F1F5F9', fontSize: 28, fontWeight: 700 }}>{suggestions?.acceptance_rate ?? 0}%</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Acceptance Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#3B82F6', fontSize: 28, fontWeight: 700 }}>{suggestions?.total_accepted ?? 0}</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Accepted</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: 28, fontWeight: 700 }}>{suggestions?.total_dismissed ?? 0}</div>
                <div style={{ color: '#94A3B8', fontSize: 11 }}>Dismissed</div>
              </div>
            </div>
            {suggestions?.daily?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={suggestions.daily}>
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} labelFormatter={formatDate} />
                  <Bar dataKey="accepted" fill="#3B82F6" stackId="sug" />
                  <Bar dataKey="dismissed" fill="#475569" stackId="sug" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#64748B', textAlign: 'center', padding: 20 }}>No data yet</div>
            )}
          </Section>

          {/* Settings Distribution */}
          <Section title="Settings Distribution">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Button Size */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 8px' }}>Button Size</h4>
                {settingsData?.button_sizes && Object.keys(settingsData.button_sizes).length > 0 ? (
                  Object.entries(settingsData.button_sizes).map(([size, count]) => {
                    const pct = settingsData.total_pings > 0 ? Math.round(100 * count / settingsData.total_pings) : 0;
                    return (
                      <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 60, fontSize: 13 }}>{size}</span>
                        <div style={{ flex: 1, height: 18, background: '#0F172A', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#3B82F6', borderRadius: 4 }} />
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: 12, width: 40, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#64748B', fontSize: 12 }}>No data yet</div>
                )}
              </div>

              {/* Voice Speed */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 8px' }}>Voice Speed</h4>
                {settingsData?.voice_speeds?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={settingsData.voice_speeds}>
                      <XAxis dataKey="speed" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
                      <Bar dataKey="count" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: '#64748B', fontSize: 12 }}>No data yet</div>
                )}
              </div>

              {/* Feature Enablement */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 8px' }}>Feature Enablement</h4>
                {settingsData?.features ? (
                  Object.entries(settingsData.features).map(([feat, pct]) => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 120, fontSize: 12 }}>{feat.replace(/_/g, ' ')}</span>
                      <div style={{ flex: 1, height: 18, background: '#0F172A', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#10B981', borderRadius: 4 }} />
                      </div>
                      <span style={{ color: '#94A3B8', fontSize: 12, width: 40, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748B', fontSize: 12 }}>No data yet</div>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default function DashboardApp() {
  const [authed, setAuthed] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    fetch('/api/dashboard/overview?from=2020-01-01&to=2099-01-01', { credentials: 'include' })
      .then((r) => { if (r.ok) setAuthed(true); })
      .catch(() => {});
  }, []);

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;
  return <Dashboard />;
}
