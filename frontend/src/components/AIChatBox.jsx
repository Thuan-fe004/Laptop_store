// src/components/AIChatBox.jsx
/**
 * LaptopStore AI Chatbot — Giao diện chuyên nghiệp
 * Features:
 *  - Streaming response (chữ hiện dần như ChatGPT)
 *  - Kéo thả icon lên/xuống
 *  - Lưu lịch sử hội thoại
 *  - Quick topics gợi ý
 *  - Hiệu ứng typing indicator
 *  - Markdown cơ bản (bold, bullet)
 *  - Kết nối API thật
 */
import { useState, useEffect, useRef, useCallback } from 'react'

import { API_BASE_URL } from '../constants/config';

const API_BASE = API_BASE_URL;

// ── Quick topic suggestions ───────────────────────────────────
const QUICK_TOPICS = [
  { icon: '🎮', label: 'Laptop gaming', q: 'Tư vấn laptop gaming tốt nhất hiện nay' },
  { icon: '📚', label: 'Sinh viên', q: 'Laptop cho sinh viên pin trâu giá rẻ' },
  { icon: '💼', label: 'Văn phòng', q: 'Laptop văn phòng mỏng nhẹ tốt nhất' },
  { icon: '🎨', label: 'Đồ họa', q: 'Laptop cho thiết kế đồ họa Photoshop' },
  { icon: '💻', label: 'Lập trình', q: 'Laptop tốt nhất cho lập trình viên' },
  { icon: '🍎', label: 'MacBook', q: 'So sánh các dòng MacBook hiện tại' },
  { icon: '🔧', label: 'Bảo hành', q: 'Chính sách bảo hành tại LaptopStore' },
  { icon: '💳', label: 'Trả góp', q: 'Mua laptop trả góp 0% như thế nào?' },
  { icon: '🚚', label: 'Giao hàng', q: 'Thời gian và phí giao hàng' },
  { icon: '🔄', label: 'Đổi trả', q: 'Chính sách đổi trả hàng' },
  { icon: '💰', label: 'Dưới 15 triệu', q: 'Laptop tốt nhất dưới 15 triệu' },
  { icon: '⚡', label: 'So sánh hãng', q: 'So sánh ASUS vs Dell vs Lenovo' },
]

// ── Render markdown đơn giản ──────────────────────────────────
function renderMessage(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold: **text**
    const boldParts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = boldParts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    )
    // Bullet
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      return <div key={i} style={{ paddingLeft: 8, marginTop: 2 }}>{rendered}</div>
    }
    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
    return <div key={i}>{rendered}</div>
  })
}

// ── Typing dots animation ─────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
          animation: `aiDot .8s ease-in-out ${i * 0.2}s infinite alternate`,
        }} />
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AIChatBox() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'assistant',
      text: 'Xin chào! 👋 Tôi là **trợ lý AI** của LaptopStore.\n\nTôi có thể giúp bạn:\n• 💻 Tư vấn chọn laptop theo nhu cầu & ngân sách\n• 🔍 Tìm kiếm & so sánh sản phẩm\n• 📋 Giải đáp chính sách bảo hành, đổi trả\n• 🛒 Hướng dẫn mua hàng & thanh toán\n\nBạn cần hỗ trợ gì ạ? 😊',
      time: new Date(),
    }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [pulse, setPulse]       = useState(true)
  const [history, setHistory]   = useState([])   // {role, content}
  const [aiStatus, setAiStatus] = useState('unknown') // online/offline/unknown
  const [showTopics, setShowTopics] = useState(true)
  const [dragY, setDragY]       = useState(0)

  const endRef      = useRef(null)
  const inputRef    = useRef(null)
  const dragging    = useRef(false)
  const dragStartY  = useRef(0)
  const dragStartVal = useRef(0)
  const msgIdRef    = useRef(1)

  // ── Auto scroll ─────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus input khi mở ──────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setPulse(false)
    }
  }, [open])

  // ── Check AI status ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/chat/health`)
      .then(r => r.json())
      .then(d => setAiStatus(d.ai_service === 'online' ? 'online' : 'offline'))
      .catch(() => setAiStatus('offline'))
  }, [])

  // ── Expose send function cho footer ─────────────────────
  useEffect(() => {
    window._aiChatSend = (q) => {
      setOpen(true)
      setPulse(false)
      setTimeout(() => sendMessage(q), 400)
    }
    return () => { delete window._aiChatSend }
  }, [history])  // re-register khi history thay đổi

  // ── Tắt pulse sau 6s ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000)
    return () => clearTimeout(t)
  }, [])

  // ── Drag handlers ────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    dragging.current   = true
    dragStartY.current = e.clientY
    dragStartVal.current = dragY
    e.preventDefault()
  }, [dragY])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const delta = e.clientY - dragStartY.current
      const newY  = Math.max(-window.innerHeight * 0.65, Math.min(180, dragStartVal.current + delta))
      setDragY(newY)
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // ── Hàm gửi tin nhắn ────────────────────────────────────
  const sendMessage = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return

    setInput('')
    setShowTopics(false)
    setLoading(true)

    const userMsgId = msgIdRef.current++
    const aiMsgId   = msgIdRef.current++

    // Thêm tin nhắn user
    setMessages(m => [...m, {
      id: userMsgId, role: 'user', text, time: new Date()
    }])

    // Thêm placeholder AI (streaming)
    setMessages(m => [...m, {
      id: aiMsgId, role: 'assistant', text: '', streaming: true, time: new Date()
    }])

    setStreaming(true)
    let fullReply = ''

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.slice(-8),  // gửi tối đa 8 lượt gần nhất
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''   // phần chưa hoàn chỉnh

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.chunk) {
              fullReply += data.chunk
              const snapshot = fullReply  // closure
              setMessages(m => m.map(msg =>
                msg.id === aiMsgId
                  ? { ...msg, text: snapshot }
                  : msg
              ))
            }
            if (data.done) break
          } catch { /* ignore parse errors */ }
        }
      }

    } catch (err) {
      // Fallback: thử non-streaming
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: history.slice(-8) }),
        })
        const data = await res.json()
        fullReply  = data.reply || '⚠️ Không nhận được phản hồi. Vui lòng thử lại!'
      } catch {
        fullReply = '⚠️ Không kết nối được AI. Vui lòng kiểm tra server hoặc gọi **1800-1234**!'
      }
    }

    // Cập nhật message cuối cùng (bỏ streaming flag)
    const finalReply = fullReply || '⚠️ Phản hồi trống, vui lòng thử lại.'
    setMessages(m => m.map(msg =>
      msg.id === aiMsgId
        ? { ...msg, text: finalReply, streaming: false }
        : msg
    ))

    // Lưu vào history để gửi lần sau
    setHistory(h => [
      ...h,
      { role: 'user',      content: text },
      { role: 'assistant', content: finalReply },
    ])

    setLoading(false)
    setStreaming(false)
    inputRef.current?.focus()

  }, [input, loading, history])

  // ── Xóa lịch sử ─────────────────────────────────────────
  const clearChat = () => {
    setMessages([{
      id: msgIdRef.current++, role: 'assistant',
      text: 'Cuộc trò chuyện đã được xóa. 🗑️ Tôi có thể giúp gì cho bạn?',
      time: new Date(),
    }])
    setHistory([])
    setShowTopics(true)
  }

  const btnBottom  = Math.max(16, 28 - dragY)
  const chatBottom = btnBottom + 80

  return (
    <>
      <style>{`
        @keyframes aiDot   { from{transform:translateY(0)} to{transform:translateY(-5px)} }
        @keyframes aiSlideUp { from{opacity:0;transform:translateY(16px)scale(.97)} to{opacity:1;transform:none} }
        @keyframes aiPulse { 0%{transform:scale(.9);opacity:.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes aiBadge { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .ai-msg-in   { animation: aiSlideUp .25s ease; }
        .ai-scrollbar::-webkit-scrollbar { width:4px; }
        .ai-scrollbar::-webkit-scrollbar-track { background:transparent; }
        .ai-scrollbar::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:2px; }
        .ai-input:focus { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
        .ai-topic-btn:hover { background:#eff6ff !important; border-color:#93c5fd !important; color:#2563eb !important; transform:translateY(-1px); }
        .cursor-blink::after { content:'▋'; animation:aiDot .5s ease infinite alternate; color:#2563eb; }
      `}</style>

      {/* ── Pulse ring ── */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: btnBottom, right: 28, zIndex: 498,
          width: 68, height: 68, borderRadius: '50%',
          background: '#2563eb', opacity: 0.25,
          animation: 'aiPulse 2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Toggle Button ── */}
      <button
        onMouseDown={onMouseDown}
        onClick={() => setOpen(v => !v)}
        title="Trợ lý AI LaptopStore"
        style={{
          position: 'fixed', bottom: btnBottom, right: 28, zIndex: 500,
          width: 68, height: 68, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)',
          border: '3px solid rgba(255,255,255,.2)',
          cursor: 'grab', fontSize: 30,
          boxShadow: '0 8px 32px rgba(37,99,235,.5), 0 2px 8px rgba(0,0,0,.15)',
          transition: 'box-shadow .25s, transform .2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,.6), 0 4px 12px rgba(0,0,0,.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,.5), 0 2px 8px rgba(0,0,0,.15)'
        }}
      >
        <span style={{ fontSize: open ? 22 : 30, transition: 'font-size .2s' }}>
          {open ? '✕' : '🤖'}
        </span>

        {/* Pulse badge khi chưa mở */}
        {pulse && !open && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', border: '2px solid #fff',
            animation: 'aiBadge 1.5s ease infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: '#fff', fontWeight: 800,
          }}>!</span>
        )}
      </button>

      {/* ── Tooltip ── */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: btnBottom + 12, right: 108, zIndex: 499,
          background: '#1a2341', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '8px 14px', borderRadius: 10, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,.25)',
          animation: 'aiSlideUp .3s ease',
        }}>
          💬 Tư vấn AI miễn phí!
          <span style={{
            position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)',
            borderLeft: '6px solid #1a2341', borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
          }} />
        </div>
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: chatBottom, right: 28, zIndex: 500,
          width: 390, maxHeight: 580,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,.22), 0 8px 24px rgba(37,99,235,.12)',
          border: '1px solid rgba(37,99,235,.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'aiSlideUp .3s cubic-bezier(.4,0,.2,1)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1e45, #1a2341, #1e3a6e)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37,99,235,.4)',
            }}>🤖</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: -.2 }}>
                Trợ lý AI LaptopStore
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: aiStatus === 'online' ? '#4ade80' : aiStatus === 'offline' ? '#ef4444' : '#f59e0b',
                }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                  {aiStatus === 'online' ? 'Đang hoạt động' : aiStatus === 'offline' ? 'Offline — Đang khởi động' : 'Đang kiểm tra...'}
                </span>
              </div>
            </div>

            {/* Clear + Close */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={clearChat}
                title="Xóa hội thoại"
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none',
                  color: 'rgba(255,255,255,.6)', width: 30, height: 30,
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'rgba(255,255,255,.6)' }}
              >🗑️</button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none',
                  color: 'rgba(255,255,255,.6)', width: 30, height: 30,
                  borderRadius: 8, cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.3)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'rgba(255,255,255,.6)' }}
              >✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-scrollbar" style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 14,
            background: '#f8fafc',
          }}>

            {/* Quick Topics (chỉ hiển thị khi chưa chat) */}
            {showTopics && messages.length <= 1 && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .8 }}>
                  Hỏi nhanh
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_TOPICS.map(t => (
                    <button
                      key={t.label}
                      className="ai-topic-btn"
                      onClick={() => sendMessage(t.q)}
                      style={{
                        padding: '5px 11px', borderRadius: 20,
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        fontSize: 12, fontWeight: 600, color: '#374151',
                        cursor: 'pointer', transition: 'all .15s',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tin nhắn */}
            {messages.map(msg => (
              <div key={msg.id} className="ai-msg-in" style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8,
              }}>
                {/* Avatar AI */}
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, alignSelf: 'flex-end', marginBottom: 2,
                  }}>🤖</div>
                )}

                <div style={{ maxWidth: '80%' }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : '#fff',
                    color:  msg.role === 'user' ? '#fff' : '#374151',
                    fontSize: 13, lineHeight: 1.65,
                    border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(37,99,235,.25)'
                      : '0 2px 8px rgba(0,0,0,.06)',
                  }}>
                    {/* Typing indicator */}
                    {msg.streaming && msg.text === '' ? (
                      <TypingDots />
                    ) : (
                      <div className={msg.streaming && msg.text ? 'cursor-blink' : ''}>
                        {renderMessage(msg.text)}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p style={{
                    margin: '3px 4px 0', fontSize: 10, color: '#9ca3af',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}>
                    {msg.time?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Avatar User */}
                {msg.role === 'user' && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, alignSelf: 'flex-end', marginBottom: 2, color: '#fff',
                  }}>👤</div>
                )}
              </div>
            ))}

            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid #f1f5f9',
            background: '#fff',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                className="ai-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Nhập câu hỏi... (Enter để gửi)"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 13,
                  background: loading ? '#f8fafc' : '#fff',
                  color: '#374151',
                  transition: 'all .2s',
                  resize: 'none',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none',
                  flexShrink: 0,
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : '#f1f5f9',
                  color: input.trim() && !loading ? '#fff' : '#9ca3af',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                  boxShadow: input.trim() && !loading ? '0 4px 12px rgba(37,99,235,.3)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid #d1d5db', borderTopColor: '#9ca3af',
                    animation: 'spin .8s linear infinite',
                  }} />
                ) : '➤'}
              </button>
            </div>

            {/* Footer hint */}
            <p style={{ margin: '8px 0 0', fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
              AI có thể nhầm. Hãy xác nhận thông tin quan trọng • Hotline: <strong>1800-1234</strong>
            </p>
          </div>
        </div>
      )}
    </>
  )
}