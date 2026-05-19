import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClipboardList, Code, Database, Clock, ChevronRight,
  CheckCircle, XCircle, Trophy, RotateCcw, Zap,
  AlertCircle, Play, Send, Lightbulb, BarChart2
} from 'lucide-react';
import api from '../utils/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

// ── Tab config ──
const TABS = [
  { id: 'aptitude', label: 'Aptitude', icon: ClipboardList, accent: '#5B6CFF', accentDim: 'rgba(91,108,255,0.12)', badge: 'badge-indigo'  },
  { id: 'sql',      label: 'SQL',      icon: Database,      accent: '#00D4FF', accentDim: 'rgba(0,212,255,0.12)',  badge: 'badge-cyan'    },
  { id: 'coding',   label: 'Coding',   icon: Code,          accent: '#00E5A0', accentDim: 'rgba(0,229,160,0.12)', badge: 'badge-emerald' },
];

const APT_CATEGORIES = [
  { id: 'quantitative', label: 'Quantitative' },
  { id: 'logical',      label: 'Logical'      },
  { id: 'verbal',       label: 'Verbal'       },
];

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   color: 'var(--accent-emerald)' },
  { id: 'medium', label: 'Medium', color: 'var(--accent-amber)'   },
  { id: 'hard',   label: 'Hard',   color: 'var(--accent-rose)'    },
];

const scoreColor = (s) =>
  s >= 70 ? 'var(--accent-emerald)' :
  s >= 40 ? 'var(--accent-amber)'   : 'var(--accent-rose)';

export default function Tests() {
  const [tab, setTab] = useState('aptitude');

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <Zap size={10} /> Practice Tests
        </div>
        <h1 className="page-title">Tests</h1>
        <p className="page-subtitle">Aptitude, SQL and Coding challenges with instant feedback</p>
      </motion.div>

      {/* ── Tab switcher ── */}
      <motion.div {...fadeUp(0.08)}
        style={{
          display: 'flex', gap: '4px', marginBottom: '1.5rem',
          background: 'var(--bg-elevated)', padding: '4px',
          borderRadius: '12px', border: '1px solid var(--border-subtle)',
          width: 'fit-content',
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 20px', borderRadius: '9px', border: 'none',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: tab === id ? 'var(--accent-indigo)' : 'transparent',
              color:      tab === id ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.18s',
            }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {tab === 'aptitude' && <AptitudeTest key="aptitude" />}
        {tab === 'sql'      && <SQLTest      key="sql"      />}
        {tab === 'coding'   && <CodingTest   key="coding"   />}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════
//  APTITUDE TEST
// ════════════════════════════════════════
function AptitudeTest() {
  const [screen,     setScreen]     = useState('select');  // select | test | result
  const [category,   setCategory]   = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});        // { questionId: selectedAnswer }
  const [current,    setCurrent]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [startTime,  setStartTime]  = useState(null);
  const timerRef = useRef(null);

  // ── Timer ──
  useEffect(() => {
    if (screen !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleStart = async (cat) => {
    setCategory(cat);
    setLoading(true);
    try {
      const { data } = await api.get(`/test/aptitude/questions?category=${cat.id}&limit=10`);
      setQuestions(data.questions);
      setTimeLeft(data.timeLimit || 600);
      setAnswers({});
      setCurrent(0);
      setStartTime(Date.now());
      setScreen('test');
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    if (!auto && Object.keys(answers).length < questions.length) {
      const unanswered = questions.length - Object.keys(answers).length;
      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
        timeTaken: Math.round((Date.now() - startTime) / 1000),
        category: category.id,
      };
      const { data } = await api.post('/test/aptitude/submit', payload);
      setResult(data);
      setScreen('result');
    } catch {
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setScreen('select'); setCategory(null); setQuestions([]);
    setAnswers({}); setCurrent(0); setResult(null);
  };

  // ── Select screen ──
  if (screen === 'select') return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {APT_CATEGORIES.map((cat, i) => (
          <motion.button key={cat.id} {...fadeUp(i * 0.07)}
            onClick={() => handleStart(cat)}
            disabled={loading}
            style={{
              textAlign: 'left', cursor: 'pointer', width: '100%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '14px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.background = 'var(--accent-indigo-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                {cat.label} Reasoning
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>10 questions · 10 minutes</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <div className="spinner" /> : <ChevronRight size={18} color="var(--accent-indigo)" />}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  // ── Test screen ──
  if (screen === 'test') {
    const q = questions[current];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Timer + progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 28, height: 4, borderRadius: '2px',
                background: answers[questions[i]?._id]
                  ? 'var(--accent-indigo)'
                  : i === current ? 'var(--accent-cyan)' : 'var(--bg-overlay)',
                transition: 'background 0.2s', cursor: 'pointer',
              }} onClick={() => setCurrent(i)} />
            ))}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '100px',
            background: timeLeft < 60 ? 'rgba(255,84,112,0.1)' : 'var(--bg-elevated)',
            border: `1px solid ${timeLeft < 60 ? 'rgba(255,84,112,0.3)' : 'var(--border-subtle)'}`,
          }}>
            <Clock size={13} color={timeLeft < 60 ? 'var(--accent-rose)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: timeLeft < 60 ? 'var(--accent-rose)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {fmtTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Question card */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Question {current + 1} of {questions.length}
            </span>
            <span className="badge badge-indigo">{category?.label}</span>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {q?.question}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q?.options?.map((opt, i) => {
              const isSelected = answers[q._id] === opt;
              return (
                <button key={i}
                  onClick={() => setAnswers(prev => ({ ...prev, [q._id]: opt }))}
                  style={{
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    padding: '12px 16px', borderRadius: '10px',
                    border: `1px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--accent-indigo-dim)' : 'var(--bg-elevated)',
                    color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.9rem', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-default)'}`,
                    background: isSelected ? 'var(--accent-indigo)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-muted)',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} className="btn btn-primary">
              Next →
            </button>
          ) : (
            <button onClick={() => handleSubmit()} disabled={submitting} className="btn btn-primary">
              {submitting ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Submitting...</> : <><Send size={14} /> Submit Test</>}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Result screen ──
  if (screen === 'result' && result) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Score banner */}
      <div className="card card-glow-indigo" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.25rem' }}>
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          <Trophy size={10} /> Test Complete
        </div>
        <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor(result.score), lineHeight: 1, marginBottom: '0.5rem' }}>
          {result.score}%
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {result.correct} / {result.total} correct · {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
        </p>
      </div>

      {/* Detailed results */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Question Review
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.detailedResults?.map((r, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: '10px',
              background: 'var(--bg-elevated)', border: `1px solid ${r.isCorrect ? 'rgba(0,229,160,0.2)' : 'rgba(255,84,112,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {r.isCorrect
                  ? <CheckCircle size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  : <XCircle    size={16} color="var(--accent-rose)"    style={{ flexShrink: 0, marginTop: '2px' }} />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.6 }}>
                    {r.question}
                  </p>
                  {!r.isCorrect && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent-rose)' }}>Your answer: </span>{r.selectedAnswer || '—'}
                      <span style={{ margin: '0 8px' }}>·</span>
                      <span style={{ color: 'var(--accent-emerald)' }}>Correct: </span>{r.correctAnswer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleReset} className="btn btn-primary btn-lg">
        <RotateCcw size={15} /> Take Another Test
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════
//  SQL TEST
// ════════════════════════════════════════
function SQLTest() {
  const [screen,     setScreen]     = useState('select');
  const [difficulty, setDifficulty] = useState(null);
  const [problem,    setProblem]    = useState(null);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [showHint,   setShowHint]   = useState(false);
  const [startTime,  setStartTime]  = useState(null);

  const handleStart = async (diff) => {
    setDifficulty(diff);
    setLoading(true);
    try {
      const { data } = await api.get(`/test/sql/problem?difficulty=${diff.id}`);
      setProblem(data);
      setQuery('SELECT ');
      setStartTime(Date.now());
      setScreen('test');
    } catch {
      toast.error('Failed to load SQL problem');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) { toast.error('Write a query first'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/test/sql/submit', {
        problemId: problem._id,
        userQuery: query,
        timeTaken: Math.round((Date.now() - startTime) / 1000),
      });
      setResult(data);
      setScreen('result');
    } catch {
      toast.error('Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setScreen('select'); setDifficulty(null);
    setProblem(null); setQuery(''); setResult(null); setShowHint(false);
  };

  if (screen === 'select') return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DIFFICULTIES.map((diff, i) => (
          <motion.button key={diff.id} {...fadeUp(i * 0.07)}
            onClick={() => handleStart(diff)} disabled={loading}
            style={{
              textAlign: 'left', cursor: 'pointer', width: '100%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '14px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = diff.color + '55'; e.currentTarget.style.background = diff.color + '11'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                {diff.label} SQL Problem
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {diff.id === 'easy' ? 'Basic SELECT, WHERE, ORDER BY' : diff.id === 'medium' ? 'JOINs, GROUP BY, aggregates' : 'Subqueries, CTEs, window functions'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diff.color }}>{diff.label}</span>
              {loading ? <div className="spinner" /> : <ChevronRight size={18} color={diff.color} />}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  if (screen === 'test' && problem) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Problem card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{problem.title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: difficulty?.color, padding: '3px 10px', borderRadius: '100px', background: difficulty?.color + '18', border: `1px solid ${difficulty?.color}44` }}>
            {difficulty?.label}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          {problem.description}
        </p>

        {/* Table structure */}
        {problem.tableStructure && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Table Structure
            </div>
            <pre style={{
              background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem',
              color: 'var(--accent-cyan)', overflowX: 'auto', margin: 0,
              fontFamily: 'monospace', lineHeight: 1.6,
            }}>
              {problem.tableStructure}
            </pre>
          </div>
        )}

        {/* Sample data */}
        {problem.sampleData && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Sample Data
            </div>
            <pre style={{
              background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem',
              color: 'var(--text-secondary)', overflowX: 'auto', margin: 0,
              fontFamily: 'monospace', lineHeight: 1.6,
            }}>
              {problem.sampleData}
            </pre>
          </div>
        )}

        {/* Expected output */}
        {problem.expectedOutput && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Expected Output
            </div>
            <pre style={{
              background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem',
              color: 'var(--accent-emerald)', overflowX: 'auto', margin: 0,
              fontFamily: 'monospace', lineHeight: 1.6,
            }}>
              {problem.expectedOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Hints */}
      {problem.hints?.length > 0 && (
        <div>
          <button onClick={() => setShowHint(s => !s)} className="btn btn-ghost btn-sm">
            <Lightbulb size={13} color="var(--accent-amber)" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.25)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
              >
                💡 {problem.hints[0]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SQL editor */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={13} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SQL Editor</span>
        </div>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={8}
          spellCheck={false}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--bg-surface)', border: 'none', outline: 'none',
            color: 'var(--accent-cyan)', fontFamily: 'monospace',
            fontSize: '0.9rem', lineHeight: 1.7, resize: 'vertical',
            boxSizing: 'border-box',
          }}
          placeholder="Write your SQL query here..."
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary btn-lg">
          {submitting
            ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Running...</>
            : <><Play size={15} /> Run Query</>
          }
        </button>
        <button onClick={handleReset} className="btn btn-ghost">Cancel</button>
      </div>
    </motion.div>
  );

  if (screen === 'result' && result) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={`card ${result.isCorrect ? 'card-glow-indigo' : ''}`}
        style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.25rem',
          borderColor: result.isCorrect ? 'rgba(0,229,160,0.4)' : 'rgba(255,84,112,0.4)',
          background: result.isCorrect ? 'rgba(0,229,160,0.05)' : 'rgba(255,84,112,0.05)',
        }}
      >
        {result.isCorrect
          ? <CheckCircle size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 1rem' }} />
          : <XCircle    size={48} color="var(--accent-rose)"    style={{ margin: '0 auto 1rem' }} />
        }
        <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: result.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginBottom: '6px' }}>
          {result.isCorrect ? 'Correct! 🎉' : 'Incorrect'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Score: {result.score}</p>
      </div>

      {result.feedback && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>Feedback</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.feedback}</p>
        </div>
      )}

      {result.expectedQuery && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-emerald)', marginBottom: '8px' }}>Expected Query</div>
          <pre style={{ background: 'var(--bg-overlay)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', color: 'var(--accent-cyan)', overflowX: 'auto', margin: 0, fontFamily: 'monospace' }}>
            {result.expectedQuery}
          </pre>
        </div>
      )}

      <button onClick={handleReset} className="btn btn-primary btn-lg">
        <RotateCcw size={15} /> Try Another Problem
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════
//  CODING TEST
// ════════════════════════════════════════
function CodingTest() {
  const [screen,     setScreen]     = useState('select');
  const [difficulty, setDifficulty] = useState(null);
  const [problem,    setProblem]    = useState(null);
  const [loading,    setLoading]    = useState(false);

  const handleStart = async (diff) => {
    setDifficulty(diff);
    setLoading(true);
    try {
      const { data } = await api.get(`/test/coding/problem?difficulty=${diff.id}`);
      setProblem(data);
      setScreen('problem');
    } catch {
      toast.error('Failed to load coding problem');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setScreen('select'); setDifficulty(null); setProblem(null); };

  if (screen === 'select') return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', borderRadius: '12px', marginBottom: '1.25rem',
        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
      }}>
        <AlertCircle size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.825rem', color: 'var(--accent-cyan)' }}>
          Coding problems are displayed with test cases. Write your solution in your preferred IDE and verify manually.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DIFFICULTIES.map((diff, i) => (
          <motion.button key={diff.id} {...fadeUp(i * 0.07)}
            onClick={() => handleStart(diff)} disabled={loading}
            style={{
              textAlign: 'left', cursor: 'pointer', width: '100%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '14px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = diff.color + '55'; e.currentTarget.style.background = diff.color + '11'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                {diff.label} Problem
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {diff.id === 'easy' ? 'Arrays, strings, basic loops' : diff.id === 'medium' ? 'Recursion, sorting, hashing' : 'DP, graphs, advanced algorithms'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diff.color }}>{diff.label}</span>
              {loading ? <div className="spinner" /> : <ChevronRight size={18} color={diff.color} />}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  if (screen === 'problem' && problem) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{problem.title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: difficulty?.color, padding: '3px 10px', borderRadius: '100px', background: difficulty?.color + '18', border: `1px solid ${difficulty?.color}44` }}>
            {difficulty?.label}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>{problem.description}</p>

        {[
          { label: 'Input Format',   value: problem.inputFormat,   color: 'var(--accent-indigo)' },
          { label: 'Output Format',  value: problem.outputFormat,  color: 'var(--accent-cyan)'   },
          { label: 'Constraints',    value: problem.constraints,   color: 'var(--accent-amber)'  },
          { label: 'Sample Input',   value: problem.sampleInput,   color: 'var(--accent-emerald)'},
          { label: 'Sample Output',  value: problem.sampleOutput,  color: 'var(--accent-emerald)'},
        ].filter(x => x.value).map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
            <pre style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color, overflowX: 'auto', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
              {value}
            </pre>
          </div>
        ))}

        {/* Test cases */}
        {problem.testCases?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Test Cases ({problem.testCases.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problem.testCases.map((tc, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>INPUT {i+1}</div>
                    <pre style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{tc.input}</pre>
                  </div>
                  <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>OUTPUT {i+1}</div>
                    <pre style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', margin: 0, fontFamily: 'monospace' }}>{tc.output}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleReset} className="btn btn-primary">
          <BarChart2 size={14} /> Try Another Problem
        </button>
        <button onClick={handleReset} className="btn btn-ghost">← Back</button>
      </div>
    </motion.div>
  );
}