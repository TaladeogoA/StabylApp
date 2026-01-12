import * as SQLite from 'expo-sqlite';
import { MarketRow } from '../types';

export const fetchMarketSummaries = async (db: SQLite.SQLiteDatabase): Promise<MarketRow[]> => {
    const rows = await db.getAllAsync<MarketRow>(`
        SELECT m.id, m.ticker, m.is_favorite, m.initialLastPrice, m.initialChange24h,
        (SELECT price FROM trades WHERE market_id = m.id ORDER BY timestamp DESC LIMIT 1) as lastPrice
        FROM markets m
    `);

    const marketStats = await Promise.all(rows.map(async (m) => {
        const lastTrade = await db.getFirstAsync<{ price: number, side: string, timestamp: number }>(
            'SELECT price, side, timestamp FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
            [m.id]
        );

        let price24h = m.initialLastPrice || 0;
        if (lastTrade) {
            const lookbackTime = lastTrade.timestamp - (24 * 60 * 60 * 1000);
            const trade24h = await db.getFirstAsync<{ price: number }>(
                'SELECT price FROM trades WHERE market_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1',
                [m.id, lookbackTime]
            );
            if (trade24h) {
                price24h = trade24h.price;
            }
        }

        // Get Spread
        const bestBidRow = await db.getFirstAsync<{ price: number }>('SELECT MAX(price) as price FROM order_book WHERE market_id = ? AND side = ?', [m.id, 'bid']);
        const bestAskRow = await db.getFirstAsync<{ price: number }>('SELECT MIN(price) as price FROM order_book WHERE market_id = ? AND side = ?', [m.id, 'ask']);

        const bestBid = bestBidRow?.price || 0;
        const bestAsk = bestAskRow?.price || 0;
        const spread = (bestAsk > 0 && bestBid > 0) ? (bestAsk - bestBid) : 0;
        const spreadPercent = (bestBid > 0) ? (spread / bestBid) * 100 : 0;

        // Calculate Change
        const currentPrice = lastTrade ? lastTrade.price : (m.initialLastPrice || 0);
        let change24h = m.initialChange24h || 0;

        if (price24h > 0 && lastTrade) {
            change24h = ((currentPrice - price24h) / price24h) * 100;
        }

        return {
            ...m,
            lastPrice: currentPrice,
            change24h: change24h,
            lastSide: lastTrade?.side || 'buy',
            spread,
            spreadPercent
        };
    }));

    return marketStats;
};
