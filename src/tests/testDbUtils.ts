import Database from 'better-sqlite3';
import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from '../db/schema';

class TestDatabase implements Partial<SQLite.SQLiteDatabase> {
    private db: Database.Database;

    constructor() {
        this.db = new Database(':memory:');
        MIGRATIONS.forEach(sql => {
            this.db.prepare(sql).run();
        });
    }

    async runAsync(source: string, ...params: any[]): Promise<SQLite.SQLiteRunResult> {
        const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        const info = this.db.prepare(source).run(...args);
        return {
            lastInsertRowId: Number(info.lastInsertRowid),
            changes: info.changes
        };
    }

    async getAllAsync<T>(source: string, ...params: any[]): Promise<T[]> {
        const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        return this.db.prepare(source).all(...args) as T[];
    }

    async getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null> {
        const args = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        const result = this.db.prepare(source).get(...args);
        return (result === undefined ? null : result) as T | null;
    }

    close() {
        this.db.close();
    }
}

export const createTestDb = () => {
    return new TestDatabase() as unknown as SQLite.SQLiteDatabase;
};
