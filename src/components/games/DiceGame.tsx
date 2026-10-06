import { useState, useCallback } from 'react';
import { Dices } from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface DiceProps {
  balance: number;
  onSettle: (bet: number, payout: number, result: string) => void;
}

export function DiceGame({ balance, onSettle }: DiceProps) {
  const [bet, setBet] = useState('100');
  const [prediction, setPrediction] = useState<number>(50);
  const [direction, setDirection] = useState<'over' | 'under'>('under');
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const betAmt = parseFloat(bet) || 0;

  const winChance =
    direction === 'under' ? prediction : 100 - prediction;
  const multiplierVal = (99 / winChance);
  const payout = betAmt * multiplierVal;

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const roll = () => {
    if (rolling) return;
    if (betAmt <= 0) return showMsg('error', 'Enter a valid bet');
    if (betAmt > balance) return showMsg('error', 'Insufficient funds');
    if (winChance < 2) return showMsg('error', 'Win chance too low');

    setRolling(true);
    setRollResult(null);

    setTimeout(() => {
      const result = Math.floor(Math.random() * 100) + 1;
      const won = direction === 'under' ? result < prediction : result > prediction;
      const finalPayout = won ? payout : 0;
      setRollResult(result);
      setRolling(false);
      onSettle(betAmt, finalPayout, `Rolled ${result} — ${won ? 'Won' : 'Lost'} ${formatMoney(won ? finalPayout - betAmt : betAmt)}`);
      showMsg(won ? 'success' : 'error', won ? `Rolled ${result}! You won ${formatMoney(finalPayout - betAmt)}!` : `Rolled ${result}. You lost ${formatMoney(betAmt)}.`);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Dices className={`w-16 h-16 text-amber-400 ${rolling ? 'animate-bounce' : ''}`} />
        <div className="text-5xl font-bold tabular-nums text-zinc-100 w-24 text-center">
          {rolling ? '?' : rollResult ?? '–'}
        </div>
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

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-zinc-400">
            Win Chance: <span className="text-amber-400 font-medium">{winChance}%</span>
          </span>
          <span className="text-zinc-400">
            Payout: <span className="text-emerald-400 font-medium">{formatMoney(payout)}</span>
          </span>
        </div>
        <div className="relative px-2">
          <input
            type="range"
            min="2"
            max="98"
            value={prediction}
            disabled={rolling}
            onChange={(e) => setPrediction(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>0</span>
            <span className="text-amber-400 font-medium text-sm">Target: {prediction}</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setDirection('under')}
          disabled={rolling}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            direction === 'under' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          } disabled:opacity-50`}
        >
          Roll Under {prediction}
        </button>
        <button
          onClick={() => setDirection('over')}
          disabled={rolling}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            direction === 'over' ? 'bg-amber-600 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          } disabled:opacity-50`}
        >
          Roll Over {prediction}
        </button>
      </div>

      <div className="flex gap-3 items-end w-full max-w-md">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Bet Amount</label>
          <input
            type="number"
            min="0"
            value={bet}
            disabled={rolling}
            onChange={(e) => setBet(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
          />
        </div>
        <button
          onClick={roll}
          disabled={rolling}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          Roll Dice
        </button>
      </div>
    </div>
  );
}
