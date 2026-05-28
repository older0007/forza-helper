# Forza Horizon Companion

A native-feeling, high-performance telemetry dashboard and PS5 DualSense controller adaptive triggers integration client for Forza Horizon games. 

The application runs as a standalone executable in the Windows system tray, captures UDP telemetry packets from the game, applies physical force feedback effects on your DualSense controller, and serves a modern, glassmorphic telemetry dashboard.

---

## Key Features

### 1. DualSense Adaptive Triggers Integration
* **ABS Brake Feedback (L2)**: Simulates realistic anti-lock braking pulsations on the left trigger. The trigger chatters and resists when tires begin to slip, respecting a minimum speed threshold to prevent parking-lot rumble.
* **Traction Control Feedback (R2)**: Accelerates trigger vibration frequency and resistance when rear drive wheels lose traction.
* **Rev Limiter Redline Warning (R2)**: Vibrates the gas trigger at high frequencies when approaching the redline threshold (e.g. 97% max RPM) to prompt upshifts.
* **Gear Shift Clutch Thump**: Implements a short physical punch/thump on both pedals during transmission gear shifts to simulate physical clutch engagement.
* **Stiffness Resistance Scaling**: Scales the baseline hydraulic resistance force of both pedals to match heavy performance cars or light street tuners.
* **Three Accelerator (R2) Modes**:
  * **Linear**: Heavy real pedal weight with adjustable stiffness, but zero vibrations.
  * **Full Dynamic**: Combines pedal weight with Traction Control (TC) and Rev Limiter vibrations.
  * **Traction Loss**: Dynamic pedal weight combined with Traction Control vibrations only.

### 2. Live Telemetry Dashboard
* **Traction & Grip Monitor**: Real-time circular progress gauge visualizing average grip state (perfect, slipping, loss of control) alongside individual Front/Rear slip metrics and wheelspin ratios.
* **Tire & Suspension Telemetry**: Live temperatures (Celsius/Fahrenheit), suspension compression travel meters, and individual tire slip rates.
* **Engine Performance Metrics**: Real-time horsepower, torque, and boost pressure outputs with peak recorders and resets.
* **Race Position & Timing**: Lap timers (current, last, best), current race position, drivetrain configuration, and total distance traveled.
* **Live GPS Track Map**: Plots a dynamic breadcrumb trail mapping vehicle coordinate trajectories in real-time.

### 3. Integrated Databases & Translations
* **Car Model Mappings**: Mappings for thousands of vehicle ordinals in FH4, FH5, and FH6, featuring a live **GitHub Database Update** utility.
* **Global Flag Dropdown Selector**: Custom glassmorphic select button supporting **47 European and regional languages** with native names and country flags, featuring robust layout-shift prevention (`scrollbar-gutter`).

---

## Architecture & Project Structure

The project is structured as a monorepo containing a Node.js backend and a Vite + React + TypeScript frontend.

```
├── dist/                          # Packaged executable distribution
├── frontend/                      # React SPA Dashboard project
│   ├── src/
│   │   ├── components/            # Telemetry UI widgets
│   │   ├── locales/               # 47 translation dictionaries (.json)
│   │   │   └── index.ts           # Central locales loader registry
│   │   ├── utils/
│   │   │   └── carDb.ts           # Car ordinal translation engine
│   │   └── App.tsx                # Main layout and settings state
├── scripts/                       # Executable packaging helper scripts
├── server.js                      # Core UDP engine, websocket bridge, HTTP server
└── package.json                   # Project configuration and pkg targets
```

---

## Getting Started

### Prerequisites
* **Windows 10 / 11**
* **Node.js v18+** (for development)
* **PlayStation 5 DualSense Controller** connected via USB cable (for adaptive trigger features).

### Quick Install (Standalone Executable)
1. Navigate to the `dist/` directory.
2. Launch `forza-companion.exe`.
3. Check the Windows System Tray (bottom right corner) for the steering wheel icon.
4. Right-click the icon and choose **Open Dashboard** to load the web interface at `http://localhost:3002`.

### Development Build
1. Install dependencies in the root:
   ```bash
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   npm install --prefix frontend
   ```
3. Run the development server (runs backend server and Vite client concurrently):
   ```bash
   npm run dev
   ```
4. Build and compile the standalone Windows binary:
   ```bash
   # Make sure the application is closed beforehand to avoid EPERM file locks!
   npm run build:exe
   ```

---

## Game Telemetry Settings
To route telemetry from Forza Horizon into the companion:
1. Open Forza Horizon settings.
2. Go to **HUD and Gameplay**.
3. Scroll to the bottom and configure:
   * **Data Out**: `ON`
   * **Data Out IP Address**: `127.0.0.1` (or `localhost`)
   * **Data Out Port**: `5607`
   * **Data Out Format**: `Dash`
