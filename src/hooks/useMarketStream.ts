import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { getDb } from '../db/schema';
import { streamEngine } from '../engine/stream';
import { StreamEvent } from '../types';

// --- Global Service State ---
let globalIsPlaying = false;
let globalIsReady = false;
const listeners = new Set<() => void>();
let loopTimeout: ReturnType<typeof setTimeout> | null = null;
let isLoopRunning = false;

// --- Service Logic ---

const notifyListeners = () => {
    listeners.forEach(l => l());
};

const stopLoop = () => {
    if (loopTimeout) clearTimeout(loopTimeout);
    isLoopRunning = false;
};

const startLoop = async () => {
    if (isLoopRunning) return;
    if (!globalIsReady) return;
    if (!globalIsPlaying) return;

    isLoopRunning = true;

    let db: SQLite.SQLiteDatabase;
    try {
        db = await getDb();
    } catch(e) {
        isLoopRunning = false;
        return;
    }

    const tick = async () => {
        if (!globalIsPlaying) {
            isLoopRunning = false;
            return;
        }

        const events = streamEngine.nextBatch(20);

        if (events.length === 0) {
            // Should not happen with infinite loop fix, but safe fallback
            globalIsPlaying = false;
            isLoopRunning = false;
            notifyListeners();
            return;
        }

        try {
            await processEvents(db, events);
            notifyListeners();
        } catch (e) {
            console.error(e);
            globalIsPlaying = false;
            isLoopRunning = false;
            notifyListeners();
            return;
        }

        loopTimeout = setTimeout(tick, 50);
    };

    tick();
};

const togglePlayGlobal = () => {
    globalIsPlaying = !globalIsPlaying;
    if (globalIsPlaying) {
        startLoop();
    } else {
        stopLoop();
    }
    notifyListeners();
};

const resetGlobal = () => {
    stopLoop();
    globalIsPlaying = false;
    streamEngine.reset();
    notifyListeners();
};

const initGlobal = async () => {
    if (globalIsReady) return;
    await streamEngine.load();
    await getDb();
    globalIsReady = true;
    notifyListeners();
};

// --- React Hook ---

export const useMarketStream = () => {
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [isReady, setIsReady] = useState(globalIsReady);
  const [progress, setProgress] = useState(streamEngine.progress);

  // Subscribe to global state
  useEffect(() => {
      // Sync immediately on mount
      setIsPlaying(globalIsPlaying);
      setIsReady(globalIsReady);

      const listener = () => {
          setIsPlaying(globalIsPlaying);
          setIsReady(globalIsReady);
          setProgress(streamEngine.progress);
      };
      listeners.add(listener);
      return () => {
          listeners.delete(listener);
      };
  }, []);

  // Trigger init once
  useEffect(() => {
      initGlobal();
  }, []);

  return {
      isReady,
      isPlaying,
      progress,
      togglePlay: togglePlayGlobal,
      reset: resetGlobal
  };
};

// --- DB Helper ---

async function processEvents(db: SQLite.SQLiteDatabase, events: StreamEvent[]) {
    await db.withTransactionAsync(async () => {
        for (const e of events) {
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
    });
}
