import { useState, useCallback } from 'react';
import { Coins } from 'lucide-react';
import { formatMoney } from '@/lib/format';

interface CoinFlipProps {
  balance: number;
  onSettle: (bet: number, payout: number, result: string) => void;
}

export function CoinFlip({ balance, onSettle }: CoinFlipProps) {
  const [bet, setBet] = useState('100');
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const betAmt = parseFloat(bet) || 0;

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }, []);

  const flip = () => {
    if (flipping) return;
    if (betAmt <= 0) return showMsg('error', 'Enter a valid bet');
    if (betAmt > balance) return showMsg('error', 'Insufficient funds');

    setFlipping(true);
    setResult(null);

    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = outcome === choice;
      const payout = won ? betAmt * 1.96 : 0;
      setResult(outcome);
      setFlipping(false);
      onSettle(betAmt, payout, `${choice.toUpperCase()} vs ${outcome.toUpperCase()} — ${won ? 'Won' : 'Lost'} ${formatMoney(won ? payout - betAmt : betAmt)}`);
      showMsg(won ? 'success' : 'error', won ? `You won ${formatMoney(payout - betAmt)}!` : `You lost ${formatMoney(betAmt)}.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div
          className={`text-7xl transition-transform duration-1000 ${flipping ? 'animate-spin' : ''}`}
          style={{ animationDuration: '0.3s' }}
        >
          <Coins
            className={`w-28 h-28 ${result === 'tails' ? 'text-amber-600' : 'text-amber-400'}`}
          />
        </div>
      </div>

      <div className="text-center h-6">
        {result && !flipping && <span className="text-zinc-300 text-lg font-medium capitalize">{result}!</span>}
        {flipping && <span className="text-zinc-500 text-lg animate-pulse">Flipping...</span>}
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

      <div className="flex gap-3">
        <button
          onClick={() => setChoice('heads')}
          disabled={flipping}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            choice === 'heads'
              ? 'bg-amber-500 text-zinc-900 scale-105'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          } disabled:opacity-50`}
        >
          Heads
        </button>
        <button
          onClick={() => setChoice('tails')}
          disabled={flipping}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            choice === 'tails'
              ? 'bg-amber-600 text-zinc-900 scale-105'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          } disabled:opacity-50`}
        >
          Tails
        </button>
      </div>

      <div className="flex gap-3 items-end w-full max-w-md">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Bet Amount</label>
          <input
            type="number"
            min="0"
            value={bet}
            disabled={flipping}
            onChange={(e) => setBet(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
          />
        </div>
        <button
          onClick={flip}
          disabled={flipping}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          Flip
        </button>
      </div>
    </div>
  );
}
