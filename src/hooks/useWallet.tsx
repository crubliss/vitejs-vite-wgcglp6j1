import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase, Wallet, Holding, Trade } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatMoney } from '@/lib/format';

interface WalletContextValue {
  balance: number | null;
  holdings: Holding[];
  trades: Trade[];
  loading: boolean;
  executeBuy: (symbol: string, quantity: number, price: number) => Promise<{ success: boolean; error?: string }>;
  executeSell: (symbol: string, quantity: number, price: number) => Promise<{ success: boolean; error?: string }>;
  recordGame: (gameType: string, betAmount: number, payout: number, result: string) => Promise<void>;
  spend: (amount: number) => Promise<boolean>;
  addFunds: (amount: number) => Promise<void>;
  refresh: () => Promise<void>;
  balanceLabel: string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setHoldings([]);
      setTrades([]);
      setLoading(false);
      return;
    }

    const [walletRes, holdingsRes, tradesRes] = await Promise.all([
      supabase.from('wallet').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('holdings').select('*').order('symbol'),
      supabase.from('trades').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (walletRes.data) {
      setBalance(Number(walletRes.data.balance));
    } else {
      // First login for this user — create wallet with £100,000
      const { data: newWallet } = await supabase
        .from('wallet')
        .insert({ user_id: user.id, balance: 100000 })
        .select()
        .single();
      setBalance(Number(newWallet?.balance ?? 100000));
    }
    setHoldings((holdingsRes.data ?? []) as Holding[]);
    setTrades((tradesRes.data ?? []) as Trade[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadAll();
    } else {
      setBalance(null);
      setHoldings([]);
      setTrades([]);
      setLoading(false);
    }
  }, [user, loadAll]);

  const executeBuy = useCallback(
    async (symbol: string, quantity: number, price: number): Promise<{ success: boolean; error?: string }> => {
      if (balance === null) return { success: false, error: 'Wallet not loaded' };
      const total = quantity * price;
      if (total > balance) return { success: false, error: 'Insufficient funds' };

      const newBalance = balance - total;
      setBalance(newBalance);
      const { data: w } = await supabase.from('wallet').select('id').eq('user_id', user!.id).maybeSingle();
      if (w) await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', w.id);

      await supabase.from('trades').insert({ symbol, action: 'buy', quantity, price, total });

      const existing = holdings.find((h) => h.symbol === symbol);
      if (existing) {
        const totalQty = existing.quantity + quantity;
        const newAvg = (existing.quantity * existing.avg_price + quantity * price) / totalQty;
        const updated = { quantity: totalQty, avg_price: newAvg, updated_at: new Date().toISOString() };
        await supabase.from('holdings').update(updated).eq('id', existing.id);
        setHoldings((prev) => prev.map((h) => (h.symbol === symbol ? { ...h, ...updated } : h)));
      } else {
        const { data } = await supabase.from('holdings').insert({ symbol, quantity, avg_price: price }).select().single();
        if (data) setHoldings((prev) => [...prev, data as Holding]);
      }

      setTrades((prev) =>
        [{ id: crypto.randomUUID(), symbol, action: 'buy' as const, quantity, price, total, created_at: new Date().toISOString() }, ...prev].slice(0, 50),
      );
      return { success: true };
    },
    [balance, holdings, user],
  );

  const executeSell = useCallback(
    async (symbol: string, quantity: number, price: number): Promise<{ success: boolean; error?: string }> => {
      if (balance === null) return { success: false, error: 'Wallet not loaded' };
      const existing = holdings.find((h) => h.symbol === symbol);
      if (!existing || existing.quantity < quantity) return { success: false, error: 'Not enough shares' };

      const total = quantity * price;
      const newBalance = balance + total;
      setBalance(newBalance);
      const { data: w } = await supabase.from('wallet').select('id').eq('user_id', user!.id).maybeSingle();
      if (w) await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', w.id);

      await supabase.from('trades').insert({ symbol, action: 'sell', quantity, price, total });

      const remaining = existing.quantity - quantity;
      if (remaining <= 0.000001) {
        await supabase.from('holdings').delete().eq('id', existing.id);
        setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
      } else {
        const updated = { quantity: remaining, updated_at: new Date().toISOString() };
        await supabase.from('holdings').update(updated).eq('id', existing.id);
        setHoldings((prev) => prev.map((h) => (h.symbol === symbol ? { ...h, ...updated } : h)));
      }

      setTrades((prev) =>
        [{ id: crypto.randomUUID(), symbol, action: 'sell' as const, quantity, price, total, created_at: new Date().toISOString() }, ...prev].slice(0, 50),
      );
      return { success: true };
    },
    [balance, holdings, user],
  );

  const recordGame = useCallback(
    async (gameType: string, betAmount: number, payout: number, result: string) => {
      if (balance === null) return;
      const newBalance = balance - betAmount + payout;
      setBalance(newBalance);
      const { data: w } = await supabase.from('wallet').select('id').eq('user_id', user!.id).maybeSingle();
      if (w) await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', w.id);
      await supabase.from('game_history').insert({ game_type: gameType, bet_amount: betAmount, payout, result });
    },
    [balance, user],
  );

  const spend = useCallback(
    async (amount: number): Promise<boolean> => {
      if (balance === null || amount > balance) return false;
      const newBalance = balance - amount;
      setBalance(newBalance);
      const { data: w } = await supabase.from('wallet').select('id').eq('user_id', user!.id).maybeSingle();
      if (w) await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', w.id);
      return true;
    },
    [balance, user],
  );

  const addFunds = useCallback(
    async (amount: number) => {
      if (balance === null) return;
      const newBalance = balance + amount;
      setBalance(newBalance);
      const { data: w } = await supabase.from('wallet').select('id').eq('user_id', user!.id).maybeSingle();
      if (w) await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', w.id);
    },
    [balance, user],
  );

  return (
    <WalletContext.Provider
      value={{
        balance,
        holdings,
        trades,
        loading,
        executeBuy,
        executeSell,
        recordGame,
        spend,
        addFunds,
        refresh: loadAll,
        balanceLabel: balance !== null ? formatMoney(balance) : '...',
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
