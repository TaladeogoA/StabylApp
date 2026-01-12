# StabylApp - Offline Market Data Simulation

## Overview
StabylApp is a React Native (Expo) application that simulates a real-time crypto exchange environment using offline data. It features a custom **Stream Engine** that replays historical market data (trades and order book updates) from a local `.ndjson` file, providing a realistic trading experience without a network connection.

## Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Development** (Mac only):
    - **Xcode 15+** (required for iOS Simulator)
    - CocoaPods (`sudo gem install cocoapods`)
- **Android Development**:
    - **Android Studio**
    - A configured Android Virtual Device (AVD) / Emulator

### Installation
1.  **Clone the repository**:
    ```bash
    cd StabylApp
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Server**:
    ```bash
    npx expo start
    ```

4.  **Run on Device/Simulator**:
    - Press `i` to open in iOS Simulator.
    - Press `a` to open in Android Emulator.

---

## Architecture & Design Decisions

### 1. State Management & Data Flow
The application uses a **hybrid state management** approach:

*   **Stream Engine (Singleton)**: The core logic lives in `src/engine/stream.ts` as a singleton instance (`streamEngine`). It manages the file reading cursor and playback loop.
    *   **Modular DB Logic**: Actual database writes are delegated to `src/engine/orderBookOps.ts`. This separation allows us to unit test the order book logic (inserts/upserts/deletes) in isolation without spinning up the full stream engine.
*   **Database as Single Source of Truth**: UI components do **not** subscribe directly to the stream. Instead, they react to database changes or poll for updates. This decouples the high-frequency ingestion engine from the rendering layer.
*   **`useMarketStream` Hook**: A React hook that subscribes to the engine's status (playing/paused) and exposes control methods (`play`, `pause`, `reset`). It uses a listener pattern to force re-renders only when the stream status changes, not on every tick.

### 2. Database Schema (`src/db/`)
We use `expo-sqlite` to persist market state. Key tables include:

*   **`markets`**: Static metadata (ticker, precision) plus snapshot data (`initialLastPrice`).
*   **`trades`**: Historical trade log.
    *   **Primary Key**: `id` (provided by stream) ensures **deduplication**. If the stream replays a trade, `INSERT OR IGNORE` prevents data corruption.
*   **`order_book`**: snapshot of current bids/asks.
    *   **Modeling**: Each row is a price level (`market_id`, `side`, `price`).
    *   **Updates**: We use `ON CONFLICT DO UPDATE` to handle size changes efficiently without deleting rows.

---

## Reliability & Performance Optimizations

Simulating a high-frequency trading environment on a mobile device requires careful resource management.

1.  **Chunked JIT Parsing**:
    The `.ndjson` stream file is not loaded into memory at once. We use `expo-file-system` to read it byte-by-byte (using a `TextDecoder` stream), parsing lines just-in-time. This keeps the memory footprint constant regardless of file size.

2.  **Batched Writes & Tick Loop**:
    The stream engine runs a `while` loop with a **10ms constraint**. It processes events sequentially and writes to SQLite. While we currently write per-event for simplicity in this demo, the architecture supports wrapping multiple events in a single SQL Transaction for higher throughput.

3.  **SQL Upserts**:
    Instead of clearing and rebuilding the order book (common in simple demos), we use atomic `UPSERT` operations. This minimizes disk I/O and keeps the order book indices intact.

4.  **UI Separation**:
    By decoupling the stream (writer) from the UI (reader) via SQLite, we prevent main-thread blocking. The UI polls or fetches data at 60fps (or less), while the stream engine can process thousands of events in the background without causing frame drops.

---

## Trade-offs & Future Improvements

### Trade-offs
*   **Polling vs. Events**: Currently, screens like `MarketsScreen` poll the DB every second. In a production app, we would use an **Event Bus** or **Observable Queries** (like WatermelonDB) to push updates only when relevant data changes, reducing CPU usage.
*   **No Matching Engine**: User orders are "simulated" (fill instantly or sit in `orders` table) but do not interact with the order book's liquidity. A real exchange needs a server-side matching engine.

### Future Improvements
1.  **WebSocket Integration**: Replace the local file stream with a `WebSocket` connection for live remote data.
2.  **Chart Generation**: Aggregate trades into OHLCV candles (1m, 5m, 1h) in a separate table for rendering Candlestick charts.

---

## Testing
We implement **integration tests** that run against a real in-memory SQLite database to verify the correctness of the trading engine.

### Running Tests
```bash
npm test
```

### Test Scope (`src/tests/orderBookOps.test.ts`)
The tests use `better-sqlite3` to simulate the mobile SQLite environment and verify:
1.  **Insert**: New price levels are created correctly.
2.  **Upsert**: Existing levels update their size (overwrite).
3.  **Delete**: Events with `size: 0` remove the row.
4.  **Sorting**: Bids descend, Asks ascend (verified via SQL queries).
5.  **Deduplication**: Duplicate Trade IDs are ignored (`INSERT OR IGNORE`).

---

## Demo
https://youtube.com/shorts/3Bjg-u9K_ac?feature=share

---

## Project Structure
```
src/
├── components/   # Reusable UI widgets (OrderBook, Header, etc.)
├── constants/    # Theme, Colors, Typography
├── db/           # Schema, Seeding, and Query logic
├── engine/       # Stream Engine & Order Book processing logic
├── hooks/        # React hook for stream state
├── navigation/   # Root navigator
├── screens/      # Main Application Screens
├── tests/        # Test utilities and integration tests
└── utils/        # PnL helpers
```

## Tech Stack
- **Framework**: React Native (Expo SDK 50+)
- **Storage**: SQLite (expo-sqlite)
- **Styling**: StyleSheet + Custom Theme
- **Testing**: Jest + better-sqlite3
- **Fonts**: Google Fonts (DM Sans)
