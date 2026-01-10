import { MarketStream } from './stream';

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloadAsync: jest.fn(),
      localUri: 'file://mock',
    }),
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue(`
    {"type": "trade", "market": "USDT-NGN", "price": 100, "ts": 1, "seq": 1}
    {"type": "ob_delta", "market": "USDT-NGN", "price": 101, "size": 10, "side": "ask", "ts": 2, "seq": 2}
  `),
}));

describe('MarketStream Engine', () => {
  it('loads and parsing events correctly', async () => {
    const stream = new MarketStream();
    await stream.load();

    expect(stream.totalEvents).toBe(2);

    const batch = stream.nextBatch(1);
    expect(batch.length).toBe(1);
    expect(batch[0].type).toBe('trade');

    const batch2 = stream.nextBatch(10);
    expect(batch2.length).toBe(1);
    expect(batch2[0].type).toBe('ob_delta');

    const batch3 = stream.nextBatch(1);
    expect(batch3.length).toBe(1);
    expect(batch3[0].seq).toBe(1);
  });
});
