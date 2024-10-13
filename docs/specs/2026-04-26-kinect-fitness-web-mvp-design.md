# Design Specification: SweatSnap (Phase 1 MVP)

## 1. Overview
A zero-install, web-based gamified fitness application that turns a user's smartphone into a motion controller (similar to a Nintendo Wii or Xbox Kinect). The system uses a two-screen architecture where a PC/Laptop acts as the main game screen, and the user's phone streams IMU (Accelerometer & Gyroscope) data to control the game and evaluate workouts.

## 2. Architecture & Components

### The Main Screen (Next.js / React)
- **Environment:** Runs in a desktop browser.
- **Responsibilities:**
  - Renders 3D/2D game visuals and UI.
  - Generates a QR code for mobile pairing.
  - Generates audio/visual callouts (e.g., "Jab!", "Jump!").
  - Evaluates incoming motion data against expected signatures.
  - Calculates scores, reaction times, and combo streaks.

### The Mobile Controller (Mobile Web)
- **Environment:** Runs in a mobile browser (accessed via QR code).
- **Responsibilities:**
  - Uses the HTML5 `DeviceMotionEvent` API to capture raw Accelerometer and Gyroscope data at ~60-100Hz.
  - Acts as a "dumb" sensor array, blindly streaming X, Y, Z values to the bridge without heavy processing (to save battery and ensure zero-install).

### The Bridge (WebSocket Server)
- **Environment:** Node.js + Socket.io (or similar low-latency WebSocket).
- **Responsibilities:**
  - Instantly pairs the phone's session with the PC's session.
  - Relays continuous motion data with <50ms latency.

## 3. Game Modes & Sensor Placement

The application features 5 distinct modes, relying on specific phone placement for accurate movement detection.

### 1. Shadow Boxing
- **Placement:** Phone held in hand or strapped to forearm.
- **Gameplay:** The system calls out combat sequences (e.g., "Jab, Cross, Slip, Hook").
- **Detection Logic:**
  - *Straight punches (Jab/Cross):* High forward acceleration (Z/Y axis depending on grip).
  - *Hooks:* High rotational velocity on the Gyroscope.
  - *Slips:* Quick lateral acceleration/drop.
  - *Blocks:* Holding the phone steady in an elevated position.

### 2. Kickboxing
- **Placement:** Phone in pocket.
- **Gameplay:** The system calls out lower-body combat sequences (e.g., "Front Kick, Knee, Sprawl").
- **Detection Logic:**
  - *Front Kick:* Upward rotational swing.
  - *Knee:* High vertical acceleration spike.
  - *Sprawl:* Rapid downward drop and sudden stop.

### 3. Reflex Ridge (Obstacle Run)
- **Placement:** Phone in pocket.
- **Gameplay:** Endless runner style. The user physically jumps, ducks, and sidesteps to navigate an on-screen course.
- **Detection Logic:** Y-axis acceleration spikes for jumps/ducks; X-axis shifts for dodges.

### 4. Iron Pump
- **Placement:** Phone held in hand.
- **Gameplay:** Rhythm-based weightlifting (curls, shoulder presses).
- **Detection Logic:** Evaluates smooth, controlled up/down arcs to enforce good lifting form rather than explosive speed.

### 5. Power Workout (The Mix)
- **Placement:** Dynamic.
- **Gameplay:** A randomized playlist that cycles through the 4 modes above.
- **Transition Handling:** Implements a strict 10-second transition screen between modes that require different phone placements (e.g., "Take phone out of pocket, hold in right hand! Boxing starts in 3... 2... 1...").

## 4. Data Processing & Scoring Mechanics

- **Listening Windows:** When the PC game issues a command (e.g., "Hook!"), it opens a predefined timing window (e.g., 1000ms).
- **Signature Matching:** The PC evaluates the raw data stream against the expected kinematic signature of the requested move.
- **Accuracy Score:** Awarded if the detected signature closely matches the requested move (e.g., doing a Hook instead of a Jab).
- **Reaction Time Score:** Based on the delta between the audio cue and the detection of the movement spike.
- **Combo System:** Stringing together correctly executed moves within their listening windows builds a combo multiplier. Missing a window or executing the wrong move breaks the combo.

## 5. Fallbacks and Constraints
- **Screen Sleeping:** The mobile web approach requires the phone screen to remain on. The UI will instruct the user to disable auto-lock or use a wakelock API if supported.
- **Mismatched Placement:** If the game expects a jump but receives data indicative of an arm swing, the signature matching will fail, resulting in a "Miss." No complex auto-correction of placement is planned for V1; instead, explicit UI instructions (like the 10-second transition screens) manage user behavior.
