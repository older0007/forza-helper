# Developer Guide & Future Development Roadmap

This guide documents the design choices, localization pipelines, and future features list of the Forza Horizon Companion project to facilitate future AI agent and developer interactions.

---

## Technical Stack & Architecture

### Backend (`server.js`)
* **DualSense Controller Driver**: Uses `dualsense-ts` to interact with the PS5 controller over USB (relies on raw hid access via `node-hid`).
* **UDP Server**: Listens on port `5607` for Forza Horizon telemetry packets using the Node `dgram` library, parsing binary floats directly.
* **WebSocket Server**: Uses `ws` to broadcast incoming telemetry state to the frontend dashboard and receive adaptive trigger settings changes from the user.
* **Static File Server**: A custom lightweight HTTP listener serving the React build bundle located in `frontend/dist/` on port `3002`.
* **System Tray Service**: Powered by `systray2` (written in Go), creating a tray lifecycle and native context menu.

### Frontend (`frontend/`)
* **Framework**: React 19 + TypeScript + Vite.
* **Styling**: Modern, responsive CSS with glassmorphic blur filters and neon color tokens.
* **Performance Optimization**: 3D-like circular gauges and stats update at 30-60Hz with zero frame drops.

---

## Executable Customization (Post-Build)

When the project is packaged into `dist/forza-companion.exe` using `pkg`, the binary naturally inherits default Node.js metadata (e.g. "Node.js JavaScript Runtime") and the default Node.js executable icon.

To customize the file metadata and icon, the build pipeline runs [scripts/patch-exe.js](file:///c:/Projects/LevelUp/forza/scripts/patch-exe.js) using the `resedit` library. This script:
- Replaces the binary file icon with [logo.ico](file:///c:/Projects/LevelUp/forza/logo.ico).
- Updates the `VersionInfo` fields:
  - **File Description**: `Forza Horizon 6 Companion + Dualsense Support`
  - **FileVersion** / **ProductVersion**: Inherits the exact version from `package.json`.
  - **LegalCopyright**: `older0007`
  - **CompanyName**: `older0007`
  - **ProductName**: `Forza Horizon 6 Companion`

This script executes automatically as the final step of `npm run build:exe`.

---

## Localization Pipeline

The app uses a centralized translation module that bundles all translation keys at compile time.

### Adding a New Language
1. Create a `{lang_code}.json` file in `frontend/src/locales/` following the `en.json` keys template.
2. Run the `generate_index_ts.py` scratch script:
   ```bash
   python C:\Users\older\.gemini\antigravity\brain\9d705761-180f-44f4-a3bb-7baf769fe625\scratch\generate_index_ts.py
   ```
   This updates [locales/index.ts](file:///c:/Projects/LevelUp/forza/frontend/src/locales/index.ts) with the new imports automatically.
3. Register the new language inside the `rawLanguages` array in [App.tsx](file:///c:/Projects/LevelUp/forza/frontend/src/App.tsx):
   ```typescript
   { code: 'lang_code', name: 'NativeLanguageName', flag: 'country_flag_code_for_cdn' }
   ```
4. Build the application (`npm run build`). The JSON keys will automatically bundle into the main JS asset.

---

## Layout Shift Prevention Standards
To maintain a premium feel, these styling patterns must be followed:
1. **Vertical Alignment**: Containers for dropdown triggers should use `vertical-align: middle` to prevent baseline shifting.
2. **Scrollbar layout shift**: Apply `scrollbar-gutter: stable` to scrollable containers or `:root` to ensure scrollbar toggling does not cause horizontal layout shifts.
3. **Fixed Width Icons**: Icon wrappers (such as caret arrows `▲` / `▼`) must have a fixed width (`width: 10px` or similar) to ensure the container size doesn't stretch during state changes.

---

## Future Feature Roadmap (Ideas for Next Interactions)

Here are the suggested features for subsequent iterations:

### 1. Advanced Telemetry Recording & Analysis
* **Lap Comparisons**: Allow users to save telemetry traces (speed, gears, throttle/brake inputs) for specific laps and overlay them in graphs to compare performance.
* **CSV Export**: Export recorded telemetry lines into CSV format for parsing in external telemetry tools (e.g. Motec).

### 2. Custom Trigger Profiles
* **Car-Specific Feedback**: Allow the user to save distinct adaptive trigger configurations per vehicle ordinal. When the companion detects a car ordinal change, it automatically loads the associated trigger profile.
* **Terrain Adaptations**: Vibrate triggers dynamically when the vehicle drives over gravel, grass, or water puddles using the `SurfaceRumble` telemetry channels.

### 3. Tray and Desktop Enhancements
* **Auto-Start with Windows**: Add a setting in the settings panel to register a registry key or startup shortcut to launch the companion when Windows boots.
* **Telemetry Audio Alerts**: Implement optional vocal syntheses or bell chimes when a lap record is broken or when fuel falls below 10%.
