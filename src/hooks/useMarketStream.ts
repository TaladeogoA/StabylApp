import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { getDb } from '../db/schema';
import { streamEngine } from '../engine/stream';
import { StreamEvent } from '../types';

export const useMarketStream = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const isPlayingRef = useRef(false);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    const init = async () => {
        await streamEngine.load();
        dbRef.current = await getDb();
        setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!isReady || !isPlaying) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = async () => {
        if (!isPlayingRef.current || !dbRef.current) return;

        const events = streamEngine.nextBatch(20);

        if (events.length === 0) {
            setIsPlaying(false);
            return;
        }

        try {
           await processEvents(dbRef.current, events);
           setProgress(streamEngine.progress);
        } catch (e) {
            setIsPlaying(false);
        }

        timeoutId = setTimeout(tick, 50);
    };

    tick();

    return () => clearTimeout(timeoutId);
  }, [isReady, isPlaying]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const reset = () => {
      setIsPlaying(false);
      streamEngine.reset();
      setProgress(0);
  };

  return {
      isReady,
      isPlaying,
      progress,
      togglePlay,
      reset
  };
};

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
