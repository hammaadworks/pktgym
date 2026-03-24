# Contributing to pktgym

Welcome! We're excited that you want to help make **pktgym** the best open-source fitness platform on the web.

---

## 🛠️ Development Environment

### Setup
1. Fork and clone the repository.
2. Install dependencies: `pnpm install`.
3. Start the dev server: `pnpm dev`.
4. Run tests to ensure everything is working: `pnpm test`.

### Testing on Real Devices
Since **pktgym** relies on hardware sensors (Accelerometer/Gyroscope), you'll need to test with a real smartphone.
- Ensure your phone and computer are on the same Wi-Fi network.
- Open the local IP address of your computer (e.g., `http://192.168.1.50:8899`) on your phone.

---

## 🎮 Adding a New Game Mode

Adding a new workout is easy thanks to our modular feature structure.

1. **Define the Mode:** Add your new mode to the `GameMode` type in `src/features/games/engine/types.ts`.
2. **Define Signatures:** Determine the movement signatures for your game (e.g., which axis spikes during a "Squat").
3. **Implement UI:** Create a new component in `src/features/games/components` that utilizes the motion engine.
4. **Register:** Add your game to the main menu/selection logic.

---

## 🧠 Extending the Motion Engine

The motion engine lives in `src/features/games/engine`.

### Detection Logic
We use a window-based classification approach. If you're adding a new move:
1. Capture raw data of the move being performed.
2. Analyze the peaks in `engine.ts`.
3. Update `detectMove()` to handle your new `MoveType`.

### Thresholds
Move thresholds are configurable in `config.ts`. We use an **Adaptive Threshold** system—users calibrate their own "100% effort" which then scales these constants.

---

## 🔌 Protocol Changes (WebRTC & Zod)

If you need to send new types of data between the phone and desktop:
1. Update `src/features/connection/schema.ts` with the new Zod schema.
2. Update the `PeerMessageSchema` union.
3. Handle the new message type in the connection hooks (`useDesktopConnection.ts`, `useDesktopSocket.ts`, `useDesktopPeer.ts`, or `useMobileConnection.ts`).

**Why Zod?** It ensures that both the mobile and desktop sides are always in sync. If you change the schema, the TypeScript compiler will guide you through the necessary updates on both sides.

---

## 📏 Standards & Guidelines

- **TypeScript:** Everything must be strictly typed. Avoid `any` at all costs.
- **Clean Code:** Follow the SOLID principles. Keep components small and focused.
- **Visual Feedback:** We follow the **Emil Kowalski** philosophy. Every action should have clear, snappy visual feedback (spring animations, subtle haptics).
- **Tests:** Add unit tests for any new engine logic or utility functions.

---

## 🚀 Pull Request Process

1. Create a feature branch from `master`.
2. Ensure all tests pass: `pnpm test`.
3. Provide a clear description of the change and, if applicable, a video showing the new feature in action.
4. Once approved, your changes will be merged!

Thank you for contributing to the future of decentralized fitness!
