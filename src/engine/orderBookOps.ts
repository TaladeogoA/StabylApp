import * as SQLite from 'expo-sqlite';
import { StreamEvent } from '../types';

export const processStreamEvent = async (db: SQLite.SQLiteDatabase, e: StreamEvent) => {
    if (e.type === 'trade') {
        if (e.price !== undefined && e.size !== undefined && e.side !== undefined) {
            await db.runAsync(
                'INSERT OR IGNORE INTO trades (id, market_id, price, size, side, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                [e.tradeId || `stream_${e.seq}`, e.market, e.price, e.size, e.side, e.ts]
            );
        }
    }
    else if (e.type === 'ob_delta') {
        if (e.price !== undefined && e.size !== undefined && e.side !== undefined) {
            if (e.size === 0) {
                await db.runAsync(
                    'DELETE FROM order_book WHERE market_id = ? AND side = ? AND price = ?',
                    [e.market, e.side, e.price]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO order_book (market_id, side, price, size) VALUES (?, ?, ?, ?) ON CONFLICT(market_id, side, price) DO UPDATE SET size = excluded.size',
                    [e.market, e.side, e.price, e.size]
                );
            }
        }
    }
};
