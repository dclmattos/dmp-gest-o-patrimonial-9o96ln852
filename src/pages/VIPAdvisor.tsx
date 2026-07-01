import { useState, useRef, useEffect, useCallback } from 'react'
import { streamAgentChat, displayableMessages, type DisplayMessage } from '@/lib/skipAi'
import pb from '@/lib/pocketbase/client'
import { Send, ShieldCheck, User, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Olá. Sou seu Assistente Patrimonial VIP. Tenho acesso ao seu cofre de ativos, passivos, recebimentos, categorias e tipologias. Como posso auxiliá-lo na gestão do seu portfólio hoje?',
  created: new Date().toISOString(),
}

export default function VIPAdvisor() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/chats?limit=1`, {
          headers: { Authorization: pb.authStore.token },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.items?.length > 0) {
          conversationId.current = data.items[0].id
          const historyRes = await fetch(
            `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/chats/${data.items[0].id}/messages`,
            { headers: { Authorization: pb.authStore.token } },
          )
          if (!historyRes.ok) return
          const historyData = await historyRes.json()
          const displayable = displayableMessages(historyData.messages || [])
          if (displayable.length > 0) {
            setMessages(displayable)
          }
        }
      } catch {
        /* network errors ignored — welcome message stays */
      }
    }
    load()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setError(null)
  }, [])

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort()
    conversationId.current = null
    setMessages([WELCOME_MESSAGE])
    setError(null)
    setInput('')
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setError(null)

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId.current,
        }),
        signal: controller.signal,
      })

      const result = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant' && last.id === 'temp-assistant') {
              return [...prev.slice(0, -1), { ...last, content: full }]
            }
            return [
              ...prev,
              {
                id: 'temp-assistant',
                role: 'assistant',
                content: full,
                created: new Date().toISOString(),
              },
            ]
          })
        },
        signal: controller.signal,
      })

      conversationId.current = result.conversation_id

      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.id === 'temp-assistant') {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              id: result.message_id || `assistant-${Date.now()}`,
              citations: result.citations,
            },
          ]
        }
        return prev
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.id === 'temp-assistant') {
            if (last.content.trim()) {
              return [...prev.slice(0, -1), { ...last, id: `aborted-${Date.now()}` }]
            }
            return prev.slice(0, -1)
          }
          return prev
        })
      } else {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro inesperado na comunicação com o assistente.'
        setError(errorMsg)
        setMessages((prev) => prev.filter((m) => m.id !== 'temp-assistant'))
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto border border-neutral-900 rounded-none bg-black overflow-hidden animate-fade-in">
      <div className="px-6 py-5 border-b border-neutral-900 bg-black flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-serif font-light text-lg tracking-wide text-neutral-100">
              VIP Wealth Advisor
            </h2>
            <p className="text-[0.6rem] text-neutral-600 font-sans tracking-[0.15em] uppercase">
              Inteligência Patrimonial Criptografada
            </p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="text-neutral-600 hover:text-primary transition-colors p-2"
          title="Nova conversa"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 px-6 py-8 overflow-y-auto bg-black">
        <div className="space-y-6">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id || `msg-${i}`}
                className={cn('flex gap-4', isUser && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border',
                    isUser
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      : 'bg-primary/5 border-primary/15 text-primary',
                  )}
                >
                  {isUser ? <User size={16} /> : <ShieldCheck size={16} />}
                </div>
                <div
                  className={cn(
                    'px-5 py-4 max-w-[80%] border',
                    isUser
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-200 rounded-tl-lg rounded-bl-lg rounded-tr-sm'
                      : 'bg-neutral-950 border-neutral-900 text-neutral-300 rounded-tr-lg rounded-br-lg rounded-tl-sm',
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed font-light">
                    {msg.content}
                  </p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-[0.6rem] text-neutral-600 tracking-wider uppercase">
                        Fontes: {msg.citations.map((c) => `[${c.n}]`).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {loading && !messages.find((m) => m.id === 'temp-assistant') && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/15 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="px-5 py-4 bg-neutral-950 border border-neutral-900 rounded-tr-lg rounded-br-lg rounded-tl-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0">
                <AlertCircle size={16} />
              </div>
              <div className="px-5 py-4 bg-destructive/5 border border-destructive/20 rounded-tr-lg rounded-br-lg rounded-tl-sm max-w-[80%]">
                <p className="text-[0.6rem] text-destructive/80 tracking-[0.15em] uppercase mb-1">
                  Falha na Conexão
                </p>
                <p className="text-sm text-neutral-400 font-light">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-neutral-900 bg-black">
        <form onSubmit={sendMessage} className="flex gap-3 relative">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Consulte seus ativos, exposição cambial ou alocação..."
            className="bg-neutral-950 border-neutral-800 text-neutral-200 placeholder:text-neutral-700 rounded-none h-12 focus-visible:ring-0 focus-visible:border-primary/40 transition-colors font-light text-sm"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 h-auto rounded-none w-9 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send size={15} />
          </Button>
        </form>
        <p className="text-[0.5rem] text-neutral-700 tracking-[0.2em] uppercase mt-2 text-center">
          Respostas geradas por IA · Dados criptografados
        </p>
      </div>
    </div>
  )
}
