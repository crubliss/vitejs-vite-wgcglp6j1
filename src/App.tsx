import { useState } from 'react';
import {
  LineChart, Spade, Wallet, Car, TrendingUp, Youtube, Boxes,
  ShoppingCart, Skull, Menu, X, LogOut, Crosshair, Target, FlaskConical,
  Shield,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { WalletProvider, useWallet } from '@/hooks/useWallet';
import { TradingView } from '@/components/TradingView';
import { CasinoView } from '@/components/CasinoView';
import { CarMarket } from '@/components/CarMarket';
import { Garage } from '@/components/Garage';
import { InvestView } from '@/components/InvestView';
import { YouTubeView } from '@/components/YouTubeView';
import { BackroomsBuilder } from '@/components/BackroomsBuilder';
import { GunWorkshop } from '@/components/GunWorkshop';
import { ShootingRange } from '@/components/ShootingRange';
import { DrugMarket } from '@/components/DrugMarket';
import { OwnerPanel } from '@/components/OwnerPanel';
import { AuthScreen } from '@/components/AuthScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatMoney } from '@/lib/format';

type Tab =
  | 'trading' | 'casino' | 'market' | 'blackmarket' | 'garage'
  | 'invest' | 'youtube' | 'backrooms' | 'gunshop' | 'range' | 'drugs' | 'owner';

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof LineChart;
  group: string;
  badge?: string;
}

const NAV: NavItem[] = [
  { id: 'trading', label: 'Trading', icon: LineChart, group: 'Finance' },
  { id: 'casino', label: 'Casino', icon: Spade, group: 'Finance' },
  { id: 'invest', label: 'Invest', icon: TrendingUp, group: 'Finance' },
  { id: 'market', label: 'Car Market', icon: ShoppingCart, group: 'Marketplace' },
  { id: 'blackmarket', label: 'Black Market', icon: Skull, group: 'Marketplace', badge: '!' },
  { id: 'drugs', label: 'Drug Den', icon: FlaskConical, group: 'Marketplace', badge: '!' },
  { id: 'garage', label: 'Garage', icon: Car, group: 'Marketplace' },
  { id: 'youtube', label: 'Creator Studio', icon: Youtube, group: 'Media' },
  { id: 'backrooms', label: 'Backrooms 3D', icon: Boxes, group: 'Sandbox' },
  { id: 'gunshop', label: 'Gun Workshop', icon: Crosshair, group: 'Sandbox' },
  { id: 'range', label: 'Shooting Range', icon: Target, group: 'Sandbox' },
  { id: 'owner', label: 'Owner Panel', icon: Shield, group: 'Admin' },
];

function AppContent() {
  const [tab, setTab] = useState<Tab>('trading');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wallet = useWallet();
  const { user, signOut } = useAuth();

  const groups = [...new Set(NAV.map((n) => n.group))];

  const renderContent = () => {
    switch (tab) {
      case 'trading': return <TradingView />;
      case 'casino': return <CasinoView />;
      case 'market': return <CarMarket mode="market" />;
      case 'blackmarket': return <CarMarket mode="blackmarket" />;
      case 'garage': return <Garage />;
      case 'invest': return <InvestView />;
      case 'youtube': return <YouTubeView />;
      case 'backrooms': return <BackroomsBuilder />;
      case 'gunshop': return <GunWorkshop />;
      case 'range': return <ShootingRange />;
      case 'drugs': return <DrugMarket />;
      case 'owner': return <OwnerPanel />;
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TradeVault</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <h3 className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">{group}</h3>
              {NAV.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative ${
                      active
                        ? 'text-zinc-100 bg-zinc-800/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                  >
                    {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />}
                    <Icon className={`w-4.5 h-4.5 ${active ? 'text-emerald-500' : ''}`} style={{ width: 18, height: 18 }} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-red-900/60 text-red-400 text-xs font-bold">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Wallet balance + user + sign out */}
        <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
            <Wallet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-500">Balance</div>
              <div className="text-sm font-semibold tabular-nums text-zinc-100 truncate">
                {wallet.balance !== null ? formatMoney(wallet.balance) : '...'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-600 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-zinc-200">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">TradeVault</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-emerald-400">
            <Wallet className="w-4 h-4" />
            {wallet.balance !== null ? formatMoney(wallet.balance) : '...'}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-100">TradeVault</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
