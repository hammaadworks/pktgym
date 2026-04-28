# Design Language: pktgym

This document outlines the visual identity and UI/UX principles that define the **pktgym** experience.

---

## 🎨 Visual Style: "Energetic & Block-based"

**pktgym** uses a high-contrast, bold aesthetic designed for high-intensity movement. The UI is built to be readable from across a room (e.g., when the computer is on a TV).

- **Mode Support:** Immersive Dark Mode is the default.
- **Keywords:** Bold, energetic, geometric, high color contrast, athletic.

### Color Palette
- **Primary (Action):** `#F97316` (Energetic Orange) - Used for primary CTA and scoring.
- **Accent (Success):** `#22C55E` (Green) - Used for "Perfect" hits and combos.
- **Background:** `#020617` (Deep Navy/Black) - For maximum contrast.
- **Foreground:** `#F8FAFC` (Clean White) - Primary text.

### Typography: Barlow Condensed
We use **Barlow Condensed** (and **Barlow**) to reinforce a sports-oriented, athletic mood.
- **Headings:** Bold, uppercase, often italicized for a sense of speed.
- **Metrics:** Extra large (48px+) for score and combo counters.

---

## 🏃 UX Philosophy: "Perceived Performance"

Following the **Emil Kowalski** approach to UI polish, we prioritize animations that make the application feel alive and responsive.

### 1. Organic Motion
- **Spring Physics:** All UI transitions (modals, score popups) use spring curves (`stiffness: 400, damping: 20`) instead of linear easing.
- **3D Depth:** Movement callouts use subtle CSS `perspective` transforms to pop off the screen.

### 2. Immediate Feedback
- **Snappy Response:** When the motion engine detects a move, the visual confirmation appears within 1 frame (16ms).
- **Haptic Hints:** (Future) Utilizing the mobile device's vibration motor for "impact" feedback on punches/kicks.

### 3. Accessible Layout
- **Large Targets:** Since the user might be standing 5-10 feet away, all critical UI elements are oversized.
- **Zero Friction:** Pairing is a one-step process (Scan -> Play).

---

## 🧱 Component Guidelines

- **Block Layouts:** Use clear, bordered sections with rounded corners (`rounded-2xl`).
- **Gaps:** Large spacing (32px - 48px) to prevent visual clutter.
- **Icons:** Use **Lucide React** for clean, consistent line icons.
- **Hover States:** Smooth scaling (1.05x) and color shifts (150-300ms).

---

## 📐 Responsive Strategy

- **Desktop/TV:** Optimized for 1080p and 4K displays. Focus on readability from distance.
- **Mobile Controller:** Optimized for single-hand use. Large buttons and clear orientation instructions.
