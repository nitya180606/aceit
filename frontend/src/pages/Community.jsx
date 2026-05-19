import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Plus, ThumbsUp, MessageSquare, ChevronDown,
  ChevronUp, Tag, Building, Briefcase, Star, Send,
  ArrowLeft, Trash2, Filter, Search, Zap, Clock
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const RESULTS      = ['selected', 'rejected', 'pending'];

const diffColor = (d) =>
  d === 'easy'   ? 'badge-emerald' :
  d === 'medium' ? 'badge-amber'   : 'badge-rose';

const resultColor = (r) =>
  r === 'selected' ? 'badge-emerald' :
  r === 'rejected' ? 'badge-rose'    : 'badge-amber';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function Community() {
  const { user } = useAuth();
  const [screen, setScreen] = useState('list'); // list | create | detail

  // ── List state ──
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [filterDiff,  setFilterDiff]  = useState('');

  // ── Detail state ──
  const [selected,    setSelected]    = useState(null);
  const [comment,     setComment]     = useState('');
  const [commenting,  setCommenting]  = useState(false);
  const [detailLoad,  setDetailLoad]  = useState(false);

  // ── Create state ──
  const [form, setForm] = useState({
    company: '', role: '', experience: '',
    difficulty: 'medium', result: 'pending',
    tags: '', rounds: [{ roundName: '', description: '', questions: '' }],
  });
  const [creating, setCreating] = useState(false);

  // ── Fetch posts ──
  useEffect(() => {
    fetchPosts();
  }, [page, filterDiff]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filterDiff) params.append('difficulty', filterDiff);
      if (search.trim()) params.append('company', search.trim());
      const { data } = await api.get(`/community?${params}`);
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  // ── Open post detail ──
  const openPost = async (id) => {
    setDetailLoad(true);
    setScreen('detail');
    try {
      const { data } = await api.get(`/community/${id}`);
      setSelected(data);
    } catch {
      toast.error('Failed to load post');
      setScreen('list');
    } finally {
      setDetailLoad(false);
    }
  };

  // ── Upvote ──
  const handleUpvote = async (postId, e) => {
    e?.stopPropagation();
    try {
      const { data } = await api.put(`/community/${postId}/upvote`);
      // update in list
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, upvotes: data.upvotes } : p));
      // update in detail
      if (selected?._id === postId) setSelected(prev => ({ ...prev, upvotes: data.upvotes }));
    } catch {
      toast.error('Could not upvote');
    }
  };

  // ── Comment ──
  const handleComment = async () => {
    if (!comment.trim()) { toast.error('Write a comment first'); return; }
    setCommenting(true);
    try {
      const { data } = await api.post(`/community/${selected._id}/comment`, { text: comment });
      setSelected(prev => ({ ...prev, comments: data }));
      setComment('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  // ── Delete post ──
  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/community/${postId}`);
      toast.success('Post deleted');
      if (screen === 'detail') setScreen('list');
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Create post ──
  const handleCreate = async () => {
    if (!form.company || !form.role) { toast.error('Company and role are required'); return; }
    setCreating(true);
    try {
      const payload = {
        company:    form.company,
        role:       form.role,
        experience: form.experience,
        difficulty: form.difficulty,
        result:     form.result,
        tags:       form.tags.split(',').map(t => t.trim()).filter(Boolean),
        rounds:     form.rounds.map(r => ({
          roundName:   r.roundName,
          description: r.description,
          questions:   r.questions.split('\n').filter(Boolean),
        })),
      };
      const { data } = await api.post('/community', payload);
      toast.success('Experience shared! 🎉');
      setPosts(prev => [data, ...prev]);
      setScreen('list');
      setForm({
        company: '', role: '', experience: '',
        difficulty: 'medium', result: 'pending',
        tags: '', rounds: [{ roundName: '', description: '', questions: '' }],
      });
    } catch {
      toast.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const addRound = () => setForm(prev => ({
    ...prev,
    rounds: [...prev.rounds, { roundName: '', description: '', questions: '' }],
  }));

  const updateRound = (i, field, value) => setForm(prev => ({
    ...prev,
    rounds: prev.rounds.map((r, idx) => idx === i ? { ...r, [field]: value } : r),
  }));

  const removeRound = (i) => setForm(prev => ({
    ...prev,
    rounds: prev.rounds.filter((_, idx) => idx !== i),
  }));

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <Users size={10} /> Community
        </div>
        <h1 className="page-title">Interview Experiences</h1>
        <p className="page-subtitle">Learn from real interview experiences shared by the community</p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════
            SCREEN: LIST
        ════════════════════════════ */}
        {screen === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Search */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    placeholder="Search by company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm">
                  <Search size={13} /> Search
                </button>
              </form>

              {/* Difficulty filter */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Filter size={13} color="var(--text-muted)" />
                {['', ...DIFFICULTIES].map(d => (
                  <button key={d} onClick={() => { setFilterDiff(d); setPage(1); }}
                    style={{
                      padding: '5px 12px', borderRadius: '100px', border: 'none',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      background: filterDiff === d ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
                      color: filterDiff === d ? '#fff' : 'var(--text-secondary)',
                      border: filterDiff === d ? 'none' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {d || 'All'}
                  </button>
                ))}
              </div>

              {/* Share button */}
              <button onClick={() => setScreen('create')} className="btn btn-primary btn-sm">
                <Plus size={14} /> Share Experience
              </button>
            </div>

            {/* Posts */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share!</p>
                <button onClick={() => setScreen('create')} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  <Plus size={13} /> Share Experience
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {posts.map((post, i) => (
                  <motion.div key={post._id} {...fadeUp(i * 0.04)}
                    className="card card-interactive"
                    onClick={() => openPost(post._id)}
                    style={{ padding: '1.1rem 1.25rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        {/* Company + role */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                            background: 'var(--accent-indigo-dim)', border: '1px solid var(--border-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent-indigo)',
                            fontFamily: 'var(--font-display)',
                          }}>
                            {post.company?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                              {post.company}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.role}</div>
                          </div>
                          <span className={`badge ${diffColor(post.difficulty)}`}>{post.difficulty}</span>
                          <span className={`badge ${resultColor(post.result)}`}>{post.result}</span>
                        </div>

                        {/* Tags */}
                        {post.tags?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                            {post.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="badge badge-muted">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            onClick={(e) => handleUpvote(post._id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <ThumbsUp size={13} /> {post.upvotes || 0}
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <MessageSquare size={13} /> {post.comments?.length || 0}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Clock size={11} /> {timeAgo(post.createdAt)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
                <span style={{ padding: '6px 14px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next →</button>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════
            SCREEN: DETAIL
        ════════════════════════════ */}
        {screen === 'detail' && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setScreen('list')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
              <ArrowLeft size={14} /> Back to posts
            </button>

            {detailLoad ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '14px' }} />)}
              </div>
            ) : selected && (
              <>
                {/* Post header card */}
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '12px',
                        background: 'var(--accent-indigo-dim)', border: '1px solid var(--border-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-indigo)',
                        fontFamily: 'var(--font-display)',
                      }}>
                        {selected.company?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {selected.company}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selected.role}</span>
                          <span className={`badge ${diffColor(selected.difficulty)}`}>{selected.difficulty}</span>
                          <span className={`badge ${resultColor(selected.result)}`}>{selected.result}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpvote(selected._id)} className="btn btn-secondary btn-sm">
                        <ThumbsUp size={13} /> {selected.upvotes || 0} Upvotes
                      </button>
                      {selected.user === user?._id && (
                        <button onClick={() => handleDelete(selected._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {selected.experience && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                      {selected.experience}
                    </p>
                  )}

                  {selected.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selected.tags.map(tag => <span key={tag} className="badge badge-indigo">{tag}</span>)}
                    </div>
                  )}
                </div>

                {/* Rounds */}
                {selected.rounds?.length > 0 && (
                  <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <Star size={15} color="var(--accent-amber)" />
                      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        Interview Rounds ({selected.rounds.length})
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selected.rounds.map((round, i) => (
                        <div key={i} style={{
                          padding: '12px 14px', borderRadius: '10px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'var(--accent-indigo-dim)', border: '1px solid var(--border-accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-indigo)',
                            }}>{i+1}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {round.roundName || `Round ${i+1}`}
                            </span>
                          </div>
                          {round.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: round.questions?.length ? '8px' : 0 }}>
                              {round.description}
                            </p>
                          )}
                          {round.questions?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {round.questions.map((q, j) => (
                                <div key={j} style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  <span style={{ color: 'var(--accent-indigo)', flexShrink: 0 }}>Q{j+1}.</span> {q}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <MessageSquare size={15} color="var(--accent-cyan)" />
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      Comments ({selected.comments?.length || 0})
                    </h3>
                  </div>

                  {/* Add comment */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                    <input
                      className="form-input"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                      style={{ flex: 1 }}
                    />
                    <button onClick={handleComment} disabled={commenting} className="btn btn-primary btn-sm">
                      {commenting ? <div className="spinner" style={{ width: 13, height: 13 }} /> : <Send size={13} />}
                    </button>
                  </div>

                  {/* Comment list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selected.comments?.length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                        No comments yet. Start the conversation!
                      </p>
                    )}
                    {selected.comments?.map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                        }}>
                          {c.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {c.user?.name || 'User'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════
            SCREEN: CREATE
        ════════════════════════════ */}
        {screen === 'create' && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setScreen('list')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
              <ArrowLeft size={14} /> Back
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>

              {/* Basic info */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Building size={15} color="var(--accent-indigo)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Basic Info</h3>
                </div>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <input className="form-input" placeholder="e.g. Google" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <input className="form-input" placeholder="e.g. SDE Intern" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
                  </div>
                </div>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {DIFFICULTIES.map(d => (
                        <button key={d} onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            background: form.difficulty === d ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
                            color: form.difficulty === d ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${form.difficulty === d ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.15s',
                          }}
                        >{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Result</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {RESULTS.map(r => (
                        <button key={r} onClick={() => setForm(p => ({ ...p, result: r }))}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            background: form.result === r ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
                            color: form.result === r ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${form.result === r ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.15s',
                          }}
                        >{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Overall Experience</label>
                  <textarea className="form-input" rows={3} placeholder="Describe your overall interview experience..." value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" placeholder="e.g. DSA, System Design, HR" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                </div>
              </div>

              {/* Rounds */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={15} color="var(--accent-amber)" />
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Interview Rounds</h3>
                  </div>
                  <button onClick={addRound} className="btn btn-secondary btn-sm">
                    <Plus size={13} /> Add Round
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {form.rounds.map((round, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>Round {i+1}</span>
                        {form.rounds.length > 1 && (
                          <button onClick={() => removeRound(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input className="form-input" placeholder="Round name (e.g. Technical Round 1)" value={round.roundName} onChange={e => updateRound(i, 'roundName', e.target.value)} />
                        <textarea className="form-input" rows={2} placeholder="Describe this round..." value={round.description} onChange={e => updateRound(i, 'description', e.target.value)} style={{ resize: 'vertical' }} />
                        <textarea className="form-input" rows={3} placeholder="Questions asked (one per line)..." value={round.questions} onChange={e => updateRound(i, 'questions', e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button onClick={handleCreate} disabled={creating} className="btn btn-primary btn-lg" whileTap={{ scale: 0.97 }}>
                  {creating
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sharing...</>
                    : <><Zap size={16} /> Share Experience</>
                  }
                </motion.button>
                <button onClick={() => setScreen('list')} className="btn btn-ghost btn-lg">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}