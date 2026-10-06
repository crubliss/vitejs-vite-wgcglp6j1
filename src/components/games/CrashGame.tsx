import { useState, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface CrashProps {
  balance: number;
  onSettle: (bet: number, payout: number, result: string) => void;
}

type Phase = 'idle' | 'running' | 'crashed' | 'cashed';

export function CrashGame({ balance, onSettle }: CrashProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [bet, setBet] = useState('100');
  const [cashedAt, setCashedAt] = useState(0);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const betAmt = parseFloat(bet) || 0;

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const startGame = () => {
    if (phase === 'running') return;
    if (betAmt <= 0) return showMsg('error', 'Enter a valid bet');
    if (betAmt > balance) return showMsg('error', 'Insufficient funds');

    const crash = generateCrashPoint();
    setCrashPoint(crash);
    setMultiplier(1);
    setCashedAt(0);
    setPhase('running');

    let current = 1;
    const interval = window.setInterval(() => {
      current += current * 0.08 + 0.01;
      setMultiplier(current);

      if (current >= crash) {
        clearInterval(interval);
        setMultiplier(crash);
        setPhase('crashed');
        onSettle(betAmt, 0, `Crashed @ ${crash.toFixed(2)}x — Lost ${formatMoney(betAmt)}`);
        showMsg('error', `Crashed at ${crash.toFixed(2)}x! You lost ${formatMoney(betAmt)}.`);
      }
    }, 80);
  };

  const cashOut = () => {
    if (phase !== 'running') return;
    const payout = betAmt * multiplier;
    setCashedAt(multiplier);
    setPhase('cashed');
    onSettle(betAmt, payout, `Cashed @ ${multiplier.toFixed(2)}x — Won ${formatMoney(payout - betAmt)}`);
    showMsg('success', `Cashed out at ${multiplier.toFixed(2)}x! Won ${formatMoney(payout - betAmt)}.`);
  };

  const reset = () => {
    setPhase('idle');
    setMultiplier(1);
    setCashedAt(0);
  };

  const color =
    phase === 'crashed' ? '#ef4444' :
    phase === 'cashed' ? '#22c55e' :
    phase === 'running' ? '#f59e0b' : '#a1a1aa';

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full h-64 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(39,39,42,0.8) 0%, rgba(9,9,11,1) 70%)' }}
      >
        <div className="text-center z-10">
          <div className="text-6xl font-bold tabular-nums transition-colors" style={{ color }}>
            {multiplier.toFixed(2)}x
          </div>
          {phase === 'crashed' && <div className="text-red-400 text-lg mt-2 font-semibold">CRASHED</div>}
          {phase === 'cashed' && <div className="text-emerald-400 text-lg mt-2 font-semibold">CASHED OUT</div>}
          {phase === 'idle' && <div className="text-zinc-600 text-sm mt-2">Place a bet and launch</div>}
        </div>
        {phase === 'running' && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/30">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, (multiplier / crashPoint) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`px-4 py-2 rounded-lg text-sm ${
            msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-end w-full max-w-md">
        <div className="flex-1 w-full">
          <label className="text-xs text-zinc-500 mb-1 block">Bet Amount</label>
          <input
            type="number"
            min="0"
            value={bet}
            disabled={phase === 'running' || phase === 'crashed'}
            onChange={(e) => setBet(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
          />
        </div>
        {phase === 'idle' || phase === 'cashed' ? (
          <button
            onClick={startGame}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Flame className="w-4 h-4" /> Launch
          </button>
        ) : phase === 'running' ? (
          <button
            onClick={cashOut}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            Cash Out ({formatMoney(betAmt * multiplier)})
          </button>
        ) : (
          <button
            onClick={reset}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1;
  const houseEdge = 0.97;
  return Math.max(1, (houseEdge / (1 - r)));
}
