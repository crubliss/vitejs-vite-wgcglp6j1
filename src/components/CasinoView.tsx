import { useState, useEffect, useCallback } from 'react';
import { Coins, Dices, Circle, Cherry, Flame, History, ArrowLeft } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';
import { supabase, GameRecord } from '@/lib/supabase';
import { CoinFlip } from '@/components/games/CoinFlip';
import { DiceGame } from '@/components/games/DiceGame';
import { RouletteGame } from '@/components/games/RouletteGame';
import { SlotsGame } from '@/components/games/SlotsGame';
import { CrashGame } from '@/components/games/CrashGame';

type GameType = 'menu' | 'coinflip' | 'dice' | 'roulette' | 'slots' | 'crash';

const GAMES: { id: GameType; name: string; desc: string; icon: typeof Coins; color: string }[] = [
  { id: 'crash', name: 'Crash', desc: 'Cash out before it crashes', icon: Flame, color: 'from-amber-600 to-orange-700' },
  { id: 'coinflip', name: 'Coin Flip', desc: 'Heads or tails — 2x payout', icon: Coins, color: 'from-amber-500 to-yellow-600' },
  { id: 'dice', name: 'Dice', desc: 'Pick a number, roll to win', icon: Dices, color: 'from-blue-500 to-cyan-600' },
  { id: 'roulette', name: 'Roulette', desc: 'Red, black, or numbers — up to 36x', icon: Circle, color: 'from-red-500 to-rose-700' },
  { id: 'slots', name: 'Slots', desc: 'Match symbols — up to 50x', icon: Cherry, color: 'from-emerald-500 to-teal-700' },
];

export function CasinoView() {
  const wallet = useWallet();
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [history, setHistory] = useState<GameRecord[]>([]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('game_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data ?? []) as GameRecord[]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSettle = useCallback(
    (bet: number, payout: number, result: string) => {
      const gameType = activeGame === 'menu' ? 'unknown' : activeGame;
      wallet.recordGame(gameType, bet, payout, result).then(() => loadHistory());
    },
    [wallet, activeGame, loadHistory],
  );

  const renderGame = () => {
    if (!wallet.balance && wallet.balance !== 0) return null;
    const balance = wallet.balance ?? 0;

    switch (activeGame) {
      case 'crash':
        return <CrashGame balance={balance} onSettle={handleSettle} />;
      case 'coinflip':
        return <CoinFlip balance={balance} onSettle={handleSettle} />;
      case 'dice':
        return <DiceGame balance={balance} onSettle={handleSettle} />;
      case 'roulette':
        return <RouletteGame balance={balance} onSettle={handleSettle} />;
      case 'slots':
        return <SlotsGame balance={balance} onSettle={handleSettle} />;
      default:
        return null;
    }
  };

  if (activeGame === 'menu') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-1">Casino Games</h2>
          <p className="text-zinc-500 text-sm">Pick a game and test your luck. All bets use your trading balance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-left hover:border-zinc-600 transition-all hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${g.color} group-hover:opacity-20 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${g.color} mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100">{g.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{g.desc}</p>
                </div>
              </button>
            );
          })}

          {/* History card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-300">Recent Games</h3>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-600">No games played yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h) => {
                  const net = h.payout - h.bet_amount;
                  return (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-400 capitalize">{h.game_type}</span>
                        <span className="text-zinc-600 ml-2 truncate">{h.result}</span>
                      </div>
                      <span className={`tabular-nums font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {net >= 0 ? '+' : ''}{formatMoney(net)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const gameInfo = GAMES.find((g) => g.id === activeGame)!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveGame('menu')}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${gameInfo.color}`}>
            <gameInfo.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{gameInfo.name}</h2>
            <p className="text-xs text-zinc-500">{gameInfo.desc}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-6 lg:p-8">
        {renderGame()}
      </div>

      {/* Game history */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-300">Game History</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600">No games played yet.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.map((h) => {
              const net = h.payout - h.bet_amount;
              return (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-300 capitalize font-medium">{h.game_type}</span>
                    <span className="text-zinc-500 ml-3 truncate">{h.result}</span>
                  </div>
                  <span className={`tabular-nums font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {net >= 0 ? '+' : ''}{formatMoney(net)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
