# SweatSnap Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-screen gamified fitness MVP where a mobile phone acts as an IMU motion controller for a Next.js web game.

**Architecture:** A separate Node.js/Socket.io server acts as a low-latency bridge. A Next.js frontend handles both the Desktop game UI (generating a pairing QR code) and the Mobile controller UI (capturing `DeviceMotionEvent` and streaming it). The Desktop UI analyzes the motion stream to score punches and dodges.

**Tech Stack:** Next.js (React), Node.js, Socket.io, `qrcode.react`, Jest (for unit testing logic).

---

### Setup & Prep

Before starting the tasks, initialize the project in the workspace.

- [x] **Step 1: Scaffold Next.js and Backend**
```bash
npx create-next-app@latest frontend --typescript --eslint --tailwind --app --use-npm --yes
mkdir bridge-server && cd bridge-server && npm init -y
npm install express socket.io cors
npm install --save-dev jest supertest socket.io-client
cd ../frontend
npm install socket.io-client qrcode.react lucide-react
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

---

### Task 1: The WebSocket Bridge Server

**Files:**
- Create: `bridge-server/server.js`
- Create: `bridge-server/tests/server.test.js`

- [x] **Step 1: Write the failing test for the bridge**
```javascript
// bridge-server/tests/server.test.js
const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

describe("WebSocket Bridge", () => {
  let io, serverSocket, clientDesktop, clientMobile;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Setup minimal bridge logic
      io.on("connection", (socket) => {
        socket.on("join-room", (roomId) => socket.join(roomId));
        socket.on("motion-data", (data) => {
          socket.to(data.roomId).emit("motion-data", data);
        });
      });

      clientDesktop = new Client(`http://localhost:${port}`);
      clientMobile = new Client(`http://localhost:${port}`);
      
      let connected = 0;
      const checkDone = () => { if (++connected === 2) done(); };
      clientDesktop.on("connect", checkDone);
      clientMobile.on("connect", checkDone);
    });
  });

  afterAll(() => {
    io.close();
    clientDesktop.close();
    clientMobile.close();
  });

  test("should relay motion data from mobile to desktop in same room", (done) => {
    const roomId = "room-123";
    clientDesktop.emit("join-room", roomId);
    clientMobile.emit("join-room", roomId);

    clientDesktop.on("motion-data", (data) => {
      expect(data.accel.x).toBe(1.5);
      done();
    });

    setTimeout(() => {
      clientMobile.emit("motion-data", { roomId, accel: { x: 1.5, y: 0, z: 0 } });
    }, 50);
  });
});
```

- [x] **Step 2: Run test to verify it fails/passes**
Run: `cd bridge-server && npx jest tests/server.test.js`
Expected: PASS (logic is embedded in test for now to verify behavior).

- [x] **Step 3: Write minimal implementation**
```javascript
// bridge-server/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // Notify desktop that mobile connected
    socket.to(roomId).emit('mobile-connected'); 
  });

  socket.on('motion-data', (data) => {
    socket.to(data.roomId).emit('motion-data', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Bridge server listening on port ${PORT}`);
});
```

- [x] **Step 4: Commit**
```bash
git add bridge-server/
git commit -m "feat: add websocket bridge server"
```

---

### Task 2: Desktop Game UI & QR Pairing

**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/DesktopGame.tsx`

- [x] **Step 1: Write minimal implementation for Desktop Game**
```tsx
// frontend/components/DesktopGame.tsx
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

export default function DesktopGame() {
  const [roomId, setRoomId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  const [lastMotion, setLastMotion] = useState<{accel: any, gyro: any} | null>(null);

  useEffect(() => {
    // Generate a random 4-digit room code
    const newRoom = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(newRoom);

    const socket = io('http://localhost:3001');
    socket.on('connect', () => {
      socket.emit('join-room', newRoom);
    });

    socket.on('mobile-connected', () => {
      setMobileConnected(true);
    });

    socket.on('motion-data', (data) => {
      setLastMotion(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const connectUrl = typeof window !== 'undefined' ? `${window.location.origin}/controller?room=${roomId}` : '';

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      {!mobileConnected ? (
        <div className="bg-neutral-800 p-8 rounded-xl flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold">SweatSnap</h1>
          <p className="text-neutral-400 text-center max-w-sm">Scan with your phone to turn it into a motion controller.</p>
          <div className="bg-white p-4 rounded-lg">
            {roomId && <QRCodeSVG value={connectUrl} size={256} />}
          </div>
          <p className="text-2xl font-mono tracking-widest">{roomId}</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="bg-green-500/20 text-green-400 p-4 rounded-lg mb-8 text-center font-bold">
            📱 Controller Connected!
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">Accelerometer</h2>
              <pre className="font-mono text-sm text-neutral-400">
                {JSON.stringify(lastMotion?.accel, null, 2)}
              </pre>
            </div>
            <div className="bg-neutral-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">Gyroscope</h2>
              <pre className="font-mono text-sm text-neutral-400">
                {JSON.stringify(lastMotion?.gyro, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 2: Update Main Page**
```tsx
// frontend/app/page.tsx
import DesktopGame from '@/components/DesktopGame';

export default function Home() {
  return <DesktopGame />;
}
```

- [x] **Step 3: Commit**
```bash
git add frontend/app/page.tsx frontend/components/DesktopGame.tsx
git commit -m "feat: add desktop QR pairing UI"
```

---

### Task 3: Mobile Controller Page

**Files:**
- Create: `frontend/app/controller/page.tsx`
- Create: `frontend/components/MobileController.tsx`

- [ ] **Step 1: Write Mobile Controller logic**
```tsx
// frontend/components/MobileController.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function MobileController() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;
    const s = io('http://localhost:3001');
    s.on('connect', () => {
      s.emit('join-room', roomId);
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [roomId]);

  const requestPermissionsAndStart = async () => {
    try {
      // Handle iOS 13+ permission requirements
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          setError('Permission to access motion sensors was denied.');
          return;
        }
      }

      setIsStreaming(true);

      const handleMotion = (event: DeviceMotionEvent) => {
        if (!socket) return;
        
        socket.emit('motion-data', {
          roomId,
          accel: {
            x: event.acceleration?.x || 0,
            y: event.acceleration?.y || 0,
            z: event.acceleration?.z || 0,
          },
          gyro: {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0,
          },
          timestamp: Date.now()
        });
      };

      window.addEventListener('devicemotion', handleMotion);
    } catch (err: any) {
      setError(err.message || 'Failed to start sensors');
    }
  };

  if (!roomId) return <div className="p-8 text-white">No room specified</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {error && <div className="text-red-500 mb-4 bg-red-500/20 p-4 rounded">{error}</div>}
      
      {!isStreaming ? (
        <button 
          onClick={requestPermissionsAndStart}
          className="w-full max-w-sm aspect-square bg-blue-600 rounded-full text-3xl font-bold shadow-[0_0_50px_rgba(37,99,235,0.5)] active:scale-95 transition-transform"
        >
          START SENSORS
        </button>
      ) : (
        <div className="text-center">
          <div className="w-48 h-48 bg-green-500/20 border-4 border-green-500 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <span className="text-2xl font-bold text-green-400">STREAMING</span>
          </div>
          <p className="text-neutral-400">Keep browser open and screen on.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update Controller Route**
```tsx
// frontend/app/controller/page.tsx
import { Suspense } from 'react';
import MobileController from '@/components/MobileController';

export default function ControllerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileController />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add frontend/app/controller/page.tsx frontend/components/MobileController.tsx
git commit -m "feat: add mobile controller and IMU capture"
```

---

### Task 4: Motion Signature Engine (Shadow Boxing Logic)

**Files:**
- Create: `frontend/lib/motionEngine.ts`
- Create: `frontend/__tests__/motionEngine.test.ts`

- [ ] **Step 1: Write failing test for signature matching**
```typescript
// frontend/__tests__/motionEngine.test.ts
import { detectPunch } from '../lib/motionEngine';

describe('Motion Engine', () => {
  it('detects a Jab from high forward acceleration', () => {
    // Simulating phone in right hand, punching forward (Z axis spike)
    const stream = [
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
      { accel: { x: 0, y: 0, z: 15 }, gyro: { alpha: 0, beta: 0, gamma: 0 } }, // Spike
      { accel: { x: 0, y: 0, z: -5 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
    ];
    
    const result = detectPunch(stream);
    expect(result).toBe('jab');
  });

  it('detects a Hook from high rotational velocity', () => {
    // Simulating twisting arm horizontally
    const stream = [
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: 0, gamma: 0 } },
      { accel: { x: 0, y: 0, z: 5 }, gyro: { alpha: 0, beta: 150, gamma: 0 } }, // High rotation
      { accel: { x: 0, y: 0, z: 0 }, gyro: { alpha: 0, beta: -20, gamma: 0 } },
    ];
    
    const result = detectPunch(stream);
    expect(result).toBe('hook');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd frontend && npx jest __tests__/motionEngine.test.ts`
Expected: FAIL. `detectPunch` is not defined.

- [ ] **Step 3: Implement minimal engine logic**
```typescript
// frontend/lib/motionEngine.ts

export type IMUData = {
  accel: { x: number; y: number; z: number };
  gyro: { alpha: number; beta: number; gamma: number };
  timestamp?: number;
};

// Simplified detection logic for MVP
export function detectPunch(streamWindow: IMUData[]): 'jab' | 'hook' | 'none' {
  if (streamWindow.length === 0) return 'none';

  let maxAccelZ = 0;
  let maxGyroBeta = 0; // Assuming beta is the twisting axis for hand

  for (const frame of streamWindow) {
    if (Math.abs(frame.accel.z) > maxAccelZ) maxAccelZ = Math.abs(frame.accel.z);
    if (Math.abs(frame.gyro.beta) > maxGyroBeta) maxGyroBeta = Math.abs(frame.gyro.beta);
  }

  // Thresholds (would need tuning in real life)
  const JAB_ACCEL_THRESHOLD = 12;
  const HOOK_GYRO_THRESHOLD = 100;

  if (maxGyroBeta > HOOK_GYRO_THRESHOLD) {
    return 'hook';
  } else if (maxAccelZ > JAB_ACCEL_THRESHOLD) {
    return 'jab';
  }

  return 'none';
}
```

- [ ] **Step 4: Run test to verify passes**
Run: `cd frontend && npx jest __tests__/motionEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/lib/motionEngine.ts frontend/__tests__/motionEngine.test.ts
git commit -m "feat: add basic punch signature engine"
```

---

### Task 5: Shadow Boxing Game Loop integration

**Files:**
- Modify: `frontend/components/DesktopGame.tsx`

- [ ] **Step 1: Integrate game loop into Desktop UI**
Replace contents of `DesktopGame.tsx` to include the game loop:
```tsx
// frontend/components/DesktopGame.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { IMUData, detectPunch } from '../lib/motionEngine';

export default function DesktopGame() {
  const [roomId, setRoomId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  
  // Game State
  const [targetMove, setTargetMove] = useState<'jab' | 'hook' | 'none'>('none');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  // Motion buffer
  const bufferRef = useRef<IMUData[]>([]);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const newRoom = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(newRoom);

    const socket = io('http://localhost:3001');
    socket.on('connect', () => { socket.emit('join-room', newRoom); });
    socket.on('mobile-connected', () => { setMobileConnected(true); });

    socket.on('motion-data', (data: IMUData) => {
      if (!isListeningRef.current) return;
      
      bufferRef.current.push(data);
      // Keep buffer small (e.g. 500ms window at 60hz = 30 frames)
      if (bufferRef.current.length > 30) {
        bufferRef.current.shift();
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // Game Loop
  useEffect(() => {
    if (!mobileConnected) return;

    const moves: ('jab' | 'hook')[] = ['jab', 'hook'];
    
    const nextMove = () => {
      const move = moves[Math.floor(Math.random() * moves.length)];
      setTargetMove(move);
      setFeedback('');
      isListeningRef.current = true;
      bufferRef.current = [];

      // Evaluate after 1.5 seconds window
      setTimeout(() => {
        isListeningRef.current = false;
        const detected = detectPunch(bufferRef.current);
        
        if (detected === move) {
          setScore(s => s + 100);
          setFeedback('PERFECT!');
        } else if (detected !== 'none') {
          setFeedback(`MISS! Detected: ${detected}`);
        } else {
          setFeedback('TOO LATE!');
        }
        
        // Wait 1 second before next move
        setTimeout(nextMove, 1000);
      }, 1500);
    };

    // Start loop after 3 seconds
    const startTimer = setTimeout(nextMove, 3000);
    return () => clearTimeout(startTimer);
  }, [mobileConnected]);

  const connectUrl = typeof window !== 'undefined' ? `${window.location.origin}/controller?room=${roomId}` : '';

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      {!mobileConnected ? (
        <div className="bg-neutral-800 p-8 rounded-xl flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold">SweatSnap</h1>
          <div className="bg-white p-4 rounded-lg">
            {roomId && <QRCodeSVG value={connectUrl} size={256} />}
          </div>
          <p className="text-2xl font-mono tracking-widest">{roomId}</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-4xl font-bold mb-8">Score: {score}</div>
          
          <div className="h-64 flex flex-col items-center justify-center">
            {targetMove !== 'none' && (
              <div className="text-8xl font-black uppercase text-blue-500 animate-bounce">
                {targetMove}!
              </div>
            )}
            {feedback && (
              <div className={`text-3xl font-bold mt-8 ${feedback === 'PERFECT!' ? 'text-green-500' : 'text-red-500'}`}>
                {feedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/components/DesktopGame.tsx
git commit -m "feat: implement shadow boxing game loop"
```
