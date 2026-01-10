export interface MarketData {
    marketId: string;
    base: string;
    quote: string;
    tickSize: number;
    minOrderSize: number;
    initialLastPrice: number;
    initialChange24h: number;
}

export interface AssetData {
    assetId: string;
    decimals: number;
    description?: string;
}

export interface BalanceData {
    asset: string;
    available: number;
    locked: number;
}

export interface OrderBookData {
    market: string;
    asks: [number, number][];
    bids: [number, number][];
}

export interface TradeData {
    market?: string;
    tradeId?: string;
    id?: string;
    price: number;
    size: number;
    side: string;
    ts: number;
}
