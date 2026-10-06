import { useState, useCallback } from 'react';
import { Cherry, Citrus, Bell, Diamond, Star, Crown } from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface SlotsProps {
  balance: number;
  onSettle: (bet: number, payout: number, result: string) => void;
}

const SYMBOLS = [
  { icon: Cherry, color: 'text-red-400', value: 2, name: 'Cherry' },
  { icon: Citrus, color: 'text-yellow-400', value: 3, name: 'Lemon' },
  { icon: Bell, color: 'text-amber-400', value: 5, name: 'Bell' },
  { icon: Diamond, color: 'text-cyan-400', value: 10, name: 'Diamond' },
  { icon: Star, color: 'text-purple-400', value: 20, name: 'Star' },
  { icon: Crown, color: 'text-emerald-400', value: 50, name: 'Crown' },
];

const WEIGHTS = [30, 25, 18, 12, 8, 4];

function pickSymbol() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

export function SlotsGame({ balance, onSettle }: SlotsProps) {
  const [bet, setBet] = useState('100');
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const betAmt = parseFloat(bet) || 0;

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const spin = () => {
    if (spinning) return;
    if (betAmt <= 0) return showMsg('error', 'Enter a valid bet');
    if (betAmt > balance) return showMsg('error', 'Insufficient funds');

    setSpinning(true);
    setMsg(null);

    const finalReels = [pickSymbol(), pickSymbol(), pickSymbol()];

    let ticks = 0;
    const interval = window.setInterval(() => {
      setReels([pickSymbol(), pickSymbol(), pickSymbol()]);
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        setReels(finalReels);
        setSpinning(false);

        const [a, b, c] = finalReels;
        let payout = 0;
        let resultText = '';

        if (a === b && b === c) {
          payout = betAmt * SYMBOLS[a].value;
          resultText = `3x ${SYMBOLS[a].name}! Won ${formatMoney(payout - betAmt)}`;
        } else if (a === b || b === c || a === c) {
          const matchSym = a === b ? SYMBOLS[a] : b === c ? SYMBOLS[b] : SYMBOLS[a];
          payout = betAmt * (matchSym.value / 5);
          resultText = `Pair of ${matchSym.name}s. Won ${formatMoney(payout - betAmt)}`;
        } else {
          resultText = `No match. Lost ${formatMoney(betAmt)}`;
        }

        onSettle(betAmt, payout, `Slots: ${SYMBOLS[a].name}-${SYMBOLS[b].name}-${SYMBOLS[c].name} — ${resultText}`);
        showMsg(payout > 0 ? 'success' : 'error', payout > 0 ? `You won ${formatMoney(payout - betAmt)}!` : `No match. You lost ${formatMoney(betAmt)}.`);
      }
    }, 80);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3 bg-zinc-950 rounded-2xl border-2 border-zinc-700 p-4">
        {reels.map((sym, i) => {
          const S = SYMBOLS[sym];
          const Icon = S.icon;
          return (
            <div
              key={i}
              className={`w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center ${spinning ? 'animate-pulse' : ''}`}
            >
              <Icon className={`w-14 h-14 ${S.color}`} />
            </div>
          );
        })}
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Paytable */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-lg">
        {SYMBOLS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2 border border-zinc-800">
              <Icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-xs text-zinc-400 flex-1">{s.name}</span>
              <span className="text-xs text-amber-400 font-medium">{s.value}x</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-end w-full max-w-md">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Bet Amount</label>
          <input
            type="number"
            min="0"
            value={bet}
            disabled={spinning}
            onChange={(e) => setBet(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
          />
        </div>
        <button
          onClick={spin}
          disabled={spinning}
          className="px-8 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {spinning ? 'Spinning...' : 'Spin'}
        </button>
      </div>
    </div>
  );
}
