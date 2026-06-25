import { useState, useRef, useEffect } from 'react'
import { streamAgentChat, displayableMessages, type DisplayMessage } from '@/lib/skipAi'
import pb from '@/lib/pocketbase/client'
import { Send, User, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function VIPAdvisor() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const conversationId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/chats?limit=1`, {
          headers: { Authorization: pb.authStore.token },
        })
        const data = await res.json()
        if (data.items?.length > 0) {
          conversationId.current = data.items[0].id
          const historyRes = await fetch(
            `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/chats/${data.items[0].id}/messages`,
            {
              headers: { Authorization: pb.authStore.token },
            },
          )
          const historyData = await historyRes.json()
          setMessages(displayableMessages(historyData.messages || []))
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content:
                'Olá. Sou seu Assistente Patrimonial VIP. Tenho acesso ao seu cofre de ativos, passivos e recebimentos. Como posso auxiliá-ra na gestão do seu portfólio hoje?',
              created: new Date().toISOString(),
            },
          ])
        }
      } catch {
        /* intentionally ignored */
      }
    }
    load()
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const abort = new AbortController()
    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
        body: JSON.stringify({ message: userMsg.content, conversation_id: conversationId.current }),
        signal: abort.signal,
      })

      const result = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last.role === 'assistant' && last.id === 'temp') {
              return [...prev.slice(0, -1), { ...last, content: full }]
            }
            return [
              ...prev,
              { id: 'temp', role: 'assistant', content: full, created: new Date().toISOString() },
            ]
          })
        },
        signal: abort.signal,
      })

      conversationId.current = result.conversation_id
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last.id === 'temp') {
          return [
            ...prev.slice(0, -1),
            { ...last, id: result.message_id, citations: result.citations },
          ]
        }
        return prev
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-4xl mx-auto border border-border/50 rounded-2xl bg-card overflow-hidden shadow-elevation animate-fade-in">
      <div className="p-5 border-b border-border/40 bg-slate-950 flex items-center gap-4 text-slate-50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 className="font-serif font-medium text-lg tracking-wide">VIP Wealth Advisor</h2>
          <p className="text-xs text-slate-400 font-light">
            Assistente de inteligência artificial criptografado
          </p>
        </div>
      </div>

      <div
        className="flex-1 p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/20"
        ref={scrollRef}
      >
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-900 text-primary'}`}
              >
                {msg.role === 'user' ? <User size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div
                className={`px-5 py-4 rounded-2xl max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-border/50 rounded-tl-none'}`}
              >
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/30">
                    <p className="text-xs opacity-70">
                      Fontes verificadas: {msg.citations.map((c) => `[${c.n}]`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && !messages.find((m) => m.id === 'temp') && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-primary flex items-center justify-center shadow-sm">
                <ShieldCheck size={18} />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-border/50 rounded-tl-none flex items-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border/40 bg-background">
        <form onSubmit={sendMessage} className="flex gap-3 relative max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Consulte seus ativos, exposição cambial ou previsão de caixa..."
            className="pr-14 rounded-full border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 h-12 focus-visible:ring-primary shadow-inner"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 h-auto rounded-full w-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Send size={16} className="-ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
