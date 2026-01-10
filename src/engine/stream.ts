import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { StreamEvent } from '../types';

export class MarketStream {
    private events: StreamEvent[] = [];
    private currentIndex = 0;
    private isLoaded = false;

    async load() {
        if (this.isLoaded) return;

        try {
            const asset = Asset.fromModule(require('../../assets/data/stream/market_stream.ndjson'));
            await asset.downloadAsync();

            if (!asset.localUri) {
                throw new Error('Failed to load stream asset URI');
            }

            const content = await FileSystem.readAsStringAsync(asset.localUri);

            const lines = content.split('\n');
            this.events = lines
                .filter(line => line.trim().length > 0)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(e => e !== null) as StreamEvent[];

            this.isLoaded = true;
        } catch (error) {
            console.error('[MarketStream] Error loading stream:', error);
            throw error;
        }
    }

    reset() {
        this.currentIndex = 0;
    }

    nextBatch(batchSize: number = 10): StreamEvent[] {
        if (this.currentIndex >= this.events.length) {
            return [];
        }

        const end = Math.min(this.currentIndex + batchSize, this.events.length);
        const batch = this.events.slice(this.currentIndex, end);
        this.currentIndex = end;
        return batch;
    }

    get progress() {
        return this.currentIndex / this.events.length;
    }

    get totalEvents() {
        return this.events.length;
    }
}

export const streamEngine = new MarketStream();
