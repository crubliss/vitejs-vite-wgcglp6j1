import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Clock, DollarSign, Activity, Loader2 } from 'lucide-react';
import { supabase, Investment } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { INVESTMENT_PLANS, InvestmentPlan } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';

const riskColors: Record<string, string> = {
  Low: 'text-emerald-400 bg-emerald-900/40',
  Medium: 'text-blue-400 bg-blue-900/40',
  High: 'text-amber-400 bg-amber-900/40',
  Extreme: 'text-red-400 bg-red-900/40',
};

const planBorders: Record<string, string> = {
  emerald: 'border-emerald-700 hover:border-emerald-500',
  blue: 'border-blue-800 hover:border-blue-500',
  amber: 'border-amber-800 hover:border-amber-500',
  red: 'border-red-800 hover:border-red-500',
};

const planAccents: Record<string, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-500',
  blue: 'bg-blue-600 hover:bg-blue-500',
  amber: 'bg-amber-600 hover:bg-amber-500',
  red: 'bg-red-600 hover:bg-red-500',
};

export function InvestView() {
  const wallet = useWallet();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadInvestments = useCallback(async () => {
    const { data } = await supabase.from('investments').select('*').eq('status', 'active').order('created_at', { ascending: false });
    setInvestments((data ?? []) as Investment[]);
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  useEffect(() => {
    if (investments.length === 0) return;
    const interval = window.setInterval(async () => {
      const updated = investments.map((inv) => {
        const variance = (Math.random() - 0.4) * inv.rate * 2;
        const newValue = inv.current_value * (1 + inv.rate + variance);
        return { ...inv, current_value: newValue, last_update: new Date().toISOString() };
      });
      setInvestments(updated);
      for (const inv of updated) {
        await supabase.from('investments').update({ current_value: inv.current_value, last_update: inv.last_update }).eq('id', inv.id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [investments.length]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const openInvest = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minAmount.toString());
  };

  const confirmInvest = async () => {
    if (!selectedPlan || submitting) return;
    const amount = parseFloat(investAmount) || 0;
    if (amount < selectedPlan.minAmount) return showMsg('error', `Minimum investment is ${formatMoney(selectedPlan.minAmount)}`);
    if (amount > (wallet.balance ?? 0)) return showMsg('error', 'Insufficient funds');

    setSubmitting(true);
    const ok = await wallet.spend(amount);
    if (!ok) {
      setSubmitting(false);
      return showMsg('error', 'Investment failed');
    }

    await supabase.from('investments').insert({
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      amount,
      current_value: amount,
      rate: selectedPlan.rate,
      status: 'active',
    });

    await loadInvestments();
    setSubmitting(false);
    showMsg('success', `Invested ${formatMoney(amount)} in ${selectedPlan.name}`);
    setSelectedPlan(null);
  };

  const collect = async (inv: Investment) => {
    const value = inv.current_value;
    await wallet.addFunds(value);
    await supabase.from('investments').update({ status: 'collected', current_value: value }).eq('id', inv.id);
    await loadInvestments();
    showMsg('success', `Collected ${formatMoney(value)} from ${inv.plan_name}`);
  };

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalPnl = totalValue - totalInvested;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-1">Investments</h2>
        <p className="text-zinc-500 text-sm">Grow your money passively. Higher risk means higher potential returns.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Invested</div>
          <div className="text-xl font-bold text-zinc-100 tabular-nums">{formatMoney(totalInvested)}</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Current Value</div>
          <div className="text-xl font-bold text-zinc-100 tabular-nums">{formatMoney(totalValue)}</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1">Profit / Loss</div>
          <div className={`text-xl font-bold tabular-nums ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Investment plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INVESTMENT_PLANS.map((plan) => (
          <div key={plan.id} className={`rounded-xl border bg-zinc-900/60 p-5 transition-all ${planBorders[plan.color]}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{plan.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${riskColors[plan.risk]}`}>
                  {plan.risk} Risk
                </span>
              </div>
              <Activity className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-3">{plan.description}</p>
            <div className="flex items-center justify-between text-sm mb-4">
              <div>
                <span className="text-zinc-500">Growth rate</span>
                <span className="text-zinc-200 ml-2 font-medium">{(plan.rate * 100).toFixed(1)}% / tick</span>
              </div>
              <div>
                <span className="text-zinc-500">Min</span>
                <span className="text-zinc-200 ml-2 font-medium">{formatMoney(plan.minAmount)}</span>
              </div>
            </div>
            <button
              onClick={() => openInvest(plan)}
              className={`w-full py-2.5 ${planAccents[plan.color]} text-white rounded-lg font-semibold text-sm transition-colors`}
            >
              Invest Now
            </button>
          </div>
        ))}
      </div>

      {/* Active investments */}
      {investments.length > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Active Positions</h3>
          <div className="space-y-3">
            {investments.map((inv) => {
              const pnl = inv.current_value - inv.amount;
              const pnlPct = (pnl / inv.amount) * 100;
              return (
                <div key={inv.id} className="flex items-center justify-between bg-zinc-850 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{inv.plan_name}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />
                        {formatMoney(inv.amount)} invested
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-100 tabular-nums">{formatMoney(inv.current_value)}</div>
                      <div className={`text-xs tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatMoney(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                      </div>
                    </div>
                    <button
                      onClick={() => collect(inv)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Collect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invest modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedPlan(null)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-zinc-100 mb-1">Invest in {selectedPlan.name}</h3>
            <p className="text-sm text-zinc-400 mb-4">{selectedPlan.description}</p>
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1 block">Investment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                <input
                  type="number"
                  min={selectedPlan.minAmount}
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Minimum: {formatMoney(selectedPlan.minAmount)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedPlan(null)} disabled={submitting} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmInvest} disabled={submitting} className={`flex-1 py-2 ${planAccents[selectedPlan.color]} text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Invest ${formatMoney(parseFloat(investAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
