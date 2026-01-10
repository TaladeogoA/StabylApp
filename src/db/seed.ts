import * as SQLite from 'expo-sqlite';

import assetsDataRaw from '../../assets/data/seed/assets.json';
import balancesDataRaw from '../../assets/data/seed/balances.json';
import marketsDataRaw from '../../assets/data/seed/markets.json';

import obUsdcNgnRaw from '../../assets/data/seed/orderbooks/USDC-NGN.json';
import obUsdtNgnRaw from '../../assets/data/seed/orderbooks/USDT-NGN.json';

import tradesUsdcNgnRaw from '../../assets/data/seed/trades/USDC-NGN.json';
import tradesUsdtNgnRaw from '../../assets/data/seed/trades/USDT-NGN.json';

import {
    AssetData,
    BalanceData,
    MarketData,
    OrderBookData,
    TradeData,
} from '../types';

const marketsSeed = marketsDataRaw as MarketData[];
const assetsSeed = assetsDataRaw as AssetData[];
const balancesSeed = balancesDataRaw as BalanceData[];

const orderBooksSeed: OrderBookData[] = [
  obUsdtNgnRaw as OrderBookData,
  obUsdcNgnRaw as OrderBookData,
];

const tradesSeed: TradeData[] = [
  ...tradesUsdtNgnRaw,
  ...tradesUsdcNgnRaw,
];


export const seedDatabase = async (db: SQLite.SQLiteDatabase) => {
  const marketsCount = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM markets');
  if (marketsCount && marketsCount.count > 0) {
    console.log('DB already seeded');
    return;
  }

  await db.withTransactionAsync(async () => {
      for (const m of marketsSeed) {
          await db.runAsync(
              `INSERT INTO markets (id, ticker, baseAsset, quoteAsset, tickSize, minOrderSize, initialLastPrice, initialChange24h) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [m.marketId, `${m.base}-${m.quote}`, m.base, m.quote, m.tickSize, m.minOrderSize, m.initialLastPrice, m.initialChange24h]
          );
      }

      for (const a of assetsSeed) {
          await db.runAsync(
              `INSERT INTO assets (symbol, decimals) VALUES (?, ?)`,
              [a.assetId, a.decimals]
          );
      }

      for (const b of balancesSeed) {
          await db.runAsync(
              `INSERT INTO balances (asset, available, locked) VALUES (?, ?, ?)`,
              [b.asset, b.available, b.locked]
          );
      }

      for (const ob of orderBooksSeed) {
          for (const [price, size] of ob.asks) {
              await db.runAsync('INSERT INTO order_book (market_id, side, price, size) VALUES (?, ?, ?, ?)', [ob.market, 'ask', price, size]);
          }
          for (const [price, size] of ob.bids) {
              await db.runAsync('INSERT INTO order_book (market_id, side, price, size) VALUES (?, ?, ?, ?)', [ob.market, 'bid', price, size]);
          }
      }

      for (const t of tradesSeed) {
           await db.runAsync(
               'INSERT INTO trades (id, market_id, price, size, side, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
               [t.tradeId || `seed_${t.market}_${t.id}`, t.market || 'UNKNOWN', t.price, t.size, t.side, t.ts]
           );
      }
  });

  console.log('DB Seed Complete.');
};
