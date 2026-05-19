import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Send, RotateCcw, LayoutDashboard,
  Zap, Shield, Flame, Users, Clock, ChevronRight,
  AlertTriangle, Keyboard, Volume2, MessageSquare,
  Star, TrendingUp, TrendingDown, History, Plus
} from 'lucide-react';
import api from '../utils/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

// ── Interview modes ──
const MODES = [
  {
    id: 'friendly',
    label: 'Friendly',
    icon: Users,
    accent: '#00E5A0',
    accentDim: 'rgba(0,229,160,0.12)',
    accentBorder: 'rgba(0,229,160,0.3)',
    badge: 'badge-emerald',
    desc: 'Relaxed and encouraging. Great for beginners.',
  },
  {
    id: 'strict',
    label: 'Strict',
    icon: Shield,
    accent: '#5B6CFF',
    accentDim: 'rgba(91,108,255,0.12)',
    accentBorder: 'rgba(91,108,255,0.3)',
    badge: 'badge-indigo',
    desc: 'Professional and formal. Industry standard.',
  },
  {
    id: 'pressure',
    label: 'Pressure',
    icon: Flame,
    accent: '#FF5470',
    accentDim: 'rgba(255,84,112,0.12)',
    accentBorder: 'rgba(255,84,112,0.3)',
    badge: 'badge-rose',
    desc: 'Intense and challenging. For the brave.',
  },
  {
    id: 'hr',
    label: 'HR Round',
    icon: Star,
    accent: '#FFB547',
    accentDim: 'rgba(255,181,71,0.12)',
    accentBorder: 'rgba(255,181,71,0.3)',
    badge: 'badge-amber',
    desc: 'Behavioural and situational questions.',
  },
];

// ── Speech synthesis helper ──
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
};

const stopSpeaking = () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};

export default function Interview() {
  // ── Tab state ──
  const [tab, setTab] = useState('new'); // 'new' | 'history'

  // ── Screen state ──
  const [screen, setScreen] = useState('select'); // 'select' | 'chat' | 'feedback'

  // ── Interview state ──
  const [selectedMode, setSelectedMode] = useState(null);
  const [interviewId,  setInterviewId]  = useState(null);
  const [messages,     setMessages]     = useState([]); // { role: 'ai'|'user', text }
  const [feedback,     setFeedback]     = useState(null);
  const [starting,     setStarting]     = useState(false);
  const [sending,      setSending]      = useState(false);

  // ── Input state ──
  const [inputMode,   setInputMode]   = useState('voice'); // 'voice' | 'type'
  const [typedAnswer, setTypedAnswer] = useState('');
  const [transcript,  setTranscript]  = useState('');
  const [listening,   setListening]   = useState(false);

  // ── History state ──
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Speech API support ──
  const speechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const synthSupported  = 'speechSynthesis' in window;

  const recognitionRef = useRef(null);
  const chatEndRef     = useRef(null);

  // ── Auto scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  // ── Load history when tab switches ──
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/interview');
      setHistory(data);
    } catch {
      toast.error('Could not load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Start interview ──
  const handleStart = async (mode) => {
    setSelectedMode(mode);
    setStarting(true);
    try {
      const { data } = await api.post('/interview/start', { mode: mode.id });
      setInterviewId(data.interviewId);
      setMessages([{ role: 'ai', text: data.question }]);
      setScreen('chat');
      if (inputMode === 'voice' && synthSupported) speak(data.question);
    } catch {
      toast.error('Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  // ── Send answer ──
  const handleSend = async (answerText) => {
    const answer = (answerText || typedAnswer || transcript).trim();
    if (!answer) { toast.error('Please provide an answer'); return; }

    stopSpeaking();
    setMessages(prev => [...prev, { role: 'user', text: answer }]);
    setTypedAnswer('');
    setTranscript('');
    setSending(true);

    try {
      const { data } = await api.post('/interview/answer', { interviewId, answer });
      if (data.completed) {
        setFeedback(data.feedback);
        setScreen('feedback');
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.question }]);
        if (inputMode === 'voice' && synthSupported) speak(data.question);
      }
    } catch {
      toast.error('Failed to submit answer');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // ── Voice recognition ──
  const startListening = () => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(prev => prev + final || interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') toast.error('Mic error: ' + e.error);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    stopSpeaking();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  // ── Reset ──
  const handleReset = () => {
    stopSpeaking();
    stopListening();
    setScreen('select');
    setSelectedMode(null);
    setInterviewId(null);
    setMessages([]);
    setFeedback(null);
    setTypedAnswer('');
    setTranscript('');
  };

  const scoreColor = (s) =>
    s >= 70 ? 'var(--accent-emerald)' :
    s >= 40 ? 'var(--accent-amber)'   : 'var(--accent-rose)';

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <Mic size={10} /> AI Interview
        </div>
        <h1 className="page-title">Mock Interview</h1>
        <p className="page-subtitle">Practice with an AI interviewer and get detailed feedback</p>
      </motion.div>

      {/* ── Browser warning ── */}
      {!speechSupported && (
        <motion.div {...fadeUp(0.05)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '12px', marginBottom: '1.25rem',
            background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.3)',
          }}
        >
          <AlertTriangle size={16} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--accent-amber)' }}>
            Your browser doesn't support the Speech API. Voice mode is unavailable — please use Chrome or Edge for the full experience.
          </p>
        </motion.div>
      )}

      {/* ── Tabs (only on select screen) ── */}
      {screen === 'select' && (
        <motion.div {...fadeUp(0.08)}
          style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem',
            background: 'var(--bg-elevated)', padding: '4px', borderRadius: '12px',
            border: '1px solid var(--border-subtle)', width: 'fit-content',
          }}
        >
          {[
            { id: 'new',     label: 'New Interview', icon: Plus    },
            { id: 'history', label: 'Past Interviews', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '9px', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                fontFamily: 'var(--font-body)',
                background: tab === id ? 'var(--accent-indigo)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.18s',
              }}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </motion.div>
      )}

      {/* ════════════════════════════════
          TAB: NEW INTERVIEW
      ════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {tab === 'new' && (
          <motion.div key="new"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >

            {/* ── SCREEN: Mode Selection ── */}
            {screen === 'select' && (
              <div className="grid-2" style={{ gap: '1rem' }}>
                {MODES.map((mode, i) => {
                  const Icon = mode.icon;
                  return (
                    <motion.div key={mode.id} {...fadeUp(0.1 + i * 0.07)}>
                      <button
                        onClick={() => handleStart(mode)}
                        disabled={starting}
                        style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer',
                          background: 'var(--bg-surface)',
                          border: `1px solid var(--border-subtle)`,
                          borderRadius: '16px', padding: '1.5rem',
                          transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '12px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = mode.accentBorder;
                          e.currentTarget.style.background  = mode.accentDim;
                          e.currentTarget.style.transform   = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.background  = 'var(--bg-surface)';
                          e.currentTarget.style.transform   = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '12px',
                            background: mode.accentDim,
                            border: `1px solid ${mode.accentBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={20} color={mode.accent} />
                          </div>
                          <span className={`badge ${mode.badge}`}>{mode.label}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                            {mode.label} Interview
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                            {mode.desc}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: mode.accent, fontWeight: 600 }}>
                          Start Interview <ChevronRight size={13} />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── SCREEN: Chat ── */}
            {screen === 'chat' && selectedMode && (
              <motion.div key="chat" {...fadeUp(0)}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                  {/* Chat header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    flexWrap: 'wrap', gap: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '10px',
                        background: selectedMode.accentDim,
                        border: `1px solid ${selectedMode.accentBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <selectedMode.icon size={16} color={selectedMode.accent} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedMode.label} Interview
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Answer all 5 questions
                        </div>
                      </div>
                    </div>

                    {/* Voice / Type toggle */}
                    <div style={{
                      display: 'flex', gap: '4px',
                      background: 'var(--bg-overlay)', padding: '3px',
                      borderRadius: '9px', border: '1px solid var(--border-subtle)',
                    }}>
                      {[
                        { id: 'voice', label: 'Voice', icon: Volume2 },
                        { id: 'type',  label: 'Type',  icon: Keyboard },
                      ].map(({ id, label, icon: Icon }) => (
                        <button key={id}
                          onClick={() => { setInputMode(id); stopListening(); stopSpeaking(); }}
                          disabled={id === 'voice' && !speechSupported}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '7px', border: 'none',
                            cursor: id === 'voice' && !speechSupported ? 'not-allowed' : 'pointer',
                            fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                            background: inputMode === id ? 'var(--bg-surface)' : 'transparent',
                            color: inputMode === id ? 'var(--accent-indigo)' : 'var(--text-muted)',
                            boxShadow: inputMode === id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                            transition: 'all 0.15s',
                            opacity: id === 'voice' && !speechSupported ? 0.4 : 1,
                          }}
                        >
                          <Icon size={13} />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{
                    height: '420px', overflowY: 'auto',
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                  }}>
                    {messages.map((msg, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {/* AI avatar */}
                        {msg.role === 'ai' && (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginRight: '10px', alignSelf: 'flex-end',
                          }}>
                            <Zap size={14} color="#fff" />
                          </div>
                        )}

                        <div style={{
                          maxWidth: '75%',
                          padding: '12px 16px',
                          borderRadius: msg.role === 'ai'
                            ? '4px 16px 16px 16px'
                            : '16px 4px 16px 16px',
                          background: msg.role === 'ai'
                            ? 'var(--bg-elevated)'
                            : 'linear-gradient(135deg, var(--accent-indigo), #7B8FFF)',
                          border: msg.role === 'ai'
                            ? '1px solid var(--border-subtle)' : 'none',
                          color: msg.role === 'ai' ? 'var(--text-primary)' : '#fff',
                          fontSize: '0.9rem', lineHeight: 1.6,
                        }}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}

                    {/* Sending indicator */}
                    {sending && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Zap size={14} color="#fff" />
                        </div>
                        <div style={{
                          padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          display: 'flex', gap: '4px', alignItems: 'center',
                        }}>
                          {[0,1,2].map(j => (
                            <motion.div key={j}
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.15 }}
                              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-elevated)',
                  }}>
                    {inputMode === 'voice' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Live transcript */}
                        {/* Editable transcript */}
{(transcript || listening) && (
  <textarea
    value={transcript}
    onChange={e => setTranscript(e.target.value)}
    placeholder="Listening... you can edit this text before sending"
    rows={3}
    className="form-input"
    style={{ resize: 'none', lineHeight: 1.6, fontSize: '0.875rem' }}
  />
)}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Mic button */}
                          <motion.button
                            onClick={toggleListening}
                            disabled={sending}
                            whileTap={{ scale: 0.93 }}
                            style={{
                              width: 52, height: 52, borderRadius: '50%', border: 'none',
                              cursor: sending ? 'not-allowed' : 'pointer',
                              background: listening
                                ? 'var(--accent-rose)'
                                : 'linear-gradient(135deg, var(--accent-indigo), #7B8FFF)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: listening
                                ? '0 0 0 8px rgba(255,84,112,0.2), 0 0 20px rgba(255,84,112,0.3)'
                                : '0 4px 16px rgba(91,108,255,0.35)',
                              transition: 'all 0.2s', flexShrink: 0,
                            }}
                          >
                            {listening
                              ? <MicOff size={20} color="#fff" />
                              : <Mic size={20} color="#fff" />
                            }
                          </motion.button>

                          {/* Pulsing ring when listening */}
                          {listening && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)' }}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                                Recording...
                              </span>
                            </div>
                          )}

                          {/* Send button (only if transcript exists) */}
                          {transcript && !listening && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => handleSend(transcript)}
                              disabled={sending}
                              className="btn btn-primary"
                              style={{ marginLeft: 'auto' }}
                            >
                              <Send size={15} /> Send Answer
                            </motion.button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          {listening ? 'Tap mic to stop recording' : 'Tap mic to start speaking'}
                        </p>
                      </div>
                    ) : (
                      /* Type mode */
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <textarea
                          value={typedAnswer}
                          onChange={e => setTypedAnswer(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder="Type your answer here... (Enter to send, Shift+Enter for new line)"
                          rows={3}
                          className="form-input"
                          style={{ flex: 1, resize: 'none', lineHeight: 1.6 }}
                        />
                        <button
                          onClick={() => handleSend()}
                          disabled={sending || !typedAnswer.trim()}
                          className="btn btn-primary"
                          style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCREEN: Feedback ── */}
            {screen === 'feedback' && feedback && (
              <motion.div key="feedback" {...fadeUp(0)}>
                {/* Score banner */}
                <div className="card card-glow-indigo" style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem' }}>
                  <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                    <Star size={10} /> Interview Complete
                  </div>
                  <div style={{
                    fontSize: '4rem', fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: scoreColor(feedback.overallScore),
                    lineHeight: 1,
                    marginBottom: '0.5rem',
                  }}>
                    {feedback.overallScore}%
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Overall Score
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Technical Knowledge', value: feedback.technicalKnowledge },
                    { label: 'Communication',        value: feedback.communication      },
                    { label: 'Confidence',           value: feedback.confidence         },
                    { label: 'Logical Thinking',     value: feedback.logicalThinking    },
                  ].map(({ label, value }) => (
                    <div key={label} className="card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: scoreColor(value) }}>{value}%</span>
                      </div>
                      <div className="progress-track">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          style={{ background: scoreColor(value) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths & weaknesses */}
                <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <TrendingUp size={14} color="var(--accent-emerald)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-emerald)' }}>
                        Strengths
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {feedback.strengths?.map((s, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--accent-emerald)', flexShrink: 0 }}>✓</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <TrendingDown size={14} color="var(--accent-rose)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-rose)' }}>
                        Weaknesses
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {feedback.weaknesses?.map((w, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--accent-rose)', flexShrink: 0 }}>✗</span> {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Why you might not get selected */}
                {feedback.whyYouMightNotGetSelected && (
                  <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'rgba(255,84,112,0.3)', background: 'rgba(255,84,112,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <AlertTriangle size={14} color="var(--accent-rose)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-rose)' }}>
                        Why you might not get selected
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {feedback.whyYouMightNotGetSelected}
                    </p>
                  </div>
                )}

                {/* Summary */}
                {feedback.summary && (
                  <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <MessageSquare size={14} color="var(--accent-indigo)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-indigo)' }}>
                        Summary
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {feedback.summary}
                    </p>
                  </div>
                )}

                {/* Improvement suggestions */}
                {feedback.improvementSuggestions?.length > 0 && (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Zap size={14} color="var(--accent-amber)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-amber)' }}>
                        How to improve
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {feedback.improvementSuggestions.map((tip, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          padding: '8px 12px', borderRadius: '8px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--accent-amber-dim)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-amber)',
                          }}>{i + 1}</span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={handleReset} className="btn btn-primary btn-lg">
                    <RotateCcw size={16} /> Start New Interview
                  </button>
                  <button onClick={() => window.location.href = '/dashboard'} className="btn btn-secondary btn-lg">
                    <LayoutDashboard size={16} /> Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════
            TAB: HISTORY
        ════════════════════════════════ */}
        {tab === 'history' && screen === 'select' && (
          <motion.div key="history"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {historyLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No past interviews yet. Start one above!
                </p>
                <button onClick={() => setTab('new')} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  <Plus size={14} /> Start Interview
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((item, i) => {
                  const mode = MODES.find(m => m.id === item.mode) || MODES[0];
                  return (
                    <motion.div key={item._id} {...fadeUp(i * 0.05)} className="card card-interactive"
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '1rem 1.25rem' }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                        background: mode.accentDim, border: `1px solid ${mode.accentBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <mode.icon size={16} color={mode.accent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {mode.label} Interview
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{item.questionCount || 0} questions
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${item.status === 'completed' ? 'badge-emerald' : 'badge-muted'}`}>
                          {item.status}
                        </span>
                        <Clock size={13} color="var(--text-muted)" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}