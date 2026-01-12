import * as SQLite from 'expo-sqlite';
import { processStreamEvent } from '../engine/orderBookOps';
import { createTestDb } from './testDbUtils';

describe('OrderBookOps Integration', () => {
    let db: SQLite.SQLiteDatabase;
    const TEST_MARKET = 'TEST-USD';

    beforeEach(() => {
        db = createTestDb();
    });

    afterEach(() => {
        // @ts-ignore
        if (db.close) db.close();
    });

    it('Test 1: Inserts new price level', async () => {
        const event = {
            type: 'ob_delta' as const,
            market: TEST_MARKET,
            side: 'bid' as const,
            price: 100,
            size: 5,
            ts: 1000,
            seq: 1
        };

        await processStreamEvent(db, event);

        const row = await db.getFirstAsync<{ size: number }>('SELECT size FROM order_book WHERE market_id = ? AND side = ? AND price = ?', [TEST_MARKET, 'bid', 100]);
        expect(row?.size).toBe(5);
    });

    it('Test 2: Updates existing price level (Upsert)', async () => {
        await processStreamEvent(db, {
            type: 'ob_delta' as const,
            market: TEST_MARKET,
            side: 'bid' as const,
            price: 100,
            size: 5,
            ts: 1000,
            seq: 1
        });

        await processStreamEvent(db, {
            type: 'ob_delta' as const,
            market: TEST_MARKET,
            side: 'bid' as const,
            price: 100,
            size: 12,
            ts: 1001,
            seq: 2
        });

        const row = await db.getFirstAsync<{ size: number }>('SELECT size FROM order_book WHERE market_id = ? AND side = ? AND price = ?', [TEST_MARKET, 'bid', 100]);
        expect(row?.size).toBe(12);

        const all = await db.getAllAsync('SELECT * FROM order_book WHERE market_id = ?', [TEST_MARKET]);
        expect(all.length).toBe(1);
    });

    it('Test 3: Removes price level (size=0)', async () => {
        await processStreamEvent(db, { type: 'ob_delta', market: TEST_MARKET, side: 'ask', price: 101, size: 7, ts: 1000, seq: 1 });

        await processStreamEvent(db, {
            type: 'ob_delta' as const,
            market: TEST_MARKET,
            side: 'ask',
            price: 101,
            size: 0,
            ts: 1002,
            seq: 3
        });

        const row = await db.getFirstAsync('SELECT * FROM order_book WHERE market_id = ? AND side = ? AND price = ?', [TEST_MARKET, 'ask', 101]);
        expect(row).toBeNull();
    });

    it('Test 4: Maintains Sorting (Query Verification)', async () => {
        await processStreamEvent(db, { type: 'ob_delta', market: TEST_MARKET, side: 'bid', price: 100, size: 1, ts: 1, seq: 1 });
        await processStreamEvent(db, { type: 'ob_delta', market: TEST_MARKET, side: 'bid', price: 102, size: 1, ts: 1, seq: 1 });
        await processStreamEvent(db, { type: 'ob_delta', market: TEST_MARKET, side: 'bid', price: 101, size: 1, ts: 1, seq: 1 });
        const rows = await db.getAllAsync<{ price: number }>('SELECT price FROM order_book WHERE market_id = ? AND side = ? ORDER BY price DESC', [TEST_MARKET, 'bid']);
        const prices = rows.map(r => r.price);

        expect(prices).toEqual([102, 101, 100]);
    });

    it('Test 5: Trade Deduplication (INSERT OR IGNORE)', async () => {
        const tradeEvent = {
             type: 'trade' as const,
             market: TEST_MARKET,
             tradeId: 'T1',
             price: 500,
             size: 1,
             side: 'buy' as const,
             ts: 2000,
             seq: 10
        };

        await processStreamEvent(db, tradeEvent);
        await processStreamEvent(db, tradeEvent);

        const trades = await db.getAllAsync('SELECT * FROM trades WHERE id = ?', ['T1']);
        expect(trades.length).toBe(1);
    });
});
