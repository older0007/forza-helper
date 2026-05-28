const path = require('path');
const os = require('os');

// Force pkg to load node-hid native addon from the physical disk next to the exe
try {
  const Module = require('module');
  const originalLoad = Module._load;
  
  Module._load = function (request, parent, isMain) {
    if (request === 'pkg-prebuilds/bindings' || request.endsWith('pkg-prebuilds/bindings') || request.endsWith('pkg-prebuilds/bindings.js')) {
      return function (basePath, options) {
        if (process.pkg) {
          const exeDir = path.dirname(process.execPath);
          const platform = os.platform();
          const arch = os.arch();
          const name = options.name;
          const napi_ver = (options.napi_versions && options.napi_versions[0]) || 4;
          const prebuildName = `${name}-${platform}-${arch}/node-napi-v${napi_ver}.node`;
          const physicalPath = path.join(exeDir, 'prebuilds', prebuildName);
          
          console.log(`[DualSense Bridge] Intercepted require. Loading native addon: ${physicalPath}`);
          try {
            return originalLoad(physicalPath, parent, isMain);
          } catch (err) {
            console.error(`[DualSense Bridge] Failed to load native addon:`, err);
            throw err;
          }
        }
        const bindingsLoader = originalLoad(request, parent, isMain);
        return bindingsLoader(basePath, options);
      };
    }
    return originalLoad(request, parent, isMain);
  };
} catch (e) {
  console.error('[DualSense Bridge] Failed to inject Module._load hook:', e);
}

const { WebSocketServer } = require('ws');
const ForzaServer = require('forza-horizon').default;
const { DualsenseManager, TriggerEffect } = require('dualsense-ts');
const nodeHid = require('node-hid');

// Get ports from CLI arguments or default values
const udpPort = parseInt(process.argv[2], 10) || 5607;
const wsPort = parseInt(process.argv[3], 10) || 3002;

console.log('==================================================');
console.log('   FORZA HORIZON TELEMETRY SERVER INITIALIZING   ');
console.log('==================================================');
console.log(`- Target UDP Port (for game): ${udpPort}`);
console.log(`- WebSocket Broadcast Port  : ${wsPort}`);

// 1. Initialize DualSense Controller Manager (Native Node.js)
let dsManager = null;
let dsConnected = false;
let prevEffects = { l2: '', r2: '' };

let prevGear = 0;
let shiftActiveUntil = 0;

// Trigger feedback settings (received from client)
let triggerSettings = {
  absStrength: 1.0,
  tcStrength: 1.0,
  resistanceStrength: 1.0,
  
  absMinSpeedKmh: 15,
  absFreq: 24,
  
  enableRevLimiter: true,
  revLimitRatio: 0.97,
  revLimitFreq: 30,
  
  enableGearShift: true,
  gearShiftDurationMs: 120,
  gearShiftStrength: 0.8
};

try {
  dsManager = new DualsenseManager();
  console.log('[DualSense] Manager initialized. Searching for controller...');

  dsManager.on('change', () => {
    const connected = dsManager.controllers.length > 0 && dsManager.controllers[0].connection.active;
    if (connected !== dsConnected) {
      dsConnected = connected;
      console.log(`[DualSense] Connection state changed: ${connected ? 'CONNECTED 🎮' : 'DISCONNECTED ❌'}`);
      if (connected) {
        prevEffects = { l2: '', r2: '' }; // clear cache on reconnect
      }
      // Broadcast state update to all client connections
      const payload = JSON.stringify({ type: 'status', dsConnected });
      for (const client of clients) {
        if (client.readyState === 1) { // WebSocket.OPEN
          try {
            client.send(payload);
          } catch (e) {
            console.error('[WebSocket] Broadcast error:', e);
          }
        }
      }
    }
  });
} catch (err) {
  console.error('[DualSense] Failed to initialize DualSense manager:', err);
}

// Helper to set trigger effects
const updateDualSenseTriggers = (ds, telemetry) => {
  if (!ds || !ds.connection || !ds.connection.active) return;

  const brakeInput = telemetry.Brake; // 0 to 255
  const accelInput = telemetry.Accel; // 0 to 255
  const speedKmh = telemetry.Speed * 3.6;
  const gear = telemetry.Gear;
  const now = Date.now();

  // 1. Gear Shift detection & active timer
  // Forza gears: 0 = Reverse, 11 = Neutral, 1-10 = Forward gears.
  if (prevGear > 0 && gear > 0 && gear !== prevGear && telemetry.Speed > 3.0) {
    shiftActiveUntil = now + triggerSettings.gearShiftDurationMs;
  }
  prevGear = gear;

  const isShiftThumpActive = triggerSettings.enableGearShift && now < shiftActiveUntil;

  // 2. L2 Effect decision (ABS vs Normal Braking vs Gear Shift Thump)
  let targetL2Effect = 'none';
  let targetL2Params = null;

  if (isShiftThumpActive && brakeInput > 15) {
    // Gear shift thump on brake trigger if braking
    targetL2Effect = 'vibration';
    targetL2Params = {
      effect: TriggerEffect.Vibration,
      position: 0.1,
      amplitude: triggerSettings.gearShiftStrength,
      frequency: 10
    };
  } else {
    // ABS Check
    const isAbsTriggered = brakeInput > 15 && speedKmh >= triggerSettings.absMinSpeedKmh && (
      telemetry.TireCombinedSlipFrontLeft > 0.65 || 
      telemetry.TireCombinedSlipFrontRight > 0.65
    );

    if (isAbsTriggered) {
      targetL2Effect = 'vibration';
      targetL2Params = {
        effect: TriggerEffect.Vibration,
        position: 0.1, // starts vibrating from 10% pull
        amplitude: 0.8 * triggerSettings.absStrength, // strong vibration
        frequency: triggerSettings.absFreq
      };
    } else if (brakeInput > 10) {
      // Normal braking resistance - gets firmer as you brake harder
      targetL2Effect = 'feedback';
      const strength = Math.min(1.0, Math.max(0.0, (0.4 + (brakeInput / 255) * 0.4) * triggerSettings.resistanceStrength));
      targetL2Params = {
        effect: TriggerEffect.Feedback,
        position: 0.1,
        strength: strength
      };
    } else {
      // No braking - zero resistance
      targetL2Effect = 'off';
    }
  }

  // Apply L2 effect if changed
  const cacheKeyL2 = targetL2Effect + '_' + (targetL2Params ? JSON.stringify(targetL2Params) : '');
  if (prevEffects.l2 !== cacheKeyL2) {
    prevEffects.l2 = cacheKeyL2;
    try {
      if (targetL2Effect === 'off') {
        ds.left.trigger.feedback.set({ effect: TriggerEffect.Off });
      } else {
        ds.left.trigger.feedback.set(targetL2Params);
      }
    } catch (e) {
      console.error("[DualSense] Error setting L2 adaptive trigger:", e);
    }
  }

  // 3. R2 Effect decision (Rev Limiter vs Traction Control vs Normal Acceleration vs Gear Shift Thump)
  let targetR2Effect = 'none';
  let targetR2Params = null;

  if (isShiftThumpActive && accelInput > 15) {
    // Gear shift thump on accelerator trigger if accelerating
    targetR2Effect = 'vibration';
    targetR2Params = {
      effect: TriggerEffect.Vibration,
      position: 0.1,
      amplitude: triggerSettings.gearShiftStrength,
      frequency: 10
    };
  } else {
    // Check Rev Limiter
    const maxRpm = telemetry.EngineMaxRpm;
    const currentRpm = telemetry.CurrentEngineRpm;
    const rpmRatio = maxRpm > 0 ? (currentRpm / maxRpm) : 0;
    const isRevLimitTriggered = triggerSettings.enableRevLimiter && accelInput > 15 && rpmRatio >= triggerSettings.revLimitRatio;

    if (isRevLimitTriggered) {
      // Rev limiter vibration
      targetR2Effect = 'vibration';
      targetR2Params = {
        effect: TriggerEffect.Vibration,
        position: 0.1,
        amplitude: 0.7 * triggerSettings.tcStrength,
        frequency: triggerSettings.revLimitFreq
      };
    } else {
      // Traction Control Check
      const isTractionLost = accelInput > 15 && (
        telemetry.TireCombinedSlipRearLeft > 0.70 || 
        telemetry.TireCombinedSlipRearRight > 0.70
      );

      if (isTractionLost) {
        // Traction loss: trigger vibrates rapidly to simulate wheelspin / tire chatter
        targetR2Effect = 'vibration';
        targetR2Params = {
          effect: TriggerEffect.Vibration,
          position: 0.1,
          amplitude: 0.6 * triggerSettings.tcStrength,
          frequency: 14 // 14Hz slip chatter
        };
      } else if (accelInput > 10) {
        // Normal accelerator tension - continuous light resistance simulating pedal weight
        targetR2Effect = 'feedback';
        const strength = Math.min(1.0, Math.max(0.0, 0.4 * triggerSettings.resistanceStrength));
        targetR2Params = {
          effect: TriggerEffect.Feedback,
          position: 0.1,
          strength: strength
        };
      } else {
        // Idle - zero resistance
        targetR2Effect = 'off';
      }
    }
  }

  // Apply R2 effect if changed
  const cacheKeyR2 = targetR2Effect + '_' + (targetR2Params ? JSON.stringify(targetR2Params) : '');
  if (prevEffects.r2 !== cacheKeyR2) {
    prevEffects.r2 = cacheKeyR2;
    try {
      if (targetR2Effect === 'off') {
        ds.right.trigger.feedback.set({ effect: TriggerEffect.Off });
      } else {
        ds.right.trigger.feedback.set(targetR2Params);
      }
    } catch (e) {
      console.error("[DualSense] Error setting R2 adaptive trigger:", e);
    }
  }
};

// 2. Initialize HTTP Server to serve static dashboard assets
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');
const SysTray = require('systray2').default;

const server = http.createServer((req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  url = url.split('?')[0].split('#')[0];
  
  const filePath = path.join(__dirname, 'frontend', 'dist', url);
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const indexHtmlPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
        fs.readFile(indexHtmlPath, (err2, indexContent) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocketServer({ server });
const clients = new Set();

// Graceful shutdown helper
const cleanupAndExit = async () => {
  console.log('\n[System] Gracefully shutting down...');
  if (dsManager) {
    try {
      dsManager.dispose();
      console.log('[DualSense] Manager disposed.');
    } catch (e) {
      console.error('[DualSense] Error disposing manager:', e);
    }
  }
  
  if (systray) {
    try {
      await systray.kill(false);
      console.log('[System Tray] Closed.');
    } catch (e) {
      console.error('[System Tray] Error killing tray process:', e);
    }
  }

  wss.close(() => {
    console.log('[System] WebSocket server closed.');
    process.exit(0);
  });
};

// Initialize System Tray
let systray = null;
try {
  systray = new SysTray({
    menu: {
      icon: path.join(__dirname, 'logo.ico'),
      title: 'Forza Horizon Companion',
      tooltip: 'Forza Horizon Companion',
      items: [
        {
          title: 'Open Dashboard',
          tooltip: 'Open the dashboard in your default browser',
          checked: false,
          enabled: true,
          click: () => {
            console.log('[System] Opening dashboard...');
            exec(`start http://localhost:${wsPort}`);
          }
        },
        SysTray.separator,
        {
          title: 'Exit',
          tooltip: 'Quit the companion app',
          checked: false,
          enabled: true,
          click: () => {
            cleanupAndExit();
          }
        }
      ]
    },
    debug: false,
    copyDir: true
  });

  systray.onClick(action => {
    if (action.item.click != null) {
      action.item.click();
    }
  });

  systray.ready().then(() => {
    console.log('[System Tray] Icon initialized successfully.');
    systray.onError(err => {
      console.error('[System Tray] Error:', err);
    });
  }).catch(err => {
    console.error('[System Tray] Failed to initialize ready state:', err);
  });
} catch (err) {
  console.error('[System Tray] Failed to initialize system tray:', err);
}


wss.on('connection', (ws) => {
  console.log(`[WebSocket] Client connected (Total: ${wss.clients.size})`);
  clients.add(ws);

  // Send initial DualSense connection state to the new client
  ws.send(JSON.stringify({ type: 'status', dsConnected }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      // If client sends mock telemetry, apply to DualSense triggers for local testing
      if (parsed && parsed.type === 'telemetry' && parsed.data) {
        if (dsManager && dsConnected && dsManager.controllers.length > 0) {
          updateDualSenseTriggers(dsManager.controllers[0], parsed.data);
        }
      }
      // If client sends trigger settings
      if (parsed && parsed.type === 'settings' && parsed.data) {
        triggerSettings = {
          absStrength: typeof parsed.data.absStrength === 'number' ? parsed.data.absStrength : 1.0,
          tcStrength: typeof parsed.data.tcStrength === 'number' ? parsed.data.tcStrength : 1.0,
          resistanceStrength: typeof parsed.data.resistanceStrength === 'number' ? parsed.data.resistanceStrength : 1.0,
          
          absMinSpeedKmh: typeof parsed.data.absMinSpeedKmh === 'number' ? parsed.data.absMinSpeedKmh : 15,
          absFreq: typeof parsed.data.absFreq === 'number' ? parsed.data.absFreq : 24,
          
          enableRevLimiter: typeof parsed.data.enableRevLimiter === 'boolean' ? parsed.data.enableRevLimiter : true,
          revLimitRatio: typeof parsed.data.revLimitRatio === 'number' ? parsed.data.revLimitRatio : 0.97,
          revLimitFreq: typeof parsed.data.revLimitFreq === 'number' ? parsed.data.revLimitFreq : 30,
          
          enableGearShift: typeof parsed.data.enableGearShift === 'boolean' ? parsed.data.enableGearShift : true,
          gearShiftDurationMs: typeof parsed.data.gearShiftDurationMs === 'number' ? parsed.data.gearShiftDurationMs : 120,
          gearShiftStrength: typeof parsed.data.gearShiftStrength === 'number' ? parsed.data.gearShiftStrength : 0.8
        };
        console.log('[DualSense] Settings updated:', triggerSettings);
        // Reset effects cache to force immediate settings application
        prevEffects = { l2: '', r2: '' };
      }
    } catch (e) {
      // Ignore non-json or other messages
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected (Total: ${wss.clients.size})`);
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Client error:', err);
    clients.delete(ws);
  });
});

// 3. Initialize Forza UDP Server
try {
  const forzaServer = new ForzaServer(udpPort);

  forzaServer.on('listening', () => {
    console.log(`[UDP Server] Listening for Forza UDP data on port ${udpPort}...`);
    console.log('>> In Forza settings, set:');
    console.log(`   - Data Out = ON`);
    console.log(`   - Data Out IP Address = 127.0.0.1 (or local server IP)`);
    console.log(`   - Data Out IP Port = ${udpPort}`);
    console.log(`   - Data Out Format = Car Dash`);
  });

  forzaServer.on('data', (parsedData) => {
    // Broadcast data to all connected WebSocket clients
    if (clients.size > 0) {
      const payload = JSON.stringify(parsedData);
      for (const client of clients) {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(payload);
        }
      }
    }

    // Update DualSense triggers directly in background
    if (dsManager && dsConnected && dsManager.controllers.length > 0) {
      updateDualSenseTriggers(dsManager.controllers[0], parsedData);
    }
  });

  forzaServer.on('error', (err) => {
    console.error('[UDP Server] Error:', err);
  });
  // Bind the UDP socket
  forzaServer.bind();

} catch (err) {
  console.error('[System] Failed to start UDP Telemetry server:', err);
}

// Bind the HTTP server
server.listen(wsPort, () => {
  console.log(`[HTTP Server] Web Dashboard listening on http://localhost:${wsPort}`);
  console.log(`[HTTP Server] WebSocket server attached.`);
  console.log(`[System] Running in system tray. Right-click tray icon to manage.`);
});

// Handle termination signals
process.on('SIGINT', () => {
  cleanupAndExit();
});
process.on('SIGTERM', () => {
  cleanupAndExit();
});

