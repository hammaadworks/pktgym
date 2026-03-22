# pktgym

**pktgym** is an open-source, zero-install fitness gaming platform that turns your smartphone into a high-precision motion controller. Using WebRTC and modern browser APIs, it brings the "Kinect" or "Wii" experience to the web with ultra-low latency and no hardware beyond what you already own.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/framework-Next.js-black.svg)
![WebRTC](https://img.shields.io/badge/p2p-WebRTC-orange.svg)

---

## 🚀 Key Features

- **Zero-Install Pairing:** Scan a QR code on your TV/Desktop with your phone to start playing instantly.
- **P2P Motion Streaming:** Uses PeerJS (WebRTC) for direct peer-to-peer data transfer, ensuring <10ms latency over local networks.
- **Smart Motion Engine:** A custom-built engine that analyzes raw IMU data (accelerometer/gyroscope) to detect punches, kicks, jumps, and more.
- **Privacy-First:** All motion data stays local. No backend server ever sees your movement patterns.
- **Adaptive Calibration:** Dynamically tunes thresholds based on your phone's sensors and your personal strength.

---

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Setup
```bash
# Clone the repository
git clone https://github.com/hammaadworks/pktgym.git
cd pktgym

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The game will be available at `http://localhost:8899`.

---

## 🎮 How to Play

1. **Launch the Game:** Open the URL on your Desktop or Smart TV browser.
2. **Pair Your Phone:** Use your smartphone's camera to scan the QR code displayed on the screen.
3. **Calibrate:** Follow the on-screen prompts to calibrate your phone's sensors.
4. **Play:** Hold your phone as instructed and start your workout!

---

## 🏗️ Architecture Overview

pktgym is built with a modular, feature-based architecture:

- **Mobile Controller:** A "dumb" sensor pipeline that streams raw X, Y, Z data at 60Hz.
- **Desktop Game:** The host environment that runs the game loop, validates incoming data with **Zod**, and runs the motion detection engine.
- **Bridge Layer:** A dual-connection data channel using PeerJS (WebRTC) for the web version and local WebSockets for the Tauri offline app.

For a deep dive into the system design, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🤝 Contributing

We love contributions! pktgym is built for the community. Whether you want to add a new game mode, improve the motion engine, or polish the UI, check out our [CONTRIBUTING.md](docs/CONTRIBUTING.md) to get started.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
See `LICENSE` for more information.
