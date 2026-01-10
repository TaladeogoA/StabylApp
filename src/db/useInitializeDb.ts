import { useEffect, useState } from 'react';
import { getDb, MIGRATIONS } from './schema';
import { seedDatabase } from './seed';

export const useInitializeDb = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const db = await getDb();

        await db.execAsync('PRAGMA journal_mode = WAL;');

        for (const query of MIGRATIONS) {
             await db.execAsync(query);
        }

        await seedDatabase(db);

        setIsReady(true);
      } catch (e: any) {
        setError(e);
      }
    };
    init();
  }, []);

  return { isReady, error };
};
