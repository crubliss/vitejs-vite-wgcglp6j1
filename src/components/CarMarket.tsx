import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Check, AlertTriangle, Globe, Lock, X, Loader2 } from 'lucide-react';
import { MARKET_CARS, BLACK_MARKET_CARS, CarListing } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';

interface CarMarketProps {
  mode: 'market' | 'blackmarket';
}

interface InventoryItem {
  listing_id: string;
  in_stock: boolean;
}

export function CarMarket({ mode }: CarMarketProps) {
  const wallet = useWallet();
  const [purchaseMsg, setPurchaseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmCar, setConfirmCar] = useState<CarListing | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [buyChance, setBuyChance] = useState<number>(100);
  const [purchasing, setPurchasing] = useState(false);
  const [inventory, setInventory] = useState<Record<string, boolean>>({});

  const allCars = mode === 'blackmarket' ? BLACK_MARKET_CARS : MARKET_CARS;

  const loadInventory = useCallback(async () => {
    const { data } = await supabase.from('market_inventory').select('listing_id, in_stock');
    const map: Record<string, boolean> = {};
    for (const item of (data ?? []) as InventoryItem[]) {
      map[item.listing_id] = item.in_stock;
    }
    // For any car not in DB yet, default to in stock
    for (const car of allCars) {
      if (!(car.id in map)) map[car.id] = true;
    }
    setInventory(map);
  }, [allCars]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setPurchaseMsg({ type, text });
    setTimeout(() => setPurchaseMsg(null), 4000);
  }, []);

  const availableCars = allCars.filter((c) => inventory[c.id] !== false);

  const openConfirm = (car: CarListing) => {
    setConfirmCar(car);
    setCustomPrice(car.price.toString());
    setBuyChance(100);
  };

  const calculateChance = (askingPrice: number, listedPrice: number) => {
    if (askingPrice >= listedPrice) return 100;
    const ratio = askingPrice / listedPrice;
    // Below 50% of listed price, chance drops to near 0
    // Between 50%-100%, scales linearly
    if (ratio < 0.3) return 2;
    if (ratio < 0.5) return Math.round(5 + (ratio - 0.3) * 75);
    if (ratio < 0.8) return Math.round(20 + (ratio - 0.5) * 200);
    return Math.round(80 + (ratio - 0.8) * 100);
  };

  const handlePriceChange = (val: string) => {
    setCustomPrice(val);
    if (confirmCar) {
      const price = parseFloat(val) || 0;
      setBuyChance(calculateChance(price, confirmCar.price));
    }
  };

  const confirmPurchase = async () => {
    if (!confirmCar) return;
    const price = parseFloat(customPrice) || 0;
    if (price <= 0) return showMsg('error', 'Enter a valid price');
    if (price > (wallet.balance ?? 0)) return showMsg('error', 'Insufficient funds');

    const chance = calculateChance(price, confirmCar.price);
    const roll = Math.random() * 100;

    setPurchasing(true);

    // Simulate negotiation delay
    await new Promise((r) => setTimeout(r, 1200));

    if (roll > chance) {
      setPurchasing(false);
      showMsg('error', `The seller rejected your offer of ${formatMoney(price)}. They won't go below ${formatMoney(confirmCar.price * 0.7)}. Try a higher offer.`);
      return;
    }

    const ok = await wallet.spend(price);
    if (!ok) {
      setPurchasing(false);
      return showMsg('error', 'Purchase failed — insufficient funds');
    }

    await supabase.from('owned_cars').insert({
      make: confirmCar.make,
      model: confirmCar.model,
      year: confirmCar.year,
      color: confirmCar.color,
      purchase_price: price,
      image_url: confirmCar.image_url,
      source: mode,
    });

    // Mark as out of stock
    const existing = inventory[confirmCar.id];
    if (existing !== undefined) {
      await supabase.from('market_inventory').update({ in_stock: false, sold_at: new Date().toISOString() }).eq('listing_id', confirmCar.id);
    } else {
      await supabase.from('market_inventory').insert({ listing_id: confirmCar.id, in_stock: false, sold_at: new Date().toISOString() });
    }

    // Schedule restock after 30-60 seconds (restock a random car if stock is low)
    const inStockCount = Object.values(inventory).filter(Boolean).length;
    if (inStockCount <= 3) {
      setTimeout(async () => {
        const soldCars = allCars.filter((c) => inventory[c.id] === false);
        if (soldCars.length > 0) {
          const restock = soldCars[Math.floor(Math.random() * soldCars.length)];
          await supabase.from('market_inventory').update({ in_stock: true, sold_at: null }).eq('listing_id', restock.id);
          loadInventory();
        }
      }, 30000 + Math.random() * 30000);
    }

    await loadInventory();
    setPurchasing(false);
    showMsg('success', `Deal accepted! Purchased ${confirmCar.make} ${confirmCar.model} for ${formatMoney(price)}`);
    setConfirmCar(null);
  };

  const isBlack = mode === 'blackmarket';

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex-1 flex items-center gap-2 mx-2 bg-zinc-800 rounded-lg px-3 py-1.5">
            <Globe className={`w-3.5 h-3.5 ${isBlack ? 'text-red-500' : 'text-zinc-500'}`} />
            <span className="text-xs text-zinc-400 truncate">
              {isBlack ? 'darkmarket.onion / vehicles' : 'autotrade.com / marketplace'}
            </span>
            {isBlack && <Lock className="w-3.5 h-3.5 text-red-500 ml-auto" />}
          </div>
        </div>

        <div className="p-4">
          {isBlack && (
            <div className="flex items-start gap-3 mb-4 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">
                You are browsing the black market. Vehicles sold here have no registration, no VIN, and no warranty.
                Transactions are final and untraceable. Buyer assumes all risk.
              </p>
            </div>
          )}

          {!isBlack && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500">
                {availableCars.length} of {allCars.length} cars in stock. New inventory arrives periodically.
              </p>
            </div>
          )}

          {purchaseMsg && (
            <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
              purchaseMsg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-red-900/40 text-red-400 border border-red-800/50'
            }`}>
              {purchaseMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {purchaseMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCars.map((car) => {
              const inStock = inventory[car.id] !== false;
              return (
                <div key={car.id}
                  className={`rounded-xl border overflow-hidden bg-zinc-800/40 transition-all ${
                    isBlack ? 'border-red-900/30' : 'border-zinc-800'
                  } ${inStock ? 'hover:scale-[1.02] hover:border-zinc-600' : 'opacity-40'}`}>
                  <div className="relative h-40 overflow-hidden bg-zinc-800">
                    <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                    {isBlack && inStock && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-950/80 text-red-400 text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" /> No VIN
                      </div>
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-zinc-400 text-sm font-medium">SOLD</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">{car.make} {car.model}</h3>
                        <span className="text-xs text-zinc-500">{car.year} &middot; {car.color}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2 min-h-[2rem]">{car.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold tabular-nums ${isBlack ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatMoney(car.price)}
                      </span>
                      <button
                        onClick={() => inStock && openConfirm(car)}
                        disabled={!inStock}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          !inStock ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' :
                          isBlack ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}>
                        {inStock ? <><ShoppingCart className="w-3.5 h-3.5" /> Buy</> : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {confirmCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !purchasing && setConfirmCar(null)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-zinc-100">Negotiate Purchase</h3>
              {!purchasing && <button onClick={() => setConfirmCar(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>}
            </div>
            <p className="text-sm text-zinc-400 mb-4">{confirmCar.make} {confirmCar.model} ({confirmCar.year})</p>
            <img src={confirmCar.image_url} alt={confirmCar.model} className="w-full h-40 object-cover rounded-lg mb-4" />
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1 block">Your Offer (negotiate the price)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                <input type="number" min="0" value={customPrice} onChange={(e) => handlePriceChange(e.target.value)} disabled={purchasing}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600 disabled:opacity-50" />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>Listed: {formatMoney(confirmCar.price)}</span>
                <span>Suggested min: {formatMoney(confirmCar.price * 0.7)}</span>
              </div>
            </div>

            {/* Chance meter */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Seller Acceptance Chance</span>
                <span className={`font-medium ${buyChance >= 70 ? 'text-emerald-400' : buyChance >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{buyChance}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all rounded-full ${buyChance >= 70 ? 'bg-emerald-500' : buyChance >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${buyChance}%` }} />
              </div>
              {buyChance < 30 && <p className="text-xs text-red-400 mt-1">The seller is very unlikely to accept this offer.</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmCar(null)} disabled={purchasing}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmPurchase} disabled={purchasing}
                className={`flex-1 py-2 ${isBlack ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-500'} text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}>
                {purchasing ? <><Loader2 className="w-4 h-4 animate-spin" /> Negotiating...</> : `Offer ${formatMoney(parseFloat(customPrice) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
