const { WebSocketServer } = require('ws');
const ForzaServer = require('forza-horizon').default;
const { DualsenseManager, TriggerEffect } = require('dualsense-ts');

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

// Trigger feedback intensity settings (received from client)
let triggerSettings = {
  absStrength: 1.0,
  tcStrength: 1.0,
  resistanceStrength: 1.0
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
  
  // 1. ABS (Anti-lock Braking System) simulation on Left Trigger (L2)
  // Check if braking and front tires are locking up / sliding (combined slip exceeds 0.65)
  const isAbsTriggered = brakeInput > 15 && (
    telemetry.TireCombinedSlipFrontLeft > 0.65 || 
    telemetry.TireCombinedSlipFrontRight > 0.65
  );

  let targetL2Effect = 'none';
  let targetL2Params = null;

  if (isAbsTriggered) {
    targetL2Effect = 'vibration';
    targetL2Params = {
      effect: TriggerEffect.Vibration,
      position: 0.1, // starts vibrating from 10% pull
      amplitude: 0.8 * triggerSettings.absStrength, // strong vibration
      frequency: 24  // 24Hz fast pulse
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

  // 2. Traction Control / Wheelspin simulation on Right Trigger (R2)
  // Check if accelerating and rear tires are losing grip (combined slip exceeds 0.70)
  const isTractionLost = accelInput > 15 && (
    telemetry.TireCombinedSlipRearLeft > 0.70 || 
    telemetry.TireCombinedSlipRearRight > 0.70
  );

  let targetR2Effect = 'none';
  let targetR2Params = null;

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

// 2. Initialize WebSocket Server
const wss = new WebSocketServer({ port: wsPort });
const clients = new Set();

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
          resistanceStrength: typeof parsed.data.resistanceStrength === 'number' ? parsed.data.resistanceStrength : 1.0
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

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n[System] Gracefully shutting down...');
  if (dsManager) {
    dsManager.dispose();
  }
  wss.close(() => {
    console.log('[System] WebSocket server closed.');
    process.exit(0);
  });
});
