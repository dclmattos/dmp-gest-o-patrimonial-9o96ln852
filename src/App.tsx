import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { CurrencyProvider } from '@/hooks/use-currency'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Auth from '@/pages/Auth'
import Index from '@/pages/Index'
import Patrimonio from '@/pages/Patrimonio'
import Fluxo from '@/pages/Fluxo'
import Evolucao from '@/pages/Evolucao'
import VIPAdvisor from '@/pages/VIPAdvisor'
import Relatorios from '@/pages/Relatorios'
import NotFound from '@/pages/NotFound'
import MyPortfolio from '@/pages/MyPortfolio'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/patrimonio" element={<Patrimonio />} />
                <Route path="/fluxo" element={<Fluxo />} />
                <Route path="/evolucao" element={<Evolucao />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/advisor" element={<VIPAdvisor />} />
                <Route path="/my-portfolio" element={<MyPortfolio />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
