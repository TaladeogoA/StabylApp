import * as SQLite from 'expo-sqlite';
import { WalletRow } from '../types';

/**
 * Get the latest timestamp from the trades table to serve as "now".
 * This ensures we are synced with the replay stream, not wall-clock time.
 */
export const getCurrentTimestamp = async (db: SQLite.SQLiteDatabase): Promise<number> => {
    const result = await db.getFirstAsync<{ max_ts: number }>('SELECT MAX(timestamp) as max_ts FROM trades');
    return result?.max_ts || Date.now(); // Fallback to Date.now() if no trades, though unlikely in this app
};

/**
 * Get the price of an asset in USDT at a specific timestamp.
 * - USDT/USDC are hard-pegged to 1.0
 * - NGN is derived from USDT-NGN (1 / price)
 * - Others are direct lookups (e.g. BTC-USDT)
 */
export const getPriceAtTime = async (db: SQLite.SQLiteDatabase, asset: string, timestamp: number): Promise<number> => {
    // 1. Hard Pegs
    if (asset === 'USDT' || asset === 'USDC') {
        return 1.0;
    }

    // 2. NGN (Base is USDT, Quote is NGN in 'USDT-NGN' market usually? Wait, checking seed.)
    // In seed: Market is USDT-NGN. Base=USDT, Quote=NGN. Price is NGN per USDT.
    // So 1 NGN = 1 / price.
    if (asset === 'NGN') {
        const trade = await db.getFirstAsync<{ price: number }>(
            'SELECT price FROM trades WHERE market_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1',
            ['USDT-NGN', timestamp]
        );
        if (trade && trade.price > 0) {
            return 1.0 / trade.price;
        }
        return 0; // Fallback if no history
    }

    // 3. Crypto Assets (e.g. BTC). Market is BTC-USDT.
    // Price is USDT per BTC.
    const marketId = `${asset}-USDT`;
    const trade = await db.getFirstAsync<{ price: number }>(
        'SELECT price FROM trades WHERE market_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1',
        [marketId, timestamp]
    );

    return trade?.price || 0;
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
