import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
      <Input
        placeholder="BUSCAR ATIVOS..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!isOpen && e.target.value.trim()) setIsOpen(true)
        }}
        onFocus={() => {
          if (query.trim()) setIsOpen(true)
        }}
        className="w-64 bg-transparent border-b border-t-0 border-l-0 border-r-0 border-neutral-800 rounded-none h-10 shadow-none focus-visible:ring-0 focus-visible:border-primary/50 text-xs tracking-widest placeholder:text-neutral-600"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('')
            setResults([])
            setIsOpen(false)
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white text-[0.6rem] uppercase tracking-wider"
        >
          LIMPAR
        </button>
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-black border border-neutral-800 rounded-none shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-[0.65rem] tracking-wider uppercase text-neutral-500">
              BUSCANDO...
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
                  className="w-full text-left px-4 py-3 hover:bg-neutral-900 transition-colors flex flex-col gap-1 border-b border-neutral-900 last:border-0"
                >
                  <span className="text-sm font-light text-neutral-200 line-clamp-1">
                    {asset.name}
                  </span>
                  <span className="text-[0.6rem] text-primary/70 uppercase tracking-wider">
                    {asset.type} {asset.subtype ? `- ${asset.subtype}` : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-[0.65rem] tracking-wider uppercase text-neutral-500">
              NENHUM ATIVO
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
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrency('BRL')}
        className={cn(
          'text-[0.6rem] tracking-[0.2em] transition-colors',
          currency === 'BRL'
            ? 'text-primary font-medium'
            : 'text-neutral-600 hover:text-neutral-400',
        )}
      >
        BRL
      </button>
      <span className="text-neutral-800">|</span>
      <button
        onClick={() => setCurrency('USD')}
        className={cn(
          'text-[0.6rem] tracking-[0.2em] transition-colors',
          currency === 'USD'
            ? 'text-primary font-medium'
            : 'text-neutral-600 hover:text-neutral-400',
        )}
      >
        USD
      </button>
    </div>
  )
}

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          to={to}
          className={cn(
            'flex items-center gap-3 py-3 px-4 text-[0.65rem] tracking-[0.25em] uppercase font-light transition-all group',
            isActive
              ? 'text-white bg-white/5'
              : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5',
          )}
        >
          <span
            className={cn(
              'w-2 h-px transition-colors duration-300',
              isActive ? 'bg-primary' : 'bg-neutral-800 group-hover:bg-primary/50',
            )}
          />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" className="bg-black border-r border-neutral-900">
        <SidebarHeader className="p-6 pt-10 pb-8">
          <div className="relative px-5 py-4 inline-block w-fit mx-auto">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary" />
            <span className="text-[0.65rem] font-light tracking-[0.3em] uppercase text-primary/90 text-center block">
              Gestão
              <br />
              Patrimonial
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-0">
          <SidebarMenu className="gap-1">
            {isAdmin ? (
              <>
                <NavLink to="/" label="Resumo Global" />
                <NavLink to="/patrimonio" label="Patrimônio" />
                <NavLink to="/fluxo" label="Fluxo de Caixa" />
                <NavLink to="/evolucao" label="Evolução" />
                <NavLink to="/relatorios" label="Relatórios" />
                <NavLink to="/users" label="Usuários" />
              </>
            ) : (
              <>
                <NavLink to="/my-portfolio" label="Meu Portfólio" />
                <NavLink to="/patrimonio" label="Patrimônio" />
                <NavLink to="/fluxo" label="Fluxo de Caixa" />
                <NavLink to="/evolucao" label="Evolução" />
                <NavLink to="/relatorios" label="Relatórios" />
              </>
            )}
            <SidebarMenuItem className="mt-8">
              <SidebarMenuButton asChild>
                <Link
                  to="/advisor"
                  className="flex items-center gap-3 py-3 px-4 text-[0.65rem] tracking-[0.25em] uppercase font-light text-primary hover:text-white transition-colors group"
                >
                  <span className="w-2 h-px bg-primary transition-colors group-hover:bg-white" />
                  VIP Assistant
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-6 mt-auto border-t border-neutral-900">
          <Button
            variant="ghost"
            className="w-full justify-start text-[0.65rem] tracking-[0.2em] uppercase font-light text-neutral-500 hover:text-white hover:bg-transparent px-0"
            onClick={signOut}
          >
            <span className="w-2 h-px bg-neutral-800 mr-3" /> SAIR DO COFRE
          </Button>
        </div>
      </Sidebar>
      <SidebarInset className="bg-black text-white flex flex-col min-h-screen">
        <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-neutral-900">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl font-light tracking-wide hidden sm:block text-neutral-200">
              {isAdmin ? 'Painel de Controle' : 'Área do Cliente'}
            </h1>
          </div>
          <div className="flex items-center gap-8">
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
