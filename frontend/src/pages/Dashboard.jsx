import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mic, ClipboardList, MessageSquare, FileText,
  TrendingUp, TrendingDown, Zap, Target,
  Calendar, ChevronRight, AlertCircle
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PolarRadiusAxis
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ── Fade-up animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

// ── Custom Radar tooltip ──
const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
  },
  labelStyle: { color: 'var(--text-muted)' },
  itemStyle: { color: 'var(--text-primary)' },
};
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    api.get('/user/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading skeleton ──
  if (loading) return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />
        <div className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />
      </div>
    </div>
  );

  // ── Error state ──
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <AlertCircle size={40} color="var(--accent-rose)" />
      <p style={{ color: 'var(--text-secondary)' }}>Could not load dashboard. Is the backend running?</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const { overview, averageScores, trends, strengths, weakAreas, recentActivity } = data;

  // ── Stat cards config ──
  const statCards = [
    { label: 'Interviews Done',    value: overview.totalInterviews,   accent: 'indigo',  icon: Mic,           path: '/interview' },
    { label: 'Tests Taken',        value: overview.totalTestsTaken,   accent: 'cyan',    icon: ClipboardList, path: '/tests'     },
    { label: 'GD Sessions',        value: overview.totalGDSessions,   accent: 'emerald', icon: MessageSquare, path: '/gd'        },
    { label: 'ATS Checks',         value: overview.totalATSChecks,    accent: 'amber',   icon: FileText,      path: '/ats'       },
  ];

  // ── Radar data ──
const safeNum = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') return val.score ?? 0;
  return 0;
};

const radarData = [
  { subject: 'Aptitude',  score: safeNum(averageScores.aptitude)  },
  { subject: 'SQL',       score: safeNum(averageScores.sql)       },
  { subject: 'Interview', score: safeNum(averageScores.interview) },
  { subject: 'GD',        score: safeNum(averageScores.gd)        },
  { subject: 'ATS',       score: safeNum(averageScores.ats)       },
];

  // ── Trend line data (zip all trend arrays by index) ──
  const maxLen = Math.max(
    trends.aptitude?.length  || 0,
    trends.interview?.length || 0,
    trends.gd?.length        || 0,
  );
const extractScore = (item) => {
  if (item == null) return null;
  if (typeof item === 'number') return item;
  if (typeof item === 'object') return item.score ?? null;
  return null;
};

const trendData = maxLen === 0 ? [] : Array.from({ length: maxLen }, (_, i) => ({
  session:   i + 1,
  Aptitude:  extractScore(trends.aptitude?.[i]),
  Interview: extractScore(trends.interview?.[i]),
  GD:        extractScore(trends.gd?.[i]),
}));

  // ── Quick action cards ──
  const quickActions = [
    { label: 'Start Interview',    desc: 'Practice with AI',          icon: Mic,           accent: '#5B6CFF', path: '/interview' },
    { label: 'Take a Test',        desc: 'Aptitude, SQL or Coding',   icon: ClipboardList, accent: '#00D4FF', path: '/tests'     },
    { label: 'Join a GD',          desc: 'Simulate group discussion', icon: MessageSquare, accent: '#00E5A0', path: '/gd'        },
    { label: 'Scan Resume (ATS)',  desc: 'Check your ATS score',      icon: FileText,      accent: '#FFB547', path: '/ats'       },
  ];

 const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <Zap size={10} /> Live Dashboard
        </div>
        <h1 className="page-title">
          Good {getGreeting()},{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
           {user?.name || 'there'} 👋
          </span>
        </h1>
        <p className="page-subtitle">Here's your placement prep at a glance</p>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {statCards.map(({ label, value, accent, icon: Icon, path }, i) => (
          <motion.div
            key={label}
            {...fadeUp(0.1 + i * 0.07)}
            className={`stat-card ${accent} card-interactive`}
            onClick={() => navigate(path)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{label}</span>
              <div style={{
                width: 34, height: 34, borderRadius: '9px',
                background: `var(--accent-${accent}-dim)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color={`var(--accent-${accent})`} />
              </div>
            </div>
            <div className="stat-value">{value ?? 0}</div>
            <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronRight size={12} /> Go to {label.split(' ')[0]}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

        {/* Radar chart */}
        <motion.div {...fadeUp(0.3)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '2px' }}>
                Skill Overview
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average scores across all modules</p>
            </div>
            <div className="badge badge-indigo"><Target size={10} /> Radar</div>
          </div>

          {radarData.every(d => d.score === 0) ? (
            <EmptyChart message="Complete some sessions to see your radar" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="var(--border-subtle)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score" dataKey="score"
                  stroke="var(--accent-indigo)" fill="var(--accent-indigo)" fillOpacity={0.18}
                  strokeWidth={2} dot={{ fill: 'var(--accent-indigo)', r: 4 }}
                />
                <Tooltip {...tooltipStyle} formatter={(val) => [typeof val === 'number' ? `${val}%` : val, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Line chart */}
        <motion.div {...fadeUp(0.37)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '2px' }}>
                Score Trends
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Your progress over recent sessions</p>
            </div>
            <div className="badge badge-cyan"><TrendingUp size={10} /> Trends</div>
          </div>

          {trendData.length === 0 ? (
            <EmptyChart message="Complete more sessions to see your trends" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis dataKey="session" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(val) => [typeof val === 'number' ? `${val}%` : val]} labelFormatter={(l) => `Session ${l}`} />
                <Line type="monotone" dataKey="Aptitude"  stroke="#5B6CFF" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Interview" stroke="#00D4FF" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="GD"        stroke="#00E5A0" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
            {[['Aptitude','#5B6CFF'], ['Interview','#00D4FF'], ['GD','#00E5A0']].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 20, height: 2, background: color, borderRadius: '2px' }} />
                {name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Strengths & Weak areas + Recent activity ── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

        {/* Strengths & weak areas */}
        <motion.div {...fadeUp(0.42)} className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Insights
          </h3>

          {strengths?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <TrendingUp size={13} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>
                  Strengths
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {strengths.map(s => (
                  <span key={s} className="badge badge-emerald">{s}</span>
                ))}
              </div>
            </div>
          )}

          {weakAreas?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <TrendingDown size={13} color="var(--accent-rose)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-rose)' }}>
                  Needs Work
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {weakAreas.map(w => (
                  <span key={w} className="badge badge-rose">{w}</span>
                ))}
              </div>
            </div>
          )}

          {!strengths?.length && !weakAreas?.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Complete a few sessions and we'll surface your strengths and weak areas here.
            </p>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div {...fadeUp(0.47)} className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Last Test',      value: formatDate(recentActivity?.lastTest),      icon: ClipboardList, accent: 'cyan'    },
              { label: 'Last Interview', value: formatDate(recentActivity?.lastInterview), icon: Mic,           accent: 'indigo'  },
              { label: 'Last GD',        value: formatDate(recentActivity?.lastGD),        icon: MessageSquare, accent: 'emerald' },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  background: `var(--accent-${accent}-dim)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color={`var(--accent-${accent})`} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1px' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
                <Calendar size={13} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Quick actions ── */}
      <motion.div {...fadeUp(0.52)} className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div className="badge badge-indigo"><Zap size={10} /> Jump right in</div>
        </div>
        <div className="grid-4">
          {quickActions.map(({ label, desc, icon: Icon, accent, path }, i) => (
            <motion.button
              key={label}
              onClick={() => navigate(path)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
                transition: 'border-color 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent + '55'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '9px',
                background: accent + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={accent} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}

// ── Helpers ──
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function EmptyChart({ message }) {
  return (
    <div style={{
      height: 240, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TrendingUp size={18} color="var(--text-muted)" />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '180px' }}>{message}</p>
    </div>
  );
}