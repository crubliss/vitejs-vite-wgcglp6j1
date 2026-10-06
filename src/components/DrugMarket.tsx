import { useEffect, useState, useCallback } from 'react';
import {
  Leaf, FlaskConical, Pill, Zap, Heart, Sparkles, Eye, Orbit,
  ShoppingCart, Check, AlertTriangle, Lock, X, Loader2,
  Package, Clock, TrendingUp, Flame, Trash2,
} from 'lucide-react';
import { DRUGS, DrugListing, DrugQuality, QUALITY_COLORS, QUALITY_BORDER } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';

const ICON_MAP: Record<string, typeof Leaf> = {
  Leaf, FlaskConical, Pill, Zap, Heart, Sparkles, Eye, Orbit,
};

interface OwnedDrug {
  id: string;
  drug_id: string;
  drug_name: string;
  quality: DrugQuality;
  quantity: number;
  luck_bonus: number;
  duration_min: number;
}

interface ActiveEffect {
  drugName: string;
  quality: DrugQuality;
  luckBonus: number;
  durationSec: number;
  endsAt: number;
}

export function DrugMarket() {
  const wallet = useWallet();
  const [inventory, setInventory] = useState<OwnedDrug[]>([]);
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);
  const [now, setNow] = useState(Date.now());
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDrug, setConfirmDrug] = useState<{ drug: DrugListing; quality: DrugQuality } | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const loadInventory = useCallback(async () => {
    const { data } = await supabase.from('drug_inventory').select('*').order('purchased_at', { ascending: false });
    setInventory((data ?? []) as OwnedDrug[]);
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Restore active effect from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('active_drug_effect');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ActiveEffect;
        if (parsed.endsAt > Date.now()) {
          setActiveEffect(parsed);
        } else {
          localStorage.removeItem('active_drug_effect');
        }
      } catch {
        localStorage.removeItem('active_drug_effect');
      }
    }
  }, []);

  // Clear effect when expired
  useEffect(() => {
    if (activeEffect && now >= activeEffect.endsAt) {
      setActiveEffect(null);
      localStorage.removeItem('active_drug_effect');
    }
  }, [activeEffect, now]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const handleBuy = async () => {
    if (!confirmDrug) return;
    const { drug, quality } = confirmDrug;
    const q = drug.qualities.find((qq) => qq.quality === quality)!;

    if (q.price > (wallet.balance ?? 0)) {
      showMsg('error', 'Insufficient funds');
      return;
    }

    setPurchasing(true);
    await new Promise((r) => setTimeout(r, 800));

    const ok = await wallet.spend(q.price);
    if (!ok) {
      setPurchasing(false);
      showMsg('error', 'Purchase failed — insufficient funds');
      return;
    }

    const existing = inventory.find((d) => d.drug_id === drug.id && d.quality === quality);
    if (existing) {
      await supabase
        .from('drug_inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('drug_inventory').insert({
        drug_id: drug.id,
        drug_name: drug.name,
        quality,
        luck_bonus: q.luckBonus,
        duration_min: q.durationMin,
      });
    }

    await loadInventory();
    setPurchasing(false);
    showMsg('success', `Bought ${q.label} ${drug.name} for ${formatMoney(q.price)}`);
    setConfirmDrug(null);
  };

  const handleUse = async (drug: OwnedDrug) => {
    const durationSec = drug.duration_min * 60;
    const effect: ActiveEffect = {
      drugName: drug.drug_name,
      quality: drug.quality,
      luckBonus: drug.luck_bonus,
      durationSec,
      endsAt: Date.now() + durationSec * 1000,
    };
    setActiveEffect(effect);
    localStorage.setItem('active_drug_effect', JSON.stringify(effect));

    if (drug.quantity <= 1) {
      await supabase.from('drug_inventory').delete().eq('id', drug.id);
      setInventory((prev) => prev.filter((d) => d.id !== drug.id));
    } else {
      await supabase.from('drug_inventory').update({ quantity: drug.quantity - 1 }).eq('id', drug.id);
      setInventory((prev) =>
        prev.map((d) => (d.id === drug.id ? { ...d, quantity: d.quantity - 1 } : d)),
      );
    }

    showMsg('success', `Used ${drug.drug_name} — +${drug.luck_bonus}% luck for ${drug.duration_min} min`);
  };

  const handleTrash = async (drug: OwnedDrug) => {
    await supabase.from('drug_inventory').delete().eq('id', drug.id);
    setInventory((prev) => prev.filter((d) => d.id !== drug.id));
    showMsg('success', `Discarded ${drug.drug_name}`);
  };

  const remainingSec = activeEffect ? Math.max(0, Math.ceil((activeEffect.endsAt - now) / 1000)) : 0;
  const remainingMin = Math.floor(remainingSec / 60);
  const remainingSecDisplay = remainingSec % 60;

  return (
    <div className="flex flex-col gap-5">
      {/* Active effect banner */}
      {activeEffect && (
        <div className="bg-gradient-to-r from-purple-900/40 via-zinc-900 to-zinc-900 border border-purple-700/40 rounded-xl p-4 flex items-center gap-4">
          <Flame className="w-8 h-8 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100">{activeEffect.drugName}</span>
              <span className={`text-xs ${QUALITY_COLORS[activeEffect.quality]}`}>
                {activeEffect.quality}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +{activeEffect.luckBonus}% Luck Active
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                {remainingMin}:{remainingSecDisplay.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-purple-500 transition-all duration-1000 rounded-full"
              style={{
                width: `${activeEffect ? Math.min(100, (remainingSec / activeEffect.durationSec) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Browser chrome */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex-1 flex items-center gap-2 mx-2 bg-zinc-800 rounded-lg px-3 py-1.5">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-zinc-400 truncate">darkmarket.onion / narcotics</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-4 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              You are browsing the narcotics section of the black market. All products are illegal.
              Purchases are final. Using substances grants temporary luck bonuses at the casino —
              higher quality means stronger effects.
            </p>
          </div>

          {msg && (
            <div
              className={`mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                  : 'bg-red-900/40 text-red-400 border border-red-800/50'
              }`}
            >
              {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          {/* Drug listings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DRUGS.map((drug) => {
              const Icon = ICON_MAP[drug.icon] ?? Leaf;
              return (
                <div
                  key={drug.id}
                  className="rounded-xl border border-red-900/30 bg-zinc-800/40 overflow-hidden hover:border-zinc-600 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-zinc-100">{drug.name}</h3>
                        <span className="text-xs text-zinc-500">{drug.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 min-h-[2.5rem]">{drug.description}</p>

                    <div className="space-y-2">
                      {drug.qualities.map((q) => (
                        <div
                          key={q.quality}
                          className={`flex items-center justify-between gap-2 rounded-lg border ${QUALITY_BORDER[q.quality]} bg-zinc-900/50 px-3 py-2`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${QUALITY_COLORS[q.quality]}`}>
                                {q.label}
                              </span>
                              <span className="text-xs text-zinc-600">·</span>
                              <span className="text-xs text-emerald-400 font-medium">+{q.luckBonus}% luck</span>
                              <span className="text-xs text-zinc-600">·</span>
                              <span className="text-xs text-zinc-500">{q.durationMin}m</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-bold tabular-nums text-red-400">
                              {formatMoney(q.price)}
                            </span>
                            <button
                              onClick={() => setConfirmDrug({ drug, quality: q.quality })}
                              disabled={q.price > (wallet.balance ?? 0)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                                q.price > (wallet.balance ?? 0)
                                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                  : 'bg-red-700 hover:bg-red-600 text-white'
                              }`}
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-zinc-100">Your Stash</h2>
          {inventory.length > 0 && (
            <span className="text-xs text-zinc-500 ml-auto">{inventory.length} type(s)</span>
          )}
        </div>

        <div className="p-4">
          {inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Your stash is empty. Buy something to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventory.map((drug) => {
                const catalogDrug = DRUGS.find((d) => d.id === drug.drug_id);
                const Icon = (catalogDrug ? ICON_MAP[catalogDrug.icon] : null) ?? Leaf;
                const canUse = !activeEffect;
                return (
                  <div
                    key={drug.id}
                    className={`rounded-lg border ${QUALITY_BORDER[drug.quality]} bg-zinc-800/40 p-3`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-100">{drug.drug_name}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={QUALITY_COLORS[drug.quality]}>{drug.quality}</span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-emerald-400">+{drug.luck_bonus}%</span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-500">{drug.duration_min}m</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-300 bg-zinc-800 rounded px-2 py-0.5">
                        x{drug.quantity}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUse(drug)}
                        disabled={!canUse}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          canUse
                            ? 'bg-purple-700 hover:bg-purple-600 text-white'
                            : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {canUse ? 'Use' : 'Active'}
                      </button>
                      <button
                        onClick={() => handleTrash(drug)}
                        className="px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-red-900/40 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Purchase confirmation modal */}
      {confirmDrug && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !purchasing && setConfirmDrug(null)}
        >
          <div
            className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-zinc-100">Confirm Purchase</h3>
              {!purchasing && (
                <button onClick={() => setConfirmDrug(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {(() => {
              const q = confirmDrug.drug.qualities.find((qq) => qq.quality === confirmDrug.quality)!;
              return (
                <>
                  <p className="text-sm text-zinc-400 mb-4">
                    {q.label} {confirmDrug.drug.name}
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Price</span>
                      <span className="text-red-400 font-bold">{formatMoney(q.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Luck Bonus</span>
                      <span className="text-emerald-400 font-medium">+{q.luckBonus}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Duration</span>
                      <span className="text-zinc-300">{q.durationMin} minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Your Balance</span>
                      <span className="text-zinc-300">{formatMoney(wallet.balance ?? 0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDrug(null)}
                      disabled={purchasing}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBuy}
                      disabled={purchasing}
                      className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" /> Buy for {formatMoney(q.price)}
                        </>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
