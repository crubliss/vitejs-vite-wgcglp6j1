export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number;
}

export const STOCKS: StockInfo[] = [
  { symbol: 'AAPL', name: 'Apex Tech', sector: 'Technology', basePrice: 182.5, volatility: 0.02 },
  { symbol: 'NVDA', name: 'Nova Graphics', sector: 'Technology', basePrice: 487.3, volatility: 0.035 },
  { symbol: 'TSLA', name: 'Volt Motors', sector: 'Automotive', basePrice: 248.9, volatility: 0.045 },
  { symbol: 'AMZN', name: 'ShopSphere', sector: 'E-Commerce', basePrice: 156.2, volatility: 0.025 },
  { symbol: 'MSFT', name: 'MicroCore', sector: 'Technology', basePrice: 412.7, volatility: 0.02 },
  { symbol: 'GME', name: 'PlayStop', sector: 'Retail', basePrice: 17.8, volatility: 0.08 },
  { symbol: 'BTC', name: 'BitGold', sector: 'Crypto', basePrice: 63200, volatility: 0.06 },
  { symbol: 'ETH', name: 'EtherLink', sector: 'Crypto', basePrice: 3450, volatility: 0.055 },
  { symbol: 'XOM', name: 'PetroMax', sector: 'Energy', basePrice: 108.4, volatility: 0.03 },
  { symbol: 'JPM', name: 'Grand Bank', sector: 'Finance', basePrice: 198.1, volatility: 0.025 },
  { symbol: 'META', name: 'SocialVerse', sector: 'Technology', basePrice: 502.6, volatility: 0.03 },
  { symbol: 'DOGE', name: 'DogeCoin', sector: 'Crypto', basePrice: 0.16, volatility: 0.1 },
];

export interface PriceTick {
  time: number;
  price: number;
}

export interface LiveStock {
  info: StockInfo;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  history: PriceTick[];
}

const MAX_HISTORY = 120;

export function createLiveStocks(): LiveStock[] {
  return STOCKS.map((info) => {
    const price = info.basePrice;
    return {
      info,
      price,
      prevClose: price,
      change: 0,
      changePct: 0,
      history: Array.from({ length: 30 }, (_, i) => ({
        time: Date.now() - (30 - i) * 2000,
        price,
      })),
    };
  });
}

export function tickStock(stock: LiveStock): LiveStock {
  const drift = (Math.random() - 0.5) * 2 * stock.info.volatility;
  const newPrice = Math.max(0.01, stock.price * (1 + drift));
  const newHistory = [...stock.history, { time: Date.now(), price: newPrice }];
  if (newHistory.length > MAX_HISTORY) newHistory.shift();

  return {
    ...stock,
    price: newPrice,
    change: newPrice - stock.prevClose,
    changePct: ((newPrice - stock.prevClose) / stock.prevClose) * 100,
    history: newHistory,
  };
}
