import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useCurrency } from '@/hooks/use-currency'
import pb from '@/lib/pocketbase/client'
import { getSelectedUserId } from '@/stores/selectedUser'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  Home,
  Briefcase,
  ArrowRightLeft,
  TrendingUp,
  FileText,
  MessageSquare,
  LogOut,
  Search,
  PieChart,
  Users as UsersIcon,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const targetUser = getSelectedUserId()
        const searchPattern = query.trim().replace(/"/g, '')
        let filter = `(name ~ "${searchPattern}" || type ~ "${searchPattern}" || subtype ~ "${searchPattern}" || location ~ "${searchPattern}")`
        if (targetUser) {
          filter = `user = "${targetUser}" && ${filter}`
        }
        const res = await pb.collection('assets').getList(1, 5, { filter })
        setResults(res.items)
        setIsOpen(true)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div ref={wrapperRef} className="relative hidden md:block z-50">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar ativos..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!isOpen && e.target.value.trim()) setIsOpen(true)
        }}
        onFocus={() => {
          if (query.trim()) setIsOpen(true)
        }}
        className="w-64 pl-10 pr-8 bg-muted/50 border-none rounded-full h-10 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('')
            setResults([])
            setIsOpen(false)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-popover border border-border/50 rounded-md shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[300px] overflow-auto py-1">
              {results.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                    navigate('/patrimonio', { state: { highlightAsset: asset.id } })
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex flex-col gap-0.5"
                >
                  <span className="text-sm font-medium line-clamp-1">{asset.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {asset.type} {asset.subtype ? `- ${asset.subtype}` : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum ativo encontrado
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  return (
    <div className="flex items-center bg-muted/50 p-1 rounded-full border border-border/50">
      <button
        onClick={() => setCurrency('BRL')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${currency === 'BRL' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        BRL
      </button>
      <button
        onClick={() => setCurrency('USD')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${currency === 'USD' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        USD
      </button>
    </div>
  )
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" className="bg-slate-950 border-r-slate-800 text-slate-300 dark">
        <SidebarHeader className="p-4 pt-6 pb-2 not-italic">
          <div className="px-2 w-full flex justify-center pointer-events-none select-none">
            <div className="border border-slate-700/60 p-3 sm:p-4 rounded-sm relative w-full flex justify-center opacity-80">
              {/* Subtle corner accents */}
              <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-slate-400/80" />
              <div className="absolute -top-px -right-px w-1.5 h-1.5 border-t border-r border-slate-400/80" />
              <div className="absolute -bottom-px -left-px w-1.5 h-1.5 border-b border-l border-slate-400/80" />
              <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-slate-400/80" />

              <div className="flex flex-col text-center font-serif text-slate-100 antialiased mix-blend-screen">
                <span className="text-2xl font-bold tracking-[0.3em] leading-none mb-1 uppercase flex items-center justify-center gap-2">
                  <Briefcase size={14} className="opacity-70 text-slate-300" strokeWidth={1.5} />
                  DMP
                </span>
                <span className="text-[0.55rem] font-medium italic opacity-90 tracking-[0.2em] uppercase mt-1">
                  Gestão Patrimonial
                </span>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 mt-6">
          <SidebarMenu>
            {isAdmin ? (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <Home /> <span>Resumo Global</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/patrimonio"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <Briefcase /> <span>Patrimônio</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/fluxo"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <ArrowRightLeft /> <span>Fluxo de Caixa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/evolucao"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <TrendingUp /> <span>Evolução</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/relatorios"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <FileText /> <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/users"
                      className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      <UsersIcon /> <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/my-portfolio"
                    className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                  >
                    <PieChart /> <span>Meu Portfólio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem className="mt-8">
              <SidebarMenuButton
                asChild
                className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors"
              >
                <Link to="/advisor">
                  <MessageSquare /> <span>VIP Assistant</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 mt-auto border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair do Cofre
          </Button>
        </div>
      </Sidebar>
      <SidebarInset className="bg-background text-foreground flex flex-col min-h-screen">
        <header className="h-16 px-6 border-b border-border/40 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl hidden sm:block text-slate-800 dark:text-slate-200">
              {isAdmin ? 'Painel de Controle' : 'Área do Cliente'}
            </h1>
            <div className="ml-2 border border-slate-300 dark:border-slate-700/50 px-2 py-0.5 rounded opacity-40 select-none hidden md:block">
              <span className="font-serif text-[0.6rem] tracking-[0.25em] uppercase text-slate-600 dark:text-slate-300 mix-blend-multiply dark:mix-blend-screen">
                DMP Gestão Patrimonial
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <CurrencyToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
