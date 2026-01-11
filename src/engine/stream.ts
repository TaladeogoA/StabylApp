import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { getDb } from '../db/schema';
import { clearDatabase, seedDatabase } from '../db/seed';
import { StreamEvent } from '../types';

async function* readNdjsonLines(uri: string) {
  const file = new FileSystem.File(uri);
  if (!file.exists) throw new Error("NDJSON file not found");

  const stream = file.readableStream();
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  try {
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line.length > 0) yield line;
          }
      }
  } finally {
      reader.releaseLock();
  }

  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
      yield buffer.trim();
  }
}

type StreamState = 'playing' | 'paused' | 'finished';
type Listener = () => void;

export class MarketStream {
    private generator: AsyncGenerator<string, void, unknown> | null = null;
    private status: StreamState = 'paused';
    private pointer: number = 0;

    private listeners = new Set<Listener>();

    async play(speed: number = 1) {
        if (this.status === 'playing') return;

        this.status = 'playing';
        this.notify();

        const db = await getDb();
        const baseDelay = 50;

        if (!this.generator) {

             await this.load();
        }

        while (this.status === 'playing') {
            const start = Date.now();

            try {
                if (!this.generator) break;

                const { value, done } = await this.generator.next();

                if (done) {

                    this.status = 'finished';
                    this.notify();
                    break;
                }

                if (value) {
                    const event = JSON.parse(value) as StreamEvent;
                    await this.processEvent(db, event);
                    this.pointer++;
                    if (this.pointer % 50 === 0) {}
                }

            } catch (e) {
                console.error("[Stream] Stream Error", e);
                this.status = 'paused';
                this.notify();
                break;
            }

            const elapsed = Date.now() - start;
            const targetDelay = baseDelay / speed;
            const waitTime = Math.max(0, targetDelay - elapsed);

            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    pause() {

        this.status = 'paused';
        this.notify();
    }

    async reset() {

        this.status = 'paused';
        this.pointer = 0;
        this.generator = null;

        const db = await getDb();
        await clearDatabase(db);
        await seedDatabase(db, true);

        await this.load();


        this.notify();
    }

    async load() {
        if (this.generator) return;

        try {
            const asset = Asset.fromModule(require('../../assets/data/stream/market_stream.ndjson'));
            await asset.downloadAsync();
            if (!asset.localUri) throw new Error('Failed to load stream asset URI');


            this.generator = readNdjsonLines(asset.localUri);
            this.notify(); // Notify listeners that we are loaded
        } catch (e) {
            console.error('[Stream] Failed to load stream:', e);
        }
    }

    get isReady() {
        return !!this.generator;
    }

    get isPlaying() {
        return this.status === 'playing';
    }

    get state() {
        return this.status;
    }

    get eventCount() {
        return this.pointer;
    }

    get progress() {
         return 0; // TODO: Implement progress
    }

    addListener(l: Listener) {
        this.listeners.add(l);
        return () => this.listeners.delete(l);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    private async processEvent(db: SQLite.SQLiteDatabase, e: StreamEvent) {
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
    }
}

export const streamEngine = new MarketStream();
