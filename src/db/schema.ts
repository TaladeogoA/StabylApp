import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'stabyl.db';

export const getDb = async () => {
    return await SQLite.openDatabaseAsync(DATABASE_NAME);
};

export const MIGRATIONS = [
    `CREATE TABLE IF NOT EXISTS markets (
        id TEXT PRIMARY KEY,
        ticker TEXT NOT NULL,
        baseAsset TEXT NOT NULL,
        quoteAsset TEXT NOT NULL,
        tickSize REAL NOT NULL,
        minOrderSize REAL DEFAULT 0,
        initialLastPrice REAL,
        initialChange24h REAL,
        is_favorite INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS assets (
        symbol TEXT PRIMARY KEY,
        decimals INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS balances (
        asset TEXT PRIMARY KEY,
        available REAL DEFAULT 0,
        locked REAL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS order_book (
        market_id TEXT,
        side TEXT CHECK(side IN ('bid', 'ask')),
        price REAL,
        size REAL,
        PRIMARY KEY (market_id, side, price)
    );`,
    `CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        market_id TEXT,
        price REAL,
        size REAL,
        side TEXT,
        timestamp INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id TEXT,
        side TEXT,
        price REAL,
        amount REAL,
        status TEXT,
        timestamp INTEGER
    );`
];
