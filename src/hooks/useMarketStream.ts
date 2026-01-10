import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { getDb } from '../db/schema';
import { streamEngine } from '../engine/stream';
import { StreamEvent } from '../types';

// Global state
let globalIsPlaying = false;
let globalIsReady = false;
const listeners = new Set<() => void>();

const notifyListeners = () => {
    listeners.forEach(l => l());
};

export const useMarketStream = () => {
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [isReady, setIsReady] = useState(globalIsReady);
  const [progress, setProgress] = useState(streamEngine.progress);

  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  // Subscribe to global state changes
  useEffect(() => {
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

  // Initialization (only runs once globally in theory, but safe to run multiple times if protected)
  useEffect(() => {
    const init = async () => {
        if (globalIsReady) return; // Already ready
        await streamEngine.load();
        dbRef.current = await getDb();
        globalIsReady = true;
        notifyListeners();
    };
    init();
  }, []);

  // The Tick Loop - Should only run ONCE globally?
  // Current design: if useMarketStream is used in multiple places, we might have multiple loops?
  // Ideally, the loop should be outside the hook or regulated.
  // We can use a ref to track if *this* hook instance is the "runner", OR just make the loop global too.

  // Actually, simplest fix for now: Move the loop logic to a global "Service" or ensure only one loop runs.
  // Let's implement a singleton loop manager here.

  // See below for singleton loop implementation.
  useEffect(() => {
     if (isReady && isPlaying) {
         startLoop();
     } else {
         stopLoop();
     }
  }, [isReady, isPlaying]);

  const togglePlay = () => {
      globalIsPlaying = !globalIsPlaying;
      notifyListeners();
  };

  const reset = () => {
      stopLoop();
      globalIsPlaying = false;
      streamEngine.reset();
      notifyListeners();
  };

  return {
      isReady,
      isPlaying,
      progress,
      togglePlay,
      reset
  };
};

// Global Loop Manager
let loopTimeout: ReturnType<typeof setTimeout> | null = null;
let isLoopRunning = false;

async function startLoop() {
    if (isLoopRunning) {
        return;
    }

    isLoopRunning = true;

    let db;
    try {
        db = await getDb();
    } catch(e) {
        // console.error('[Hook] Failed to get DB in loop:', e);
        isLoopRunning = false;
        return;
    }

    if (!globalIsPlaying) {
        isLoopRunning = false;
        return;
    }

    const tick = async () => {
        // console.log('[Hook] Tick...');
        if (!globalIsPlaying) {
            isLoopRunning = false;
            return;
        }

        const events = streamEngine.nextBatch(20);

        if (events.length === 0) {
            globalIsPlaying = false;
            isLoopRunning = false;
            notifyListeners();
            return;
        }

        try {
            // console.log(`[Hook] Processing batch of ${events.length}...`);
            await processEvents(db, events);
            notifyListeners();
        } catch (e) {
            // console.error('[Hook] Error processing events:', e);
            globalIsPlaying = false;
            isLoopRunning = false;
            notifyListeners();
            return;
        }

        loopTimeout = setTimeout(tick, 50); // Revert to 50ms for normal speed
    };

    tick();
}

function stopLoop() {
    if (loopTimeout) clearTimeout(loopTimeout);
    isLoopRunning = false;
    // We don't change globalIsPlaying here, that's the user's intent.
}

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
