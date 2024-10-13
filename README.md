# SweatSnap (Web MVP)

A zero-install, web-based gamified fitness application that turns your smartphone into a high-fidelity motion controller. 

This project uses a two-screen architecture where a PC/Laptop acts as the main game screen, and the user's phone streams IMU (Accelerometer & Gyroscope) data to control the game and evaluate workouts in real-time.

## Features

- **Zero-Install Mobile Controller:** Simply scan a QR code on your PC screen to connect your phone instantly via Mobile Web. No app store downloads required.
- **Real-Time Motion Streaming:** Uses the HTML5 `DeviceMotionEvent` API to stream raw Accelerometer and Gyroscope data at ~60-100Hz.
- **Ultra-Low Latency Bridge:** A dedicated Node.js + Socket.io server ensures <50ms latency between your physical movement and on-screen feedback.
- **Smart Motion Signatures:** Advanced client-side logic differentiates between specific combat moves (e.g., a straight Jab vs. a rotational Hook) based on kinematic signatures.
- **Gamified Feedback Loop:** Visual and textual feedback ("PERFECT!", "TOO LATE!", "MISS!") combined with a real-time scoring system keeps you engaged and motivated.
- **Customizable In-Game Settings:** Tweak the `Jab Acceleration Threshold`, `Hook Gyro Threshold`, `Listening Window`, and `Move Intervals` dynamically from the beautiful, fully-responsive Settings Panel on the Desktop UI.

## Architecture

The system is composed of three main components:

1. **The Main Screen (Desktop Next.js/React):** 
   - Generates the session QR code.
   - Runs the game loop, calling out moves (e.g., "JAB!", "HOOK!").
   - Buffers incoming IMU data and evaluates it against expected motion signatures based on user-defined configurations.
   - Renders the score, combo, and feedback with sleek Framer Motion animations.
   
2. **The Mobile Controller (Mobile Next.js/React):** 
   - Accessed via the QR code.
   - Requests device sensor permissions.
   - Blindly streams raw X, Y, Z acceleration and Alpha, Beta, Gamma rotation to the bridge server.
   - Provides a real-time visual indicator of your activity intensity.
   
3. **The Bridge Server (Node.js/Socket.io):** 
   - Manages WebSocket rooms based on 4-digit codes.
   - Instantly pairs the phone's session with the PC's session.
   - Relays continuous motion data seamlessly.

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A modern smartphone (iOS 13+ requires explicit permission for motion sensors)
- Both devices must be able to reach the bridge server (usually on the same Wi-Fi network if running locally).

### 1. Start the Bridge Server
```bash
cd bridge-server
npm install
npm start
```
*The bridge server runs on `http://localhost:3001` by default.*

### 2. Start the Game Client (Desktop & Mobile)
```bash
cd frontend
npm install
npm run dev
```
*The Next.js app runs on `http://localhost:3000` by default.*

## Quick Start

1. Open your desktop browser and navigate to `http://localhost:3000`.
2. Ensure your phone is connected to the same network (if testing locally, you might need to use your machine's local IP address instead of `localhost` or use a tunnel like ngrok).
3. Scan the QR code displayed on the desktop screen using your phone's camera.
4. On your phone, tap **START** and grant motion permissions if prompted.
5. Once connected, the Desktop UI will show a confirmation. Tap **START WORKOUT** to begin!
6. **Execute the moves!** 
   - For a **Jab**: Thrust the phone straight forward.
   - For a **Hook**: Twist the phone horizontally with your arm.

## Game Modes & Detection Nuances

This MVP currently implements the **Shadow Boxing** module, with plans for more.

### Shadow Boxing Logic
- **Placement:** Phone must be held tightly in your hand (or strapped to your forearm).
- **Listening Window:** When the game calls a move, you have a ~1.5-second window to execute it (fully customizable in Settings).
- **Jab Detection:** The engine looks for a sharp spike in **Z-axis acceleration** (>12 m/s²). It ignores rotation.
- **Hook Detection:** The engine looks for a sharp spike in **Beta-axis rotational velocity** (>100 deg/s). This rotational spike overrides forward acceleration, allowing the system to differentiate a hook from a sloppy jab.

## Troubleshooting

### "Permission to access motion sensors was denied" (iOS)
**Cause:** On iOS 13+, websites must request explicit permission to use device motion, and it must be triggered by a user interaction.
**Solution:** Ensure you tap the "START" button. If it still fails, check Safari settings (`Settings > Safari > Motion & Orientation Access`) and ensure it is enabled.

### Phone connects, but Desktop says "No data" or Misses punches
**Cause:** If testing on `localhost`, your phone cannot resolve `localhost` to your PC. 
**Solution:** 
1. Find your PC's local IP address (e.g., `192.168.1.5`).
2. Open the desktop game using `http://192.168.1.5:3000` so the QR code generates the correct IP address URL.
3. Re-scan the QR code.

### The game is too hard / too easy
**Cause:** The IMU thresholds might not match your specific phone model's weight and sensor sensitivity.
**Solution:** Open the **Settings Panel** (gear icon) on the top right of the desktop game and adjust `Jab Acceleration Threshold` and `Hook Gyro Threshold` in real-time.

## Contributing

Contributions are welcome! If you want to add new movement signatures (like Uppercuts or Slips), check out `frontend/lib/motionEngine.ts` and write corresponding tests in `frontend/__tests__/motionEngine.test.ts`.

## License

MIT License.
