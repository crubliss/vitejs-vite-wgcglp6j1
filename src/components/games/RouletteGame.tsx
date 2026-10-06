import { useState, useCallback } from 'react';
import { Circle } from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface RouletteProps {
  balance: number;
  onSettle: (bet: number, payout: number, result: string) => void;
}

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1);

type BetType = 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'num';

interface BetSelection {
  type: BetType;
  num?: number;
}

export function RouletteGame({ balance, onSettle }: RouletteProps) {
  const [bet, setBet] = useState('100');
  const [selection, setSelection] = useState<BetSelection | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const betAmt = parseFloat(bet) || 0;

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const getMultiplier = (sel: BetSelection): number => {
    switch (sel.type) {
      case 'red':
      case 'black':
      case 'even':
      case 'odd':
      case 'low':
      case 'high':
        return 2;
      case 'num':
        return 36;
    }
  };

  const getLabel = (sel: BetSelection): string => {
    const labels: Record<string, string> = { red: 'Red', black: 'Black', even: 'Even', odd: 'Odd', low: '1-18', high: '19-36' };
    return sel.type === 'num' ? `Number ${sel.num}` : labels[sel.type];
  };

  const checkWin = (resultNum: number, sel: BetSelection): boolean => {
    if (resultNum === 0) return false;
    switch (sel.type) {
      case 'red': return REDS.has(resultNum);
      case 'black': return !REDS.has(resultNum);
      case 'even': return resultNum % 2 === 0;
      case 'odd': return resultNum % 2 === 1;
      case 'low': return resultNum >= 1 && resultNum <= 18;
      case 'high': return resultNum >= 19 && resultNum <= 36;
      case 'num': return resultNum === sel.num;
    }
  };

  const spin = () => {
    if (spinning) return;
    if (!selection) return showMsg('error', 'Select a bet first');
    if (betAmt <= 0) return showMsg('error', 'Enter a valid bet');
    if (betAmt > balance) return showMsg('error', 'Insufficient funds');

    setSpinning(true);
    setResult(null);

    setTimeout(() => {
      const resultNum = Math.floor(Math.random() * 37);
      const won = checkWin(resultNum, selection);
      const payout = won ? betAmt * getMultiplier(selection) : 0;
      setResult(resultNum);
      setSpinning(false);
      onSettle(betAmt, payout, `Roulette: ${resultNum} (${resultNum === 0 ? 'Green' : REDS.has(resultNum) ? 'Red' : 'Black'}) — Bet: ${getLabel(selection)} — ${won ? 'Won' : 'Lost'} ${formatMoney(won ? payout - betAmt : betAmt)}`);
      showMsg(won ? 'success' : 'error', won ? `Landed on ${resultNum}! You won ${formatMoney(payout - betAmt)}!` : `Landed on ${resultNum}. You lost ${formatMoney(betAmt)}.`);
    }, 2000);
  };

  const resultColor = result === null ? '' : result === 0 ? 'text-emerald-400' : REDS.has(result) ? 'text-red-400' : 'text-zinc-200';
  const resultBg = result === null ? 'bg-zinc-800' : result === 0 ? 'bg-emerald-900/50 border-emerald-700' : REDS.has(result) ? 'bg-red-900/50 border-red-700' : 'bg-zinc-800 border-zinc-600';

  return (
    <div className="flex flex-col items-center gap-5">
      <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center text-5xl font-bold tabular-nums transition-all ${resultBg} ${spinning ? 'animate-spin' : ''}`} style={{ animationDuration: '0.5s' }}>
        <span className={resultColor}>{spinning ? '?' : result ?? '–'}</span>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Number grid */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-12 gap-1 mb-1">
          <button
            onClick={() => setSelection({ type: 'num', num: 0 })}
            disabled={spinning}
            className={`py-2 rounded text-xs font-bold transition-all ${selection?.type === 'num' && selection.num === 0 ? 'bg-emerald-500 text-zinc-900' : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800/60'} disabled:opacity-50`}
          >
            0
          </button>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {NUMBERS.map((n) => {
            const isRed = REDS.has(n);
            const isSelected = selection?.type === 'num' && selection.num === n;
            return (
              <button
                key={n}
                onClick={() => setSelection({ type: 'num', num: n })}
                disabled={spinning}
                className={`py-2 rounded text-xs font-bold transition-all ${
                  isSelected
                    ? 'ring-2 ring-amber-400 ' + (isRed ? 'bg-red-500' : 'bg-zinc-300 text-zinc-900')
                    : isRed ? 'bg-red-900/60 text-red-300 hover:bg-red-800/60' : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/60'
                } disabled:opacity-50`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outside bets */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full max-w-2xl">
        {([
          { type: 'red' as BetType, label: 'Red', className: 'bg-red-900/60 text-red-300 hover:bg-red-800/60' },
          { type: 'black' as BetType, label: 'Black', className: 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/60' },
          { type: 'even' as BetType, label: 'Even', className: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60' },
          { type: 'odd' as BetType, label: 'Odd', className: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60' },
          { type: 'low' as BetType, label: '1-18', className: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60' },
          { type: 'high' as BetType, label: '19-36', className: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60' },
        ]).map((b) => (
          <button
            key={b.type}
            onClick={() => setSelection({ type: b.type })}
            disabled={spinning}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              selection?.type === b.type ? 'ring-2 ring-amber-400 ' + b.className : b.className
            }`}
          >
            {b.label}
            <span className="text-xs text-zinc-500 ml-1">2x</span>
          </button>
        ))}
      </div>

      {selection && (
        <div className="text-sm text-zinc-400">
          Betting on: <span className="text-amber-400 font-medium">{getLabel(selection)}</span> @ <span className="text-emerald-400">{getMultiplier(selection)}x</span>
        </div>
      )}

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
          disabled={spinning || !selection}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Circle className="w-4 h-4" /> Spin
        </button>
      </div>
    </div>
  );
}
