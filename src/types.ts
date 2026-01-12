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

export interface StreamEvent {
    type: 'trade' | 'ob_delta';
    market: string;
    ts: number;
    seq: number;
    tradeId?: string;
    price?: number;
    size?: number;
    side?: 'buy' | 'sell' | 'bid' | 'ask';
}

export interface MarketRow {
    id: string;
    ticker: string;
    lastPrice: number;
    change24h: number;
    is_favorite: boolean;
    initialLastPrice?: number;
    initialChange24h?: number;
}

export interface OrderRow {
    id: string;
    market_id: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    status: string;
    timestamp: number;
}

export interface WalletRow {
    asset: string;
    available: number;
    locked: number;
    decimals: number;
    usdtValue?: number;
}
