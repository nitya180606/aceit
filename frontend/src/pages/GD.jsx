import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MessageSquare, Mic, MicOff, Clock, Send,
  RotateCcw, LayoutDashboard, Zap, Users,
  TrendingUp, TrendingDown, Star, History,
  Plus, AlertTriangle, ChevronRight
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

// ── AI Participants ──
const AI_PARTICIPANTS = {
  Alex:   { color: '#5B6CFF', bg: 'rgba(91,108,255,0.15)'  },
  Sam:    { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)'   },
  Jordan: { color: '#00E5A0', bg: 'rgba(0,229,160,0.12)'   },
};

// ── Suggested GD topics ──
const TOPICS = [
  'Is AI a threat to employment?',
  'Should social media be regulated by governments?',
  'Remote work vs office work — which is better?',
  'Is the startup culture sustainable long-term?',
  'Should coding be mandatory in schools?',
  'Climate change: individual vs corporate responsibility',
];

export default function GD() {
  const [tab,    setTab]    = useState('new');      // new | history
  const [screen, setScreen] = useState('select');   // select | chat | feedback

  // ── Session state ──
  const [sessionId,  setSessionId]  = useState(null);
  const [topic,      setTopic]      = useState('');
  const [customTopic,setCustomTopic]= useState('');
  const [messages,   setMessages]   = useState([]);
  const [feedback,   setFeedback]   = useState(null);
  const [starting,   setStarting]   = useState(false);
  const [ending,     setEnding]     = useState(false);
  const [aiTyping,   setAiTyping]   = useState(false);

  // ── Timer state ──
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [timerActive,setTimerActive]= useState(false);
  const timerRef = useRef(null);

  // ── Voice state ──
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState('');
  const speechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const recognitionRef = useRef(null);

  // ── History state ──
  const [history,       setHistory]       = useState([]);
  const [historyLoading,setHistoryLoading]= useState(false);

  const chatEndRef = useRef(null);

  // ── Auto scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  // ── Timer ──
  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          handleEndGD();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // ── Load history ──
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/gd');
      setHistory(data);
    } catch {
      toast.error('Could not load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Start GD ──
  const handleStart = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) { toast.error('Please select or enter a topic'); return; }
    setStarting(true);
    try {
      const { data } = await api.post('/gd/start', { topic: finalTopic });
      setSessionId(data.sessionId);
      setTimeLeft(data.timeLimit || 300);

      // Add opening messages from AI
      const openingMsgs = (data.messages || []).map(m => ({
        role: 'ai',
        participant: m.participant,
        text: m.message,
      }));
      setMessages(openingMsgs);
      setTimerActive(true);
      setScreen('chat');
    } catch {
      toast.error('Failed to start GD session');
    } finally {
      setStarting(false);
    }
  };

  // ── Send message (voice transcript) ──
  const handleSend = async (text) => {
    const msg = (text || transcript).trim();
    if (!msg) { toast.error('Say something first'); return; }

    // Stop listening
    stopListening();

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setTranscript('');
    setAiTyping(true);

    try {
      const { data } = await api.post('/gd/message', { sessionId, message: msg });

      // Add AI responses with slight delay between each
      const responses = data.aiResponses || [];
      for (let i = 0; i < responses.length; i++) {
        await new Promise(r => setTimeout(r, i * 800));
        setMessages(prev => [...prev, {
          role: 'ai',
          participant: responses[i].participant,
          text: responses[i].message,
        }]);
      }
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setAiTyping(false);
    }
  };

  // ── End GD ──
  const handleEndGD = async () => {
    if (!sessionId) return;
    clearInterval(timerRef.current);
    setTimerActive(false);
    setEnding(true);
    try {
      const { data } = await api.post('/gd/end', { sessionId });
      setFeedback(data.feedback);
      setScreen('feedback');
    } catch {
      toast.error('Failed to end session');
    } finally {
      setEnding(false);
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
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(prev => (prev + final) || interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') toast.error('Mic error: ' + e.error);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
      // auto send if transcript exists
      if (transcript.trim()) handleSend(transcript);
    } else {
      startListening();
    }
  };

  // ── Reset ──
  const handleReset = () => {
    clearInterval(timerRef.current);
    stopListening();
    setScreen('select');
    setSessionId(null);
    setTopic('');
    setCustomTopic('');
    setMessages([]);
    setFeedback(null);
    setTimeLeft(0);
    setTimerActive(false);
    setTranscript('');
  };

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-cyan)' }} />
        <div className="badge badge-cyan" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <Users size={10} /> Group Discussion
        </div>
        <h1 className="page-title">GD Simulator</h1>
        <p className="page-subtitle">Practice group discussions with AI participants Alex, Sam & Jordan</p>
      </motion.div>

      {/* ── Speech API warning ── */}
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
            Voice input unavailable on this browser. Use Chrome or Edge for the full GD experience.
          </p>
        </motion.div>
      )}

      {/* ── Tabs (only on select screen) ── */}
      {screen === 'select' && (
        <motion.div {...fadeUp(0.08)}
          style={{
            display: 'flex', gap: '4px', marginBottom: '1.5rem',
            background: 'var(--bg-elevated)', padding: '4px',
            borderRadius: '12px', border: '1px solid var(--border-subtle)',
            width: 'fit-content',
          }}
        >
          {[
            { id: 'new',     label: 'New GD',      icon: Plus    },
            { id: 'history', label: 'Past GDs',    icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '9px', border: 'none',
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
      )}

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════
            TAB: NEW GD
        ════════════════════════════════ */}
        {tab === 'new' && (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── SCREEN: Topic Selection ── */}
            {screen === 'select' && (
              <motion.div {...fadeUp(0.1)}>

                {/* AI participants preview */}
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Users size={15} color="var(--accent-cyan)" />
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      Your AI Discussion Partners
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {Object.entries(AI_PARTICIPANTS).map(([name, style]) => (
                      <div key={name} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', borderRadius: '10px',
                        background: style.bg,
                        border: `1px solid ${style.color}33`,
                        flex: 1, minWidth: '140px',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: style.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.875rem', color: '#fff',
                          fontFamily: 'var(--font-display)',
                        }}>
                          {name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Participant</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic selection */}
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <MessageSquare size={15} color="var(--accent-indigo)" />
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      Choose a Topic
                    </h3>
                  </div>

                  {/* Suggested topics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                    {TOPICS.map((t, i) => (
                      <motion.button key={i}
                        onClick={() => { setTopic(t); setCustomTopic(''); }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          textAlign: 'left', cursor: 'pointer', width: '100%',
                          padding: '12px 16px', borderRadius: '10px',
                          background: topic === t ? 'var(--accent-indigo-dim)' : 'var(--bg-elevated)',
                          border: `1px solid ${topic === t ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                          color: topic === t ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                          fontWeight: topic === t ? 600 : 400,
                          fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t}
                        {topic === t && <ChevronRight size={14} color="var(--accent-indigo)" />}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom topic */}
                  <div className="form-group">
                    <label className="form-label">Or enter your own topic</label>
                    <input
                      className="form-input"
                      placeholder="Type a custom GD topic..."
                      value={customTopic}
                      onChange={e => { setCustomTopic(e.target.value); setTopic(''); }}
                    />
                  </div>
                </div>

                {/* Start button */}
                <motion.button
                  onClick={handleStart}
                  disabled={starting || (!topic && !customTopic.trim())}
                  className="btn btn-primary btn-lg"
                  whileTap={{ scale: 0.97 }}
                >
                  {starting
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Starting...</>
                    : <><Zap size={16} /> Start GD Session</>
                  }
                </motion.button>
              </motion.div>
            )}

            {/* ── SCREEN: Chat ── */}
            {screen === 'chat' && (
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        GD: {customTopic || topic}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Object.entries(AI_PARTICIPANTS).map(([name, style]) => (
                          <div key={name} style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: style.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                          }}>{name[0]}</div>
                        ))}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Alex, Sam & Jordan
                        </span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '100px',
                      background: timeLeft < 60 ? 'rgba(255,84,112,0.1)' : 'var(--bg-overlay)',
                      border: `1px solid ${timeLeft < 60 ? 'rgba(255,84,112,0.3)' : 'var(--border-subtle)'}`,
                    }}>
                      <Clock size={13} color={timeLeft < 60 ? 'var(--accent-rose)' : 'var(--text-muted)'} />
                      <span style={{
                        fontSize: '0.9rem', fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        color: timeLeft < 60 ? 'var(--accent-rose)' : 'var(--text-primary)',
                      }}>
                        {fmtTime(timeLeft)}
                      </span>
                    </div>

                    {/* End button */}
                    <button
                      onClick={handleEndGD}
                      disabled={ending}
                      className="btn btn-secondary btn-sm"
                      style={{ borderColor: 'rgba(255,84,112,0.4)', color: 'var(--accent-rose)' }}
                    >
                      {ending
                        ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Ending...</>
                        : 'End GD'
                      }
                    </button>
                  </div>

                  {/* Messages */}
                  <div style={{
                    height: '460px', overflowY: 'auto',
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                  }}>
                    {messages.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      const aiStyle = msg.participant ? AI_PARTICIPANTS[msg.participant] : null;
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                        >
                          {/* AI avatar */}
                          {!isUser && aiStyle && (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: aiStyle.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '0.75rem', color: '#fff',
                              marginRight: '10px', alignSelf: 'flex-end',
                              fontFamily: 'var(--font-display)',
                            }}>
                              {msg.participant[0]}
                            </div>
                          )}

                          <div style={{ maxWidth: '75%' }}>
                            {/* Participant name */}
                            {!isUser && msg.participant && (
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: aiStyle?.color, marginBottom: '4px', paddingLeft: '2px' }}>
                                {msg.participant}
                              </div>
                            )}
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                              background: isUser
                                ? 'linear-gradient(135deg, var(--accent-indigo), #7B8FFF)'
                                : aiStyle ? aiStyle.bg : 'var(--bg-elevated)',
                              border: isUser ? 'none' : `1px solid ${aiStyle ? aiStyle.color + '33' : 'var(--border-subtle)'}`,
                              color: isUser ? '#fff' : 'var(--text-primary)',
                              fontSize: '0.875rem', lineHeight: 1.6,
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* AI typing indicator */}
                    {aiTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--accent-indigo)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                        }}>A</div>
                        <div style={{
                          padding: '10px 14px', borderRadius: '4px 16px 16px 16px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          display: 'flex', gap: '4px', alignItems: 'center',
                        }}>
                          {[0, 1, 2].map(j => (
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

                  {/* Voice input area */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-elevated)',
                  }}>
                    {/* Live transcript — editable */}
                    {(transcript || listening) && (
                      <textarea
                        value={transcript}
                        onChange={e => setTranscript(e.target.value)}
                        rows={2}
                        className="form-input"
                        placeholder="Listening... edit before sending"
                        style={{ marginBottom: '10px', resize: 'none', fontSize: '0.875rem', lineHeight: 1.6 }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Mic button */}
                      <motion.button
                        onClick={toggleListening}
                        disabled={aiTyping || ending}
                        whileTap={{ scale: 0.92 }}
                        style={{
                          width: 56, height: 56, borderRadius: '50%', border: 'none',
                          cursor: aiTyping || ending ? 'not-allowed' : 'pointer',
                          background: listening
                            ? 'var(--accent-rose)'
                            : 'linear-gradient(135deg, var(--accent-indigo), #7B8FFF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: listening
                            ? '0 0 0 10px rgba(255,84,112,0.15), 0 0 24px rgba(255,84,112,0.3)'
                            : '0 4px 20px rgba(91,108,255,0.4)',
                          transition: 'all 0.2s', flexShrink: 0,
                          opacity: aiTyping || ending ? 0.5 : 1,
                        }}
                      >
                        {listening
                          ? <MicOff size={22} color="#fff" />
                          : <Mic    size={22} color="#fff" />
                        }
                      </motion.button>

                      {/* Status text */}
                      <div style={{ flex: 1 }}>
                        {listening ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <motion.div
                              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-rose)', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                              Recording... tap to stop & send
                            </span>
                          </div>
                        ) : aiTyping ? (
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            AI participants are responding...
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Tap mic to speak your point
                          </span>
                        )}
                      </div>

                      {/* Manual send if transcript exists but not listening */}
                      {transcript && !listening && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => handleSend(transcript)}
                          disabled={aiTyping}
                          className="btn btn-primary btn-sm"
                        >
                          <Send size={14} /> Send
                        </motion.button>
                      )}
                    </div>

                    {/* Hint */}
                    {!speechSupported && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '8px' }}>
                        Voice not supported. Use Chrome or Edge.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCREEN: Feedback ── */}
            {screen === 'feedback' && feedback && (
              <motion.div key="feedback" {...fadeUp(0)}>

                {/* Overall score */}
                <div className="card card-glow-indigo" style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem' }}>
                  <div className="badge badge-cyan" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                    <Star size={10} /> GD Complete
                  </div>
                  <div style={{
                    fontSize: '4rem', fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: scoreColor(feedback.overallScore),
                    lineHeight: 1, marginBottom: '0.5rem',
                  }}>
                    {feedback.overallScore}%
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Overall GD Score</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                    Topic: {customTopic || topic}
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Communication', value: feedback.communication  },
                    { label: 'Leadership',     value: feedback.leadership     },
                    { label: 'Clarity',        value: feedback.clarity        },
                    { label: 'Participation',  value: feedback.participation  },
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
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-emerald)' }}>
                        Strengths
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {feedback.strengths?.map((s, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--accent-emerald)', flexShrink: 0 }}>✓</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <TrendingDown size={14} color="var(--accent-rose)" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-rose)' }}>
                        Weaknesses
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {feedback.weaknesses?.map((w, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--accent-rose)', flexShrink: 0 }}>✗</span>{w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {feedback.suggestions?.length > 0 && (
                  <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Zap size={14} color="var(--accent-amber)" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-amber)' }}>
                        Suggestions
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {feedback.suggestions.map((s, i) => (
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
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {feedback.summary && (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <MessageSquare size={14} color="var(--accent-cyan)" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)' }}>
                        Summary
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                      {feedback.summary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={handleReset} className="btn btn-primary btn-lg">
                    <RotateCcw size={16} /> Start New GD
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
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {historyLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No past GD sessions yet.</p>
                <button onClick={() => setTab('new')} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  <Plus size={14} /> Start a GD
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((item, i) => (
                  <motion.div key={item._id} {...fadeUp(i * 0.05)}
                    className="card"
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '1rem 1.25rem' }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                      background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageSquare size={16} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.topic}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <span className={`badge ${item.status === 'completed' ? 'badge-emerald' : 'badge-muted'}`}>
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}