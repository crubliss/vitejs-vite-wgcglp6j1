import { useEffect, useState, useCallback } from 'react';
import { Wrench, Save, Trash2, Plus, Crosshair } from 'lucide-react';
import { supabase, Gun } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';

const FRAMES = [
  { name: 'Compact', damage: 8, accuracy: 15, fireRate: 20, cost: 500 },
  { name: 'Standard', damage: 12, accuracy: 25, fireRate: 30, cost: 1200 },
  { name: 'Heavy', damage: 20, accuracy: 10, fireRate: 15, cost: 3000 },
  { name: 'Tactical', damage: 15, accuracy: 35, fireRate: 40, cost: 5500 },
  { name: 'Military', damage: 25, accuracy: 30, fireRate: 35, cost: 10000 },
];

const BARRELS = [
  { name: 'Short', damage: -2, accuracy: -10, fireRate: 10, cost: 300 },
  { name: 'Standard', damage: 0, accuracy: 0, fireRate: 0, cost: 800 },
  { name: 'Long', damage: 5, accuracy: 15, fireRate: -5, cost: 1500 },
  { name: 'Match Grade', damage: 3, accuracy: 25, fireRate: -8, cost: 3200 },
  { name: 'Compensated', damage: 2, accuracy: 10, fireRate: 12, cost: 2800 },
];

const SIGHTS = [
  { name: 'Iron Sights', accuracy: 0, cost: 0 },
  { name: 'Red Dot', accuracy: 15, cost: 600 },
  { name: 'Holographic', accuracy: 20, cost: 1200 },
  { name: 'ACOG', accuracy: 30, cost: 2500 },
  { name: 'Sniper Scope', accuracy: 45, cost: 5000 },
];

export function GunWorkshop() {
  const wallet = useWallet();
  const [guns, setGuns] = useState<Gun[]>([]);
  const [gunName, setGunName] = useState('');
  const [frameIdx, setFrameIdx] = useState(1);
  const [barrelIdx, setBarrelIdx] = useState(1);
  const [sightIdx, setSightIdx] = useState(0);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadGuns = useCallback(async () => {
    const { data } = await supabase.from('guns').select('*').order('created_at', { ascending: false });
    setGuns((data ?? []) as Gun[]);
  }, []);

  useEffect(() => { loadGuns(); }, [loadGuns]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const frame = FRAMES[frameIdx];
  const barrel = BARRELS[barrelIdx];
  const sight = SIGHTS[sightIdx];

  const totalDamage = Math.max(1, frame.damage + barrel.damage);
  const totalAccuracy = Math.max(5, Math.min(100, frame.accuracy + barrel.accuracy + sight.accuracy));
  const totalFireRate = Math.max(5, frame.fireRate + barrel.fireRate);
  const totalCost = frame.cost + barrel.cost + sight.cost;

  const buildGun = async () => {
    if (!gunName.trim()) return showMsg('error', 'Name your gun first');
    if (totalCost > (wallet.balance ?? 0)) return showMsg('error', `Insufficient funds — need ${formatMoney(totalCost)}`);

    const ok = await wallet.spend(totalCost);
    if (!ok) return showMsg('error', 'Purchase failed');

    await supabase.from('guns').insert({
      name: gunName.trim(),
      frame: frame.name,
      barrel: barrel.name,
      sight: sight.name,
      damage: totalDamage,
      accuracy: totalAccuracy,
      fire_rate: totalFireRate,
    });

    setGunName('');
    await loadGuns();
    showMsg('success', `Built "${gunName.trim()}" for ${formatMoney(totalCost)}`);
  };

  const deleteGun = async (gun: Gun) => {
    await supabase.from('guns').delete().eq('id', gun.id);
    await loadGuns();
    showMsg('success', `Deleted "${gun.name}"`);
  };

  const StatBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300 font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all rounded-full`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-1">Gun Workshop</h2>
        <p className="text-zinc-500 text-sm">Build custom guns by mixing frames, barrels, and sights. Take them to the range to test them out.</p>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Builder */}
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Gun Name</label>
            <input type="text" value={gunName} onChange={(e) => setGunName(e.target.value)} placeholder="e.g. Thunderstrike, Reaper..."
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600" />
          </div>

          {/* Frame selection */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Frame</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FRAMES.map((f, i) => (
                <button key={f.name} onClick={() => setFrameIdx(i)}
                  className={`text-left p-3 rounded-lg border transition-all ${frameIdx === i ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}>
                  <div className="text-sm font-medium text-zinc-200">{f.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{formatMoney(f.cost)}</div>
                  <div className="text-xs text-zinc-500 mt-1">DMG {f.damage} &middot; ACC {f.accuracy} &middot; ROF {f.fireRate}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Barrel selection */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Barrel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BARRELS.map((b, i) => (
                <button key={b.name} onClick={() => setBarrelIdx(i)}
                  className={`text-left p-3 rounded-lg border transition-all ${barrelIdx === i ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}>
                  <div className="text-sm font-medium text-zinc-200">{b.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{formatMoney(b.cost)}</div>
                  <div className="text-xs text-zinc-500 mt-1">DMG {b.damage >= 0 ? '+' : ''}{b.damage} &middot; ACC {b.accuracy >= 0 ? '+' : ''}{b.accuracy} &middot; ROF {b.fireRate >= 0 ? '+' : ''}{b.fireRate}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sight selection */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Sight</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SIGHTS.map((s, i) => (
                <button key={s.name} onClick={() => setSightIdx(i)}
                  className={`text-left p-3 rounded-lg border transition-all ${sightIdx === i ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}>
                  <div className="text-sm font-medium text-zinc-200">{s.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.cost === 0 ? 'Free' : formatMoney(s.cost)}</div>
                  <div className="text-xs text-zinc-500 mt-1">ACC +{s.accuracy}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-3">
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-500" /> Build Preview
            </h3>
            <div className="space-y-3 mb-4">
              <StatBar label="Damage" value={totalDamage} max={40} color="bg-red-500" />
              <StatBar label="Accuracy" value={totalAccuracy} max={100} color="bg-blue-500" />
              <StatBar label="Fire Rate" value={totalFireRate} max={60} color="bg-amber-500" />
            </div>

            {/* Parts summary */}
            <div className="space-y-1 mb-4 text-xs">
              <div className="flex justify-between text-zinc-500"><span>Frame:</span><span className="text-zinc-300">{frame.name} ({formatMoney(frame.cost)})</span></div>
              <div className="flex justify-between text-zinc-500"><span>Barrel:</span><span className="text-zinc-300">{barrel.name} ({formatMoney(barrel.cost)})</span></div>
              <div className="flex justify-between text-zinc-500"><span>Sight:</span><span className="text-zinc-300">{sight.name} ({sight.cost === 0 ? 'Free' : formatMoney(sight.cost)})</span></div>
            </div>

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Total Cost</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">{formatMoney(totalCost)}</span>
            </div>

            <button onClick={buildGun} disabled={!gunName.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
              <Wrench className="w-4 h-4" /> Build Gun
            </button>
          </div>
        </div>
      </div>

      {/* Owned guns */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Your Arsenal ({guns.length})</h3>
        {guns.length === 0 ? (
          <p className="text-sm text-zinc-600">No guns built yet. Use the workshop above to craft one.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guns.map((gun) => (
              <div key={gun.id} className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{gun.name}</h4>
                    <p className="text-xs text-zinc-500">{gun.frame} &middot; {gun.barrel} &middot; {gun.sight}</p>
                  </div>
                  <button onClick={() => deleteGun(gun)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center bg-zinc-900/60 rounded py-1.5">
                    <div className="text-zinc-500">DMG</div>
                    <div className="text-red-400 font-bold">{gun.damage}</div>
                  </div>
                  <div className="text-center bg-zinc-900/60 rounded py-1.5">
                    <div className="text-zinc-500">ACC</div>
                    <div className="text-blue-400 font-bold">{gun.accuracy}</div>
                  </div>
                  <div className="text-center bg-zinc-900/60 rounded py-1.5">
                    <div className="text-zinc-500">ROF</div>
                    <div className="text-amber-400 font-bold">{gun.fire_rate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
