import React, { useState, useEffect } from 'react'
import { FaThumbtack, FaHeart, FaReply, FaPlus, FaUserCircle, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Community = () => {
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [activeTopic, setActiveTopic] = useState(null)
  const [newReply, setNewReply] = useState('')
  const [replies, setReplies] = useState([])

  const fetchTopics = async () => {
    setLoading(true)
    try {
      const response = await api.get('/community/topics', {
        params: { brand, model }
      })
      setTopics(response.data)
    } catch (error) {
      toast.error('Failed to load community topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [brand, model])

  const handleCreateTopic = async (e) => {
    e.preventDefault()
    if (!newTitle || !newContent) return
    if (!user) {
      toast.info('Please sign in to start a topic.')
      return
    }

    try {
      await api.post('/community/topics', {
        brand: brand || 'General',
        model: model || 'All',
        title: newTitle,
        content: newContent
      })
      setNewTitle('')
      setNewContent('')
      toast.success('Thread published successfully')
      fetchTopics()
    } catch (error) {
      toast.error('Could not publish topic')
    }
  }

  const handleSelectTopic = (topic) => {
    setActiveTopic(topic)
    fetchReplies(topic.id)
  }

  const fetchReplies = async (topicId) => {
    try {
      const response = await api.get(`/community/topics/${topicId}/replies`)
      setReplies(response.data || [])
    } catch (error) {
      setReplies([])
    }
  }

  const handlePostReply = async (e) => {
    e.preventDefault()
    if (!newReply || !activeTopic) return
    if (!user) {
      toast.info('Please sign in to reply.')
      return
    }

    try {
      await api.post(`/community/topics/${activeTopic.id}/replies`, { content: newReply })
      setNewReply('')
      fetchReplies(activeTopic.id)
      toast.success('Reply posted')
    } catch (error) {
      toast.error('Failed to post reply')
    }
  }

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 text-center md:text-left">
        <h1 className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          Automotive Forums
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          Join threads, post specifications reviews, share modification tips, and seek advice from owners.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Forum Threads Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text)] outline-none"
            />
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Filter Brand (Tesla, Toyota...)"
              className="w-full sm:w-48 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text)] outline-none"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                <p className="text-center text-xs text-[var(--muted)] py-10">No threads match your filters. Be the first to start a discussion!</p>
              ) : (
                filteredTopics.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTopic(t)}
                    className={`panel-card glass-panel cursor-pointer transition hover:-translate-y-0.5 ${activeTopic?.id === t.id ? 'border-sky-500 bg-sky-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {t.pinned && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <FaThumbtack /> Pinned
                        </span>
                      )}
                      <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-500 uppercase">
                        {t.brand}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text)]">{t.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{t.content}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1 font-semibold">
                        <FaUserCircle className="text-sky-500" /> @{t.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaReply /> {t.replies_count} replies
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Thread Detail & Form Column */}
        <div className="space-y-6">
          {activeTopic ? (
            <div className="panel-card glass-panel">
              <div className="border-b border-[var(--border)] pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{activeTopic.title}</h3>
                  <button onClick={() => setActiveTopic(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">Close</button>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">Started by @{activeTopic.author}</p>
                <p className="mt-3 text-sm text-[var(--text)] leading-relaxed">{activeTopic.content}</p>
              </div>

              {/* Forum Replies */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {replies.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-4">No replies yet. Share your experience!</p>
                ) : (
                  replies.map(rep => (
                    <div key={rep.id} className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs">
                      <div className="flex justify-between items-center mb-1 text-[var(--muted)] font-semibold">
                        <span>@{rep.author}</span>
                      </div>
                      <p className="text-[var(--text)] leading-relaxed">{rep.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  placeholder="Post comment..."
                  className="flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--text)] outline-none"
                />
                <button type="submit" className="button-primary px-4 py-2 text-xs rounded-full">Send</button>
              </form>
            </div>
          ) : (
            <div className="panel-card glass-panel">
              <h3 className="text-lg font-bold mb-4">Publish Discussion Thread</h3>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Thread Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Enter main question..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Thread Details</label>
                  <textarea
                    rows="5"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Detail your question or tips here..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text)] outline-none resize-none"
                  />
                </div>
                <button type="submit" className="button-primary w-full text-xs">Publish Topic</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Community
