import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useCurrency } from '@/hooks/use-currency'
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
  MessageSquare,
  LogOut,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const { signOut } = useAuth()
  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" className="bg-slate-950 border-r-slate-800 text-slate-300 dark">
        <SidebarHeader className="p-4 pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <Briefcase size={16} />
            </div>
            <span className="font-serif text-xl font-medium text-slate-100 tracking-wide">
              Gestor VIP
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 mt-6">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/" className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50">
                  <Home /> <span>Resumo</span>
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
              Painel de Controle
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ativos..."
                className="w-64 pl-10 bg-muted/50 border-none rounded-full h-10 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
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
