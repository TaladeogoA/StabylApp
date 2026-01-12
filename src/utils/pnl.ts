import * as SQLite from 'expo-sqlite';
import { WalletRow } from '../types';

/**
 * Get the latest timestamp from the trades table to serve as "now".
 * This ensures we are synced with the replay stream, not wall-clock time.
 */
export const getCurrentTimestamp = async (
  db: SQLite.SQLiteDatabase
): Promise<number> => {
  const result = await db.getFirstAsync<{ max_ts: number }>(
    'SELECT MAX(timestamp) as max_ts FROM trades'
  );
  return result?.max_ts || Date.now();
};

/**
 * Get the price of an asset in USDT at a specific timestamp.
 * - USDT/USDC are hard-pegged to 1.0
 * - NGN is derived from USDT-NGN (1 / price)
 */
export const getPriceAtTime = async (
  db: SQLite.SQLiteDatabase,
  asset: string,
  timestamp: number
): Promise<number> => {
  if (asset === 'USDT' || asset === 'USDC') {
    return 1.0;
  }

  const fetchPrice = async (mId: string): Promise<number> => {
      const trade = await db.getFirstAsync<{ price: number }>(
        'SELECT price FROM trades WHERE market_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1',
        [mId, timestamp]
      );
      if (trade) return trade.price;

      const market = await db.getFirstAsync<{ initialLastPrice: number }>(
          'SELECT initialLastPrice FROM markets WHERE id = ?',
          [mId]
      );
      return market?.initialLastPrice || 0;
  };

  if (asset === 'NGN') {
    const price = await fetchPrice('USDT-NGN');
    return price > 0 ? (1.0 / price) : 0;
  }

  const marketId = `${asset}-USDT`;
  const price = await fetchPrice(marketId);
  return price;
};

/**
 * Calculate total portfolio value in USDT at a specific timestamp.
 */
export const calculatePortfolioValue = async (
  db: SQLite.SQLiteDatabase,
  balances: WalletRow[],
  timestamp: number
): Promise<number> => {
  let totalValue = 0;

  for (const balance of balances) {
    const totalAmount = balance.available + balance.locked;
    if (totalAmount === 0) continue;

    const price = await getPriceAtTime(db, balance.asset, timestamp);
    totalValue += totalAmount * price;
  }

  return totalValue;
};
