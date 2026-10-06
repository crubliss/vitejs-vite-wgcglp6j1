import { useEffect, useState, useCallback } from 'react';
import { Car, Tag, Trash2, DollarSign, Mail, Check, X, Clock } from 'lucide-react';
import { supabase, OwnedCar, CarOffer } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';

const BUYER_NAMES = [
  'Marcus T.', 'Sofia L.', 'Dmitri V.', 'Aisha K.', 'Robert H.',
  'Yuki S.', 'Pablo R.', 'Ingrid M.', 'Hassan A.', 'Catherine W.',
  'Tony B.', 'Elena D.', 'Kofi O.', 'Mei Lin', 'Jorge F.',
];

export function Garage() {
  const wallet = useWallet();
  const [cars, setCars] = useState<OwnedCar[]>([]);
  const [offers, setOffers] = useState<CarOffer[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    const [carsRes, offersRes] = await Promise.all([
      supabase.from('owned_cars').select('*').order('created_at', { ascending: false }),
      supabase.from('car_offers').select('*').eq('accepted', false).order('created_at', { ascending: false }),
    ]);
    setCars((carsRes.data ?? []) as OwnedCar[]);
    setOffers((offersRes.data ?? []) as CarOffer[]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodically check for new offers on listed cars
  useEffect(() => {
    const interval = window.setInterval(async () => {
      const listedCars = cars.filter((c) => c.listed_price && c.listed_price > 0);
      if (listedCars.length === 0) return;

      for (const car of listedCars) {
        // Each listed car has a chance to receive an offer every interval
        const existingOffers = offers.filter((o) => o.car_id === car.id);
        if (existingOffers.length >= 3) continue; // Max 3 pending offers per car

        // Sell chance based on list price vs purchase price
        const ratio = car.listed_price! / car.purchase_price;
        let offerChance = 0;
        if (ratio <= 0.8) offerChance = 0.7;
        else if (ratio <= 1.0) offerChance = 0.5;
        else if (ratio <= 1.3) offerChance = 0.3;
        else if (ratio <= 1.8) offerChance = 0.15;
        else if (ratio <= 3) offerChance = 0.05;
        else offerChance = 0.01;

        if (Math.random() < offerChance) {
          // Generate offer amount — lower than list price, based on fairness
          const offerRatio = ratio <= 1.0 ? 0.85 + Math.random() * 0.15 : 0.6 + Math.random() * 0.3;
          const offerAmount = Math.round(car.listed_price! * offerRatio);
          const buyerName = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];

          await supabase.from('car_offers').insert({
            car_id: car.id,
            offer_amount: offerAmount,
            buyer_name: buyerName,
            accepted: false,
          });
        }
      }

      loadData();
    }, 8000);

    return () => clearInterval(interval);
  }, [cars, offers, loadData]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const listForSale = async (car: OwnedCar) => {
    const price = parseFloat(listPrice);
    if (!price || price <= 0) return showMsg('error', 'Enter a valid price');

    await supabase.from('owned_cars').update({ listed_price: price }).eq('id', car.id);
    setListingId(null);
    setListPrice('');
    await loadData();
    showMsg('success', `${car.make} ${car.model} listed for ${formatMoney(price)}. Buyers will send offers.`);
  };

  const unlist = async (car: OwnedCar) => {
    await supabase.from('owned_cars').update({ listed_price: null }).eq('id', car.id);
    // Delete pending offers
    await supabase.from('car_offers').delete().eq('car_id', car.id).eq('accepted', false);
    await loadData();
    showMsg('success', `${car.make} ${car.model} removed from listings`);
  };

  const acceptOffer = async (offer: CarOffer) => {
    const car = cars.find((c) => c.id === offer.car_id);
    if (!car) return;

    await wallet.addFunds(offer.offer_amount);
    await supabase.from('car_offers').update({ accepted: true }).eq('id', offer.id);
    await supabase.from('owned_cars').delete().eq('id', car.id);
    // Delete other pending offers for this car
    await supabase.from('car_offers').delete().eq('car_id', car.id).eq('accepted', false);
    await loadData();
    showMsg('success', `Sold ${car.make} ${car.model} to ${offer.buyer_name} for ${formatMoney(offer.offer_amount)}`);
  };

  const declineOffer = async (offer: CarOffer) => {
    await supabase.from('car_offers').delete().eq('id', offer.id);
    await loadData();
  };

  const scrapCar = async (car: OwnedCar) => {
    const scrapValue = Math.round(car.purchase_price * 0.15);
    await wallet.addFunds(scrapValue);
    await supabase.from('owned_cars').delete().eq('id', car.id);
    await supabase.from('car_offers').delete().eq('car_id', car.id);
    await loadData();
    showMsg('success', `Scrapped ${car.make} ${car.model} for ${formatMoney(scrapValue)}`);
  };

  const totalValue = cars.reduce((sum, c) => sum + c.purchase_price, 0);
  const carOffersMap = offers.reduce<Record<string, CarOffer[]>>((acc, o) => {
    (acc[o.car_id] ??= []).push(o);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">My Garage</h2>
          <p className="text-zinc-500 text-sm">{cars.length} cars &middot; Collection value: {formatMoney(totalValue)}</p>
        </div>
        {offers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/40 border border-amber-800/50 rounded-lg text-sm text-amber-400">
            <Mail className="w-4 h-4" /> {offers.length} offer{offers.length !== 1 ? 's' : ''} pending
          </div>
        )}
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <Car className="w-16 h-16 mb-4" />
          <p className="text-lg">Your garage is empty.</p>
          <p className="text-sm">Head to the marketplace to buy some cars.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car) => {
            const carOffers = carOffersMap[car.id] ?? [];
            return (
              <div key={car.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="relative h-40 bg-zinc-800">
                  <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                  {car.source === 'blackmarket' && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-950/80 text-red-400 text-xs font-medium">Black Market</div>
                  )}
                  {car.listed_price && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-amber-950/80 text-amber-400 text-xs font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Listed {formatMoney(car.listed_price)}
                    </div>
                  )}
                  {carOffers.length > 0 && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-blue-950/80 text-blue-400 text-xs font-medium flex items-center gap-1 animate-pulse">
                      <Mail className="w-3 h-3" /> {carOffers.length} offer{carOffers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-zinc-100">{car.make} {car.model}</h3>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                    <span>{car.year} &middot; {car.color}</span>
                    <span className="text-zinc-400">Paid: {formatMoney(car.purchase_price)}</span>
                  </div>

                  {/* Offers */}
                  {carOffers.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {carOffers.map((offer) => (
                        <div key={offer.id} className="bg-zinc-800/60 rounded-lg p-2 border border-zinc-700/50">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-zinc-300 font-medium">{offer.buyer_name}</span>
                            <span className="text-emerald-400 font-semibold tabular-nums">{formatMoney(offer.offer_amount)}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => acceptOffer(offer)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => declineOffer(offer)}
                              className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded text-xs transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {listingId === car.id ? (
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                        <input type="number" min="0" value={listPrice} onChange={(e) => setListPrice(e.target.value)}
                          placeholder="Sale price" className="w-full bg-zinc-800 border border-zinc-700 rounded pl-5 pr-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-600" />
                      </div>
                      <button onClick={() => listForSale(car)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium">List</button>
                      <button onClick={() => setListingId(null)} className="px-2 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs">Cancel</button>
                    </div>
                  ) : car.listed_price ? (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800/60 text-zinc-400 rounded-lg text-xs">
                        <Clock className="w-3.5 h-3.5" /> Waiting for offers...
                      </div>
                      <button onClick={() => unlist(car)} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs transition-colors">Unlist</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setListingId(car.id); setListPrice(Math.round(car.purchase_price * 0.9).toString()); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors">
                        <Tag className="w-3.5 h-3.5" /> List for Sale
                      </button>
                      <button onClick={() => scrapCar(car)} className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs transition-colors" title="Scrap for 15% of purchase price">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {car.listed_price && carOffers.length === 0 && (
                    <p className="text-xs text-zinc-600 mt-2 text-center">Buyers will send offers over time. Higher prices = fewer offers.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
