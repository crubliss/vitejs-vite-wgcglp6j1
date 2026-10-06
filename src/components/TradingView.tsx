import { useEffect, useRef, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { STOCKS, createLiveStocks, tickStock, LiveStock } from '@/lib/stocks';
import { Sparkline } from '@/components/Sparkline';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney, formatShares, formatCompact } from '@/lib/format';

export function TradingView() {
  const wallet = useWallet();
  const [stocks, setStocks] = useState<LiveStock[]>(() => createLiveStocks());
  const [selected, setSelected] = useState<string>('AAPL');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [tradeMsg, setTradeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const tickRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStocks((prev) => prev.map(tickStock));
    }, 2000);
    tickRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  const current = stocks.find((s) => s.info.symbol === selected)!;
  const filtered = stocks.filter(
    (s) =>
      s.info.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.info.name.toLowerCase().includes(search.toLowerCase()),
  );

  const qty = parseFloat(quantity) || 0;
  const orderTotal = qty * (current?.price ?? 0);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setTradeMsg({ type, text });
    setTimeout(() => setTradeMsg(null), 3000);
  }, []);

  const handleBuy = async () => {
    if (qty <= 0) return showMsg('error', 'Enter a valid quantity');
    const res = await wallet.executeBuy(current.info.symbol, qty, current.price);
    if (res.success) showMsg('success', `Bought ${qty} ${current.info.symbol} for ${formatMoney(qty * current.price)}`);
    else showMsg('error', res.error ?? 'Trade failed');
  };

  const handleSell = async () => {
    if (qty <= 0) return showMsg('error', 'Enter a valid quantity');
    const res = await wallet.executeSell(current.info.symbol, qty, current.price);
    if (res.success) showMsg('success', `Sold ${qty} ${current.info.symbol} for ${formatMoney(qty * current.price)}`);
    else showMsg('error', res.error ?? 'Trade failed');
  };

  const holding = wallet.holdings.find((h) => h.symbol === selected);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Stock list */}
      <div className="lg:w-80 flex flex-col bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stocks..."
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[280px] lg:max-h-none">
          {filtered.map((s) => {
            const isUp = s.changePct >= 0;
            const h = wallet.holdings.find((hd) => hd.symbol === s.info.symbol);
            return (
              <button
                key={s.info.symbol}
                onClick={() => setSelected(s.info.symbol)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors text-left ${
                  selected === s.info.symbol ? 'bg-zinc-800/60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-100">{s.info.symbol}</span>
                    {h && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400">
                        {formatShares(h.quantity)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 truncate block">{s.info.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkline data={s.history.map((t) => t.price)} width={60} height={28} fill={false} />
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-100 tabular-nums">${formatCompact(s.price)}</div>
                    <div
                      className={`text-xs tabular-nums flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart + trade panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Chart card */}
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-100">{current.info.symbol}</h2>
                <span className="text-sm text-zinc-500">{current.info.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{current.info.sector}</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl font-bold tabular-nums text-zinc-100">${formatCompact(current.price)}</span>
                <span
                  className={`text-sm tabular-nums flex items-center gap-1 ${
                    current.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {current.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {current.change >= 0 ? '+' : ''}{current.change.toFixed(2)} ({current.changePct >= 0 ? '+' : ''}{current.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>
            {holding && (
              <div className="text-right text-sm">
                <div className="text-zinc-500">Position</div>
                <div className="text-zinc-200 font-medium">{formatShares(holding.quantity)} shares</div>
                <div className="text-zinc-500 text-xs">Avg ${formatCompact(holding.avg_price)}</div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[160px] flex items-end">
            <div className="w-full">
              <Sparkline
                data={current.history.map((t) => t.price)}
                width={1000}
                height={200}
                color={current.change >= 0 ? '#22c55e' : '#ef4444'}
              />
              <div className="scale-100 origin-top-left w-full" style={{ transform: 'scaleX(1)' }}>
              </div>
            </div>
          </div>
        </div>

        {/* Order panel */}
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          {tradeMsg && (
            <div
              className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                tradeMsg.type === 'success'
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                  : 'bg-red-900/40 text-red-400 border border-red-800/50'
              }`}
            >
              {tradeMsg.text}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-zinc-500 mb-1 block">Quantity (shares)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500">Order Total</div>
              <div className="text-lg font-semibold text-zinc-100 tabular-nums">{formatMoney(orderTotal)}</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBuy}
                className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
              >
                Buy
              </button>
              <button
                onClick={handleSell}
                className="flex-1 sm:flex-none px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
              >
                Sell
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {['1', '5', '10', '25', '50', '100'].map((n) => (
              <button
                key={n}
                onClick={() => setQuantity(n)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio + Trade history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Portfolio</h3>
            {wallet.holdings.length === 0 ? (
              <p className="text-sm text-zinc-600">No positions yet. Buy a stock to start trading.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wallet.holdings.map((h) => {
                  const stock = stocks.find((s) => s.info.symbol === h.symbol);
                  const currentVal = stock ? stock.price * h.quantity : 0;
                  const cost = h.avg_price * h.quantity;
                  const pnl = currentVal - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  return (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-zinc-200">{h.symbol}</span>
                        <span className="text-zinc-500 ml-2">{formatShares(h.quantity)} @ ${formatCompact(h.avg_price)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-200 tabular-nums">{formatMoney(currentVal)}</div>
                        <div className={`text-xs tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{formatMoney(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Recent Trades</h3>
            {wallet.trades.length === 0 ? (
              <p className="text-sm text-zinc-600">No trades yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wallet.trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          t.action === 'buy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {t.action.toUpperCase()}
                      </span>
                      <span className="text-zinc-200">{t.symbol}</span>
                      <span className="text-zinc-500 text-xs">{formatShares(t.quantity)} @ ${formatCompact(t.price)}</span>
                    </div>
                    <span className="text-zinc-400 tabular-nums text-xs">{formatMoney(t.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
