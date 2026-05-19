import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileText, Upload, CheckCircle, XCircle, AlertCircle,
  Zap, Target, Shield, BookOpen, Briefcase, Award,
  TrendingUp, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import api from '../utils/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

const scoreColor = (s) =>
  s >= 70 ? 'var(--accent-emerald)' :
  s >= 40 ? 'var(--accent-amber)'   : 'var(--accent-rose)';

const scoreLabel = (s) =>
  s >= 70 ? 'Strong' : s >= 40 ? 'Average' : 'Weak';

// ── Animated score ring ──
function ScoreRing({ score, size = 120, stroke = 10, color }) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const pct = (score / 100) * c;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-overlay)" strokeWidth={stroke} />
        {/* Fill */}
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - pct }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: size > 100 ? '1.8rem' : '1.1rem', fontWeight: 800, color, lineHeight: 1 }}
        >
          {score}
        </motion.div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>/ 100</div>
      </div>
    </div>
  );
}

export default function ATS() {
  const [screen,       setScreen]       = useState('input');  // input | result
  const [jobDesc,      setJobDesc]      = useState('');
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [hasResume,    setHasResume]    = useState(true);
  const [showMissing,  setShowMissing]  = useState(false);
  const [showMatched,  setShowMatched]  = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const fileRef = useRef();

  // ── Check resume on mount ──
  useState(() => {
    api.get('/user/profile')
      .then(res => setHasResume(!!res.data.resume))
      .catch(() => {});
  });

  // ── Upload resume ──
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF allowed'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      await api.post('/user/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resume uploaded! ✅');
      setHasResume(true);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Run ATS scan ──
  const handleScan = async () => {
    if (!jobDesc.trim()) { toast.error('Paste a job description first'); return; }
    if (jobDesc.trim().length < 50) { toast.error('Job description is too short'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/user/ats', { jobDescription: jobDesc });
      setResult(data);
      setScreen('result');
    } catch (err) {
      if (err?.response?.status === 400) {
        toast.error('Please upload your resume first');
        setHasResume(false);
      } else {
        toast.error('ATS scan failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScreen('input');
    setResult(null);
    setJobDesc('');
    setShowMissing(false);
    setShowMatched(false);
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', maxWidth: '860px' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <FileText size={10} /> ATS Scanner
        </div>
        <h1 className="page-title">ATS Resume Scanner</h1>
        <p className="page-subtitle">Check how well your resume matches a job description</p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════
            SCREEN: INPUT
        ════════════════════════════════ */}
        {screen === 'input' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* No resume warning */}
            {!hasResume && (
              <motion.div {...fadeUp(0.05)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 18px', borderRadius: '12px', marginBottom: '1.25rem',
                  background: 'rgba(255,84,112,0.08)', border: '1px solid rgba(255,84,112,0.3)',
                }}
              >
                <AlertCircle size={16} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '2px' }}>
                    No resume found
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Upload your resume PDF to enable ATS scanning
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn btn-primary btn-sm"
                >
                  {uploading
                    ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Uploading...</>
                    : <><Upload size={13} /> Upload PDF</>
                  }
                </button>
              </motion.div>
            )}

            {/* How it works */}
            <motion.div {...fadeUp(0.08)} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Zap size={15} color="var(--accent-indigo)" />
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>How it works</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { step: '1', label: 'Upload Resume',      desc: 'Upload your PDF resume in Profile',          color: 'var(--accent-indigo)' },
                  { step: '2', label: 'Paste Job Description', desc: 'Copy the full JD from any job posting',   color: 'var(--accent-cyan)'   },
                  { step: '3', label: 'Get Your Score',     desc: 'See ATS score, matched & missing keywords',  color: 'var(--accent-emerald)'},
                ].map(({ step, label, desc, color }) => (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: color + '22', border: `1px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 800, color, fontFamily: 'var(--font-display)',
                    }}>{step}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* JD input */}
            <motion.div {...fadeUp(0.14)} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Briefcase size={15} color="var(--accent-cyan)" />
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  Paste Job Description
                </h3>
              </div>
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                rows={10}
                className="form-input"
                placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for a React Developer with 2+ years of experience in JavaScript, Node.js, and REST APIs. The candidate should have strong knowledge of SQL, Git, and agile methodologies...`}
                style={{ resize: 'vertical', lineHeight: 1.7, fontSize: '0.9rem' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {jobDesc.length} characters {jobDesc.length < 50 && jobDesc.length > 0 ? '(too short)' : ''}
                </span>
                <motion.button
                  onClick={handleScan}
                  disabled={loading || !hasResume || !jobDesc.trim()}
                  className="btn btn-primary btn-lg"
                  whileTap={{ scale: 0.97 }}
                >
                  {loading
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Scanning...</>
                    : <><Zap size={16} /> Scan Resume</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════════════════════
            SCREEN: RESULT
        ════════════════════════════════ */}
        {screen === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── Top score row ── */}
            <motion.div {...fadeUp(0)} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>

                {/* ATS score ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <ScoreRing score={result.atsScore} size={130} stroke={10} color={scoreColor(result.atsScore)} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>ATS Score</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor(result.atsScore) }}>
                      {scoreLabel(result.atsScore)}
                    </span>
                  </div>
                </div>

                {/* Sub scores */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '200px' }}>
                  {[
                    { label: 'Format Score',  value: result.formatScore,  icon: Shield    },
                    { label: 'Content Score', value: result.contentScore, icon: BookOpen  },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon size={13} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: scoreColor(value) }}>{value}%</span>
                      </div>
                      <div className="progress-track">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                          style={{ background: scoreColor(value) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Resume Sections
                  </div>
                  {[
                    { key: 'hasEducation',     label: 'Education'    },
                    { key: 'hasExperience',    label: 'Experience'   },
                    { key: 'hasSkills',        label: 'Skills'       },
                    { key: 'hasProjects',      label: 'Projects'     },
                    { key: 'hasSummary',       label: 'Summary'      },
                    { key: 'hasCertifications',label: 'Certifications'},
                  ].map(({ key, label }) => {
                    const present = result.sectionAnalysis?.[key];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {present
                          ? <CheckCircle size={14} color="var(--accent-emerald)" />
                          : <XCircle    size={14} color="var(--text-muted)" />
                        }
                        <span style={{ fontSize: '0.8rem', color: present ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: present ? 600 : 400 }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── Keywords row ── */}
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>

              {/* Matched keywords */}
              <motion.div {...fadeUp(0.1)} className="card">
                <button
                  onClick={() => setShowMatched(s => !s)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={15} color="var(--accent-emerald)" />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      Matched Keywords
                    </span>
                    <span className="badge badge-emerald">{result.matchedKeywords?.length || 0}</span>
                  </div>
                  {showMatched ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </button>

                <AnimatePresence>
                  {showMatched && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                    >
                      {result.matchedKeywords?.map(kw => (
                        <span key={kw} className="badge badge-emerald">{kw}</span>
                      ))}
                      {!result.matchedKeywords?.length && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No matched keywords found</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Missing keywords */}
              <motion.div {...fadeUp(0.15)} className="card">
                <button
                  onClick={() => setShowMissing(s => !s)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={15} color="var(--accent-rose)" />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      Missing Keywords
                    </span>
                    <span className="badge badge-rose">{result.missingKeywords?.length || 0}</span>
                  </div>
                  {showMissing ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </button>

                <AnimatePresence>
                  {showMissing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                    >
                      {result.missingKeywords?.map(kw => (
                        <span key={kw} className="badge badge-rose">{kw}</span>
                      ))}
                      {!result.missingKeywords?.length && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No missing keywords — great job!</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ── Improvements ── */}
            {result.improvements?.length > 0 && (
              <motion.div {...fadeUp(0.2)} className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <TrendingUp size={15} color="var(--accent-amber)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    How to Improve
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.improvements.map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent-amber-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-amber)',
                      }}>{i + 1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Overall feedback ── */}
            {result.overallFeedback && (
              <motion.div {...fadeUp(0.25)} className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Award size={15} color="var(--accent-indigo)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    Overall Feedback
                  </h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {result.overallFeedback}
                </p>
              </motion.div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleReset} className="btn btn-primary btn-lg">
                <RotateCcw size={15} /> Scan Again
              </button>
              <button onClick={() => window.location.href = '/profile'} className="btn btn-secondary btn-lg">
                <FileText size={15} /> Update Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}