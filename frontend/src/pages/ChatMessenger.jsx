import React, { useState, useEffect, useRef } from 'react'
import { FaPaperclip, FaSmile, FaPaperPlane, FaUserShield, FaCheckDouble } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const ChatMessenger = () => {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [blocked, setBlocked] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Fetch active conversations list
  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats')
      setChats(response.data)
      if (response.data.length > 0) {
        handleSelectChat(response.data[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Load chat messages and configure WebSockets connection
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat)
    try {
      const response = await api.get(`/chats/${chat.id}/messages`)
      setMessages(response.data)
    } catch (err) {
      console.error(err)
    }

    // Connect WebSocket
    if (socketRef.current) {
      socketRef.current.close()
    }

    const socketUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/chat/${user.id}`
    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.chat_id === chat.id) {
        setMessages(prev => [...prev, data])
      }
    }

    socket.onerror = () => {
      console.error('WebSocket connection error')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText || !selectedChat || blocked) return

    const payload = {
      recipient_id: selectedChat.other_user_id,
      content: inputText
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload))
      setInputText('')
    } else {
      toast.error('WebSocket connection offline. Reconnecting...')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="panel-card glass-panel flex h-[620px] p-0 overflow-hidden grid md:grid-cols-[1fr_2fr]">
        
        {/* Sidebar Conversations List */}
        <div className="border-r border-[var(--border)] bg-slate-900/10 flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">Active Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {chats.length === 0 ? (
              <p className="text-xs text-[var(--muted)] text-center py-6">No active messages.</p>
            ) : (
              chats.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChat(c)}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 ${selectedChat?.id === c.id ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-slate-800/40 border border-transparent'}`}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center font-bold text-white text-xs">
                    {c.other_username[0].toUpperCase()}
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-[var(--text)]">{c.other_username}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">Click to read logs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messaging Box */}
        <div className="flex flex-col justify-between bg-slate-950/5">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-slate-900/10">
                <div className="flex items-center gap-3 text-xs">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                    {selectedChat.other_username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{selectedChat.other_username}</h3>
                    <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
                  </div>
                </div>
                <button
                  onClick={() => setBlocked(!blocked)}
                  className="rounded-full bg-slate-800/60 p-2 text-xs text-rose-500 hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FaUserShield /> {blocked ? 'Unblock' : 'Block Contact'}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-sm ${msg.sender_id === user.id ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-tr-none' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-tl-none'}`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-70">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.sender_id === user.id && (
                          <FaCheckDouble className="text-sky-300" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border)] bg-slate-900/10 flex items-center gap-3">
                <button type="button" className="text-[var(--muted)] hover:text-[var(--text)] transition p-1">
                  <FaPaperclip className="text-lg" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={blocked}
                  placeholder={blocked ? 'This contact has been blocked.' : 'Write your message...'}
                  className="flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-sky-500"
                />
                <button type="button" className="text-[var(--muted)] hover:text-[var(--text)] transition p-1">
                  <FaSmile className="text-lg" />
                </button>
                <button
                  type="submit"
                  disabled={blocked || !inputText}
                  className="rounded-full bg-sky-500 p-3 text-white hover:bg-sky-600 transition"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
              Select an active conversation to check messages.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatMessenger
