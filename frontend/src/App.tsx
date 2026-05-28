import { useState, useEffect, useRef } from 'react';
import { allLocales } from './locales';
import { Tachometer } from './components/Tachometer';
import { GForceMeter } from './components/GForceMeter';
import { TireTelemetry } from './components/TireTelemetry';
import { TrackMap } from './components/TrackMap';
import { TelemetryStats } from './components/TelemetryStats';
import { SettingsPanel } from './components/SettingsPanel';
import type { TriggerSettings } from './components/SettingsPanel';
import { EngineMetrics } from './components/EngineMetrics';
import { initCarDb, getCarName, updateCarDb } from './utils/carDb';
import { GripMonitor } from './components/GripMonitor';

// Replicating the DataOut interface format
interface TelemetryData {
  IsRaceOn: number;
  TimestampMS: number;
  EngineMaxRpm: number;
  EngineIdleRpm: number;
  CurrentEngineRpm: number;
  AccelerationX: number;
  AccelerationY: number;
  AccelerationZ: number;
  VelocityX: number;
  VelocityY: number;
  VelocityZ: number;
  AngularVelocityX: number;
  AngularVelocityY: number;
  AngularVelocityZ: number;
  Yaw: number;
  Pitch: number;
  Roll: number;
  NormalizedSuspensionTravelFrontLeft: number;
  NormalizedSuspensionTravelFrontRight: number;
  NormalizedSuspensionTravelRearLeft: number;
  NormalizedSuspensionTravelRearRight: number;
  TireSlipRatioFrontLeft: number;
  TireSlipRatioFrontRight: number;
  TireSlipRatioRearLeft: number;
  TireSlipRatioRearRight: number;
  WheelRotationSpeedFrontLeft: number;
  WheelRotationSpeedFrontRight: number;
  WheelRotationSpeedRearLeft: number;
  WheelRotationSpeedRearRight: number;
  WheelOnRumbleStripFrontLeft: number;
  WheelOnRumbleStripFrontRight: number;
  WheelOnRumbleStripRearLeft: number;
  WheelOnRumbleStripRearRight: number;
  WheelInPuddleDepthFrontLeft: number;
  WheelInPuddleDepthFrontRight: number;
  WheelInPuddleDepthRearLeft: number;
  WheelInPuddleDepthRearRight: number;
  SurfaceRumbleFrontLeft: number;
  SurfaceRumbleFrontRight: number;
  SurfaceRumbleRearLeft: number;
  SurfaceRumbleRearRight: number;
  TireSlipAngleFrontLeft: number;
  TireSlipAngleFrontRight: number;
  TireSlipAngleRearLeft: number;
  TireSlipAngleRearRight: number;
  TireCombinedSlipFrontLeft: number;
  TireCombinedSlipFrontRight: number;
  TireCombinedSlipRearLeft: number;
  TireCombinedSlipRearRight: number;
  SuspensionTravelMetersFrontLeft: number;
  SuspensionTravelMetersFrontRight: number;
  SuspensionTravelMetersRearLeft: number;
  SuspensionTravelMetersRearRight: number;
  CarOrdinal: number;
  CarClass: number;
  CarPerformanceIndex: number;
  DrivetrainType: number;
  NumCylinders: number;
  PositionX: number;
  PositionY: number;
  PositionZ: number;
  Speed: number;
  Power: number;
  Torque: number;
  TireTempFrontLeft: number;
  TireTempFrontRight: number;
  TireTempRearLeft: number;
  TireTempRearRight: number;
  Boost: number;
  Fuel: number;
  DistanceTraveled: number;
  BestLap: number;
  LastLap: number;
  CurrentLap: number;
  CurrentRaceTime: number;
  LapNumber: number;
  RacePosition: number;
  Accel: number;
  Brake: number;
  Clutch: number;
  HandBrake: number;
  Gear: number;
  Steer: number;
  NormalizedDrivingLine: number;
  NormalizedAIBrakeDifference: number;
}



const initialData: TelemetryData = {
  IsRaceOn: 0,
  TimestampMS: 0,
  EngineMaxRpm: 8000,
  EngineIdleRpm: 1000,
  CurrentEngineRpm: 0,
  AccelerationX: 0,
  AccelerationY: 0,
  AccelerationZ: 0,
  VelocityX: 0,
  VelocityY: 0,
  VelocityZ: 0,
  AngularVelocityX: 0,
  AngularVelocityY: 0,
  AngularVelocityZ: 0,
  Yaw: 0,
  Pitch: 0,
  Roll: 0,
  NormalizedSuspensionTravelFrontLeft: 0,
  NormalizedSuspensionTravelFrontRight: 0,
  NormalizedSuspensionTravelRearLeft: 0,
  NormalizedSuspensionTravelRearRight: 0,
  TireSlipRatioFrontLeft: 0,
  TireSlipRatioFrontRight: 0,
  TireSlipRatioRearLeft: 0,
  TireSlipRatioRearRight: 0,
  WheelRotationSpeedFrontLeft: 0,
  WheelRotationSpeedFrontRight: 0,
  WheelRotationSpeedRearLeft: 0,
  WheelRotationSpeedRearRight: 0,
  WheelOnRumbleStripFrontLeft: 0,
  WheelOnRumbleStripFrontRight: 0,
  WheelOnRumbleStripRearLeft: 0,
  WheelOnRumbleStripRearRight: 0,
  WheelInPuddleDepthFrontLeft: 0,
  WheelInPuddleDepthFrontRight: 0,
  WheelInPuddleDepthRearLeft: 0,
  WheelInPuddleDepthRearRight: 0,
  SurfaceRumbleFrontLeft: 0,
  SurfaceRumbleFrontRight: 0,
  SurfaceRumbleRearLeft: 0,
  SurfaceRumbleRearRight: 0,
  TireSlipAngleFrontLeft: 0,
  TireSlipAngleFrontRight: 0,
  TireSlipAngleRearLeft: 0,
  TireSlipAngleRearRight: 0,
  TireCombinedSlipFrontLeft: 0,
  TireCombinedSlipFrontRight: 0,
  TireCombinedSlipRearLeft: 0,
  TireCombinedSlipRearRight: 0,
  SuspensionTravelMetersFrontLeft: 0,
  SuspensionTravelMetersFrontRight: 0,
  SuspensionTravelMetersRearLeft: 0,
  SuspensionTravelMetersRearRight: 0,
  CarOrdinal: 0,
  CarClass: 4, // S1
  CarPerformanceIndex: 900,
  DrivetrainType: 2, // AWD
  NumCylinders: 6,
  PositionX: 0,
  PositionY: 0,
  PositionZ: 0,
  Speed: 0,
  Power: 0,
  Torque: 0,
  TireTempFrontLeft: 70,
  TireTempFrontRight: 70,
  TireTempRearLeft: 70,
  TireTempRearRight: 70,
  Boost: 0,
  Fuel: 1.0,
  DistanceTraveled: 0,
  BestLap: 0,
  LastLap: 0,
  CurrentLap: 0,
  CurrentRaceTime: 0,
  LapNumber: 1,
  RacePosition: 1,
  Accel: 0,
  Brake: 0,
  Clutch: 0,
  HandBrake: 0,
  Gear: 11, // Neutral
  Steer: 0,
  NormalizedDrivingLine: 0,
  NormalizedAIBrakeDifference: 0,
};

const rawLanguages = [
  { code: 'az', name: 'Azərbaycanca', flag: 'az' },
  { code: 'sq', name: 'Shqip', flag: 'al' },
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'eu', name: 'Euskara', flag: 'es-pv' },
  { code: 'be', name: 'Беларуская', flag: 'by' },
  { code: 'bg', name: 'Български', flag: 'bg' },
  { code: 'bs', name: 'Bosanski', flag: 'ba' },
  { code: 'br', name: 'Brezhoneg', flag: 'fr' },
  { code: 'cy', name: 'Cymraeg', flag: 'gb-wls' },
  { code: 'hy', name: 'Հայերեն', flag: 'am' },
  { code: 'gl', name: 'Galego', flag: 'es-ga' },
  { code: 'el', name: 'Ελληνικά', flag: 'gr' },
  { code: 'ka', name: 'ქართული', flag: 'ge' },
  { code: 'da', name: 'Dansk', flag: 'dk' },
  { code: 'et', name: 'Eesti', flag: 'ee' },
  { code: 'ga', name: 'Gaeilge', flag: 'ie' },
  { code: 'is', name: 'Íslenska', flag: 'is' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'kk', name: 'Қазақша', flag: 'kz' },
  { code: 'ca', name: 'Català', flag: 'es-ct' },
  { code: 'lv', name: 'Latviešu', flag: 'lv' },
  { code: 'lt', name: 'Lietuvių', flag: 'lt' },
  { code: 'lb', name: 'Lëtzebuergesch', flag: 'lu' },
  { code: 'mk', name: 'Македонски', flag: 'mk' },
  { code: 'mt', name: 'Malti', flag: 'mt' },
  { code: 'md', name: 'Moldovenească', flag: 'md' },
  { code: 'nl', name: 'Nederlands', flag: 'nl' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'no', name: 'Norsk', flag: 'no' },
  { code: 'pl', name: 'Polski', flag: 'pl' },
  { code: 'pt', name: 'Português', flag: 'pt' },
  { code: 'rm', name: 'Rumantsch', flag: 'ch' },
  { code: 'ro', name: 'Română', flag: 'ro' },
  { code: 'sr', name: 'Srpski', flag: 'rs' },
  { code: 'sk', name: 'Slovenčina', flag: 'sk' },
  { code: 'sl', name: 'Slovenščina', flag: 'si' },
  { code: 'tr', name: 'Türkçe', flag: 'tr' },
  { code: 'hu', name: 'Magyar', flag: 'hu' },
  { code: 'uk', name: 'Українська', flag: 'ua' },
  { code: 'fo', name: 'Føroyskt', flag: 'fo' },
  { code: 'fi', name: 'Suomi', flag: 'fi' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'hr', name: 'Hrvatski', flag: 'hr' },
  { code: 'cs', name: 'Čeština', flag: 'cz' },
  { code: 'sv', name: 'Svenska', flag: 'se' },
  { code: 'gd', name: 'Gàidhlig', flag: 'gb-sct' }
];

const languages = [
  rawLanguages.find(l => l.code === 'en')!,
  ...rawLanguages.filter(l => l.code !== 'en').sort((a, b) => a.code.localeCompare(b.code))
];

function App() {
  const [data, setData] = useState<TelemetryData>(initialData);
  const [lang, setLang] = useState<string>(() => {
    const saved = localStorage.getItem('forza_language');
    if (saved === 'ua' || saved === 'uk') return 'uk';
    if (saved && languages.some(l => l.code === saved)) {
      return saved;
    }
    return 'en';
  });

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('forza_language', newLang);
  };

  const t = allLocales[lang]?.app || allLocales['en'].app;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'waiting' | 'mock'>('waiting');
  const [backendDsConnected, setBackendDsConnected] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'stats' | 'settings'>('dashboard');
  const [useMetric, setUseMetric] = useState<boolean>(true);
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [packetRate, setPacketRate] = useState<number>(0);
  const [carCount, setCarCount] = useState<number>(0);

  useEffect(() => {
    const count = initCarDb();
    setCarCount(count);
  }, []);

  const handleUpdateCarDb = async (): Promise<number> => {
    const newCount = await updateCarDb();
    setCarCount(newCount);
    return newCount;
  };

  const [settings, setSettings] = useState<TriggerSettings>(() => {
    const defaults: TriggerSettings = {
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
      gearShiftStrength: 0.8,
      r2Mode: 'full',
    };
    try {
      const saved = localStorage.getItem('forza_dualsense_settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Ignore
    }
    return defaults;
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const socketRef = useRef<WebSocket | null>(null);
  const packetCount = useRef<number>(0);
  const mockIntervalRef = useRef<number | null>(null);

  const updateSettings = (newSettings: TriggerSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('forza_dualsense_settings', JSON.stringify(newSettings));
    } catch (e) {
      // Ignore
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'settings', data: newSettings }));
    }
  };

  // Monitor packet rate
  useEffect(() => {
    const rateInterval = setInterval(() => {
      setPacketRate(packetCount.current);
      packetCount.current = 0;
    }, 1000);
    return () => clearInterval(rateInterval);
  }, []);

  // Handle WebSocket Connection
  useEffect(() => {
    setConnectionStatus('waiting');
    
    // Connect to Node.js backend WebSocket server
    const wsPort = window.location.port === '3000' ? '3002' : window.location.port || '3002';
    const wsUrl = `ws://${window.location.hostname}:${wsPort}`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setConnectionStatus(mockMode ? 'mock' : 'connected');
      // Sync trigger settings to backend upon connection
      socket.send(JSON.stringify({ type: 'settings', data: settingsRef.current }));
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'status') {
            setBackendDsConnected(parsed.dsConnected);
          } else {
            // Ignore telemetry updates from server if we are in mock mode
            if (!mockMode) {
              packetCount.current++;
              setData((prevData) => {
                const newData = parsed as TelemetryData;
                // If game is paused or zeroed out, preserve previous non-zero car metadata
                if (newData.CarOrdinal === 0 && prevData.CarOrdinal !== 0) {
                  return {
                    ...newData,
                    CarOrdinal: prevData.CarOrdinal,
                    CarClass: prevData.CarClass,
                    CarPerformanceIndex: prevData.CarPerformanceIndex,
                    DrivetrainType: prevData.DrivetrainType,
                  };
                }
                return newData;
              });
            }
          }
        }
      } catch (err) {
        console.error('Error parsing websocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Closed');
      setConnectionStatus(mockMode ? 'mock' : 'waiting');
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setConnectionStatus(mockMode ? 'mock' : 'waiting');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [mockMode]);

  // Hook to control mock simulation when mockMode state changes
  useEffect(() => {
    if (mockMode) {
      startMockSimulation();
    } else {
      stopMockSimulation();
    }
    return () => stopMockSimulation();
  }, [mockMode]);

  // Frontend Mock Simulation
  const startMockSimulation = () => {
    let mockTime = 0;
    let angle = 0;
    let lapCount = 1;
    let bestLapTime = 0;
    let currentSpeed = 0;
    let currentRpm = 1000;
    let currentGear = 1;
    let distance = 0;
    let pedalAccel = 0;
    let pedalBrake = 0;
    let steerVal = 0;

    mockIntervalRef.current = window.setInterval(() => {
      mockTime += 0.033; // ~30Hz
      packetCount.current++;

      // Simulate a driving loop
      // Accel, Brake, Gears, Speed, RPM
      const cycle = mockTime % 30; // 30 second loop

      if (cycle < 1) {
        // Neutral engine revving at start
        currentGear = 11;
        pedalAccel = 100 + Math.sin(mockTime * 10) * 155;
        pedalBrake = 0;
        currentRpm = 1000 + (pedalAccel / 255) * 6000;
        currentSpeed = 0;
        steerVal = 0;
      } else if (cycle < 25) {
        // Acceleration and driving
        pedalAccel = 255;
        pedalBrake = 0;

        // Gear shifts
        const speedKmh = currentSpeed * 3.6;
        if (speedKmh < 40) currentGear = 1;
        else if (speedKmh < 80) currentGear = 2;
        else if (speedKmh < 120) currentGear = 3;
        else if (speedKmh < 160) currentGear = 4;
        else if (speedKmh < 200) currentGear = 5;
        else currentGear = 6;

        // RPM simulation based on gear and speed
        const targetRpm = 2000 + ((speedKmh % 45) / 45) * 5500;
        currentRpm = currentRpm * 0.8 + targetRpm * 0.2;

        // Speed increases
        currentSpeed += 0.35 - (currentSpeed * 0.002);
        distance += currentSpeed * 0.033;

        // Steer left and right gently
        steerVal = Math.sin(mockTime * 0.5) * 45;
      } else {
        // Hard braking
        pedalAccel = 0;
        pedalBrake = 255;
        currentGear = 2;
        currentSpeed = Math.max(5, currentSpeed - 1.2);
        currentRpm = Math.max(1200, currentRpm - 250);
        distance += currentSpeed * 0.033;
        steerVal = -30; // turn hard left
      }

      // Map track circular coordinates
      angle += (currentSpeed * 0.0005);
      const radius = 250 + Math.sin(angle * 3) * 60;
      const posX = radius * Math.cos(angle);
      const posZ = radius * Math.sin(angle);
      const yaw = -angle + Math.PI/2;

      // Tire slip when steering fast
      const slideFL = Math.abs(steerVal) > 20 ? 0.8 + Math.random() * 0.4 : Math.random() * 0.1;
      const slideRL = currentRpm > 6500 ? 0.9 + Math.random() * 0.3 : Math.random() * 0.08;

      // Suspension travel bouncy
      const roadBumps = Math.sin(mockTime * 8);
      const travelFL = 0.45 + roadBumps * 0.08 + (pedalBrake / 255) * 0.15;
      const travelFR = 0.45 - roadBumps * 0.08 + (pedalBrake / 255) * 0.15;
      const travelRL = 0.5 + roadBumps * 0.05 - (pedalAccel / 255) * 0.12;
      const travelRR = 0.5 - roadBumps * 0.05 - (pedalAccel / 255) * 0.12;

      // Laps
      if (angle > 2 * Math.PI * lapCount) {
        lapCount++;
        bestLapTime = 72.4 + Math.random() * 2;
      }

      const mockTelemetry: TelemetryData = {
        IsRaceOn: 1,
        TimestampMS: Math.round(mockTime * 1000),
        EngineMaxRpm: 8000,
        EngineIdleRpm: 1000,
        CurrentEngineRpm: currentRpm,
        AccelerationX: (steerVal / 127) * 9.8,
        AccelerationY: 9.8,
        AccelerationZ: pedalAccel > 0 ? 4.5 : -12.0,
        VelocityX: 0,
        VelocityY: 0,
        VelocityZ: currentSpeed,
        AngularVelocityX: 0,
        AngularVelocityY: 0,
        AngularVelocityZ: 0,
        Yaw: yaw,
        Pitch: 0.02,
        Roll: -0.01,
        NormalizedSuspensionTravelFrontLeft: travelFL,
        NormalizedSuspensionTravelFrontRight: travelFR,
        NormalizedSuspensionTravelRearLeft: travelRL,
        NormalizedSuspensionTravelRearRight: travelRR,
        TireSlipRatioFrontLeft: 0,
        TireSlipRatioFrontRight: 0,
        TireSlipRatioRearLeft: 0,
        TireSlipRatioRearRight: 0,
        WheelRotationSpeedFrontLeft: currentSpeed,
        WheelRotationSpeedFrontRight: currentSpeed,
        WheelRotationSpeedRearLeft: currentSpeed,
        WheelRotationSpeedRearRight: currentSpeed,
        WheelOnRumbleStripFrontLeft: Math.random() > 0.95 ? 1 : 0,
        WheelOnRumbleStripFrontRight: 0,
        WheelOnRumbleStripRearLeft: 0,
        WheelOnRumbleStripRearRight: 0,
        WheelInPuddleDepthFrontLeft: 0,
        WheelInPuddleDepthFrontRight: 0,
        WheelInPuddleDepthRearLeft: 0,
        WheelInPuddleDepthRearRight: 0,
        SurfaceRumbleFrontLeft: 0,
        SurfaceRumbleFrontRight: 0,
        SurfaceRumbleRearLeft: 0,
        SurfaceRumbleRearRight: 0,
        TireSlipAngleFrontLeft: steerVal / 100,
        TireSlipAngleFrontRight: steerVal / 100,
        TireSlipAngleRearLeft: 0,
        TireSlipAngleRearRight: 0,
        TireCombinedSlipFrontLeft: slideFL,
        TireCombinedSlipFrontRight: slideFL * 0.9,
        TireCombinedSlipRearLeft: slideRL,
        TireCombinedSlipRearRight: slideRL * 0.95,
        SuspensionTravelMetersFrontLeft: travelFL * 0.3,
        SuspensionTravelMetersFrontRight: travelFR * 0.3,
        SuspensionTravelMetersRearLeft: travelRL * 0.3,
        SuspensionTravelMetersRearRight: travelRR * 0.3,
        CarOrdinal: 1260,
        CarClass: 5, // S2
        CarPerformanceIndex: 998,
        DrivetrainType: 1, // RWD
        NumCylinders: 8,
        PositionX: posX,
        PositionY: 120,
        PositionZ: posZ,
        Speed: currentSpeed,
        Power: currentRpm * 70, // Watt simulation
        Torque: 600 - (currentRpm * 0.04), // Nm simulation
        TireTempFrontLeft: 180 + Math.sin(mockTime) * 15 + (slideFL * 40),
        TireTempFrontRight: 178 - Math.sin(mockTime) * 12,
        TireTempRearLeft: 195 + (slideRL * 45),
        TireTempRearRight: 192,
        Boost: Math.max(0, (currentRpm - 2000) * 0.003),
        Fuel: Math.max(0, 0.98 - mockTime * 0.0002),
        DistanceTraveled: distance,
        BestLap: bestLapTime,
        LastLap: bestLapTime > 0 ? bestLapTime + 0.5 : 0,
        CurrentLap: mockTime % 72.4,
        CurrentRaceTime: mockTime,
        LapNumber: lapCount,
        RacePosition: 2,
        Accel: Math.round(pedalAccel),
        Brake: Math.round(pedalBrake),
        Clutch: 0,
        HandBrake: pedalBrake > 150 ? 255 : 0,
        Gear: currentGear,
        Steer: Math.round(steerVal),
        NormalizedDrivingLine: 0,
        NormalizedAIBrakeDifference: 0,
      };

      setData(mockTelemetry);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'telemetry', data: mockTelemetry }));
      }
    }, 33);
  };

  const stopMockSimulation = () => {
    if (mockIntervalRef.current !== null) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  };

  // Convert steer raw (-127 to 127) to percent
  const getSteerPercent = (rawSteer: number) => {
    const pct = (rawSteer / 127) * 50; // -50% to +50%
    return 50 + pct; // 0% to 100%
  };

  // Drivetrain decoding
  const getDrivetrain = (type: number) => {
    switch (type) {
      case 0: return 'FWD';
      case 1: return 'RWD';
      case 2: return 'AWD';
      default: return 'AWD';
    }
  };

  // Car Class decoding
  const getCarClass = (val: number) => {
    const classes = ['D', 'C', 'B', 'A', 'S1', 'S2', 'X'];
    if (val >= 0 && val < classes.length) {
      return classes[val];
    }
    return 'S1';
  };

  const getCarClassColor = (val: number) => {
    const colors = [
      '#60a5fa', // D (Light Blue)
      '#a78bfa', // C (Purple)
      '#f59e0b', // B (Orange)
      '#ef4444', // A (Red)
      '#ec4899', // S1 (Pink)
      '#8b5cf6', // S2 (Deep purple)
      '#10b981', // X (Emerald)
    ];
    if (val >= 0 && val < colors.length) {
      return colors[val];
    }
    return 'var(--accent-pink)';
  };



  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <nav className="tab-navbar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '1px' }}>
            FORZA <span className="text-neon-pink">HORIZON 6</span> COMPANION
          </h1>
          
          {/* Connection badge */}
          <div className={`status-indicator ${connectionStatus}`}>
            <span className={`status-dot active`} />
            {connectionStatus === 'connected' && `${t.live} (${packetRate} Hz)`}
            {connectionStatus === 'waiting' && t.waitingForGame}
            {connectionStatus === 'mock' && t.mockTelemetry}
          </div>

          {/* DualSense backend status indicator */}
          <div
            className={`status-indicator ${backendDsConnected ? 'connected' : 'waiting'}`}
            style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <span className={`status-dot ${backendDsConnected ? 'active' : ''}`} />
            {backendDsConnected ? t.dsConnected : t.dsNotDetected}
          </div>
        </div>

        {/* Tab options with language selector */}
        <ul className="tab-list" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <li>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              {t.dashboard}
            </button>
          </li>

          <li>
            <button
              onClick={() => setActiveTab('map')}
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            >
              {t.trackMap}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('stats')}
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            >
              {t.performanceLaps}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            >
              {t.settings}
            </button>
          </li>
          {/* Language select dropdown to the right of Settings tab */}
          <li style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
            <div ref={dropdownRef} className="lang-dropdown-container">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="lang-dropdown-trigger"
                type="button"
              >
                {(() => {
                  const currentLangObj = languages.find(l => l.code === lang) || { code: 'en', name: 'Англійська', flag: 'gb' };
                  return (
                    <>
                      <img
                        src={`https://flagcdn.com/w40/${currentLangObj.flag}.png`}
                        alt={currentLangObj.name}
                        className="lang-dropdown-flag"
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {currentLangObj.code}
                      </span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: '4px', display: 'inline-block', width: '10px', textAlign: 'center' }}>
                        {dropdownOpen ? '▲' : '▼'}
                      </span>
                    </>
                  );
                })()}
              </button>
              {dropdownOpen && (
                <ul className="lang-dropdown-menu">
                  {languages.map((l) => (
                    <li key={l.code} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      <button
                        onClick={() => {
                          handleLangChange(l.code);
                          setDropdownOpen(false);
                        }}
                        className={`lang-dropdown-item ${lang === l.code ? 'active' : ''}`}
                        type="button"
                      >
                        <img
                          src={`https://flagcdn.com/w40/${l.flag}.png`}
                          alt={l.name}
                          className="lang-dropdown-flag"
                        />
                        <span style={{ whiteSpace: 'nowrap' }}>{l.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        </ul>

        {/* Configurations */}
        <div className="controls-group">
          {/* Unit Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.imperial}</span>
            <label className="control-toggle">
              <input
                type="checkbox"
                checked={useMetric}
                onChange={() => setUseMetric(!useMetric)}
              />
              <span className="toggle-switch" />
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.metric}</span>
          </div>

          {/* Mock Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.mockMode}</span>
            <label className="control-toggle">
              <input
                type="checkbox"
                checked={mockMode}
                onChange={() => setMockMode(!mockMode)}
              />
              <span className="toggle-switch" />
            </label>
          </div>
        </div>
      </nav>

      {/* Main Tab Render Grid */}
      <main className="dashboard-grid">
        {activeTab === 'dashboard' && (
          <>
            {/* Top Banner: Car Class / PI / Drivetrain / Car ID */}
            <div className="col-12 glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '30px', padding: '12px 24px', marginBottom: '5px' }}>
              <div style={{ display: 'flex', border: '1.5px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ color: '#000000', fontWeight: 800, fontSize: '1.1rem', padding: '2px 12px', display: 'flex', alignItems: 'center', backgroundColor: getCarClassColor(data.CarClass) }} className="text-mono">
                  {getCarClass(data.CarClass)}
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', padding: '2px 12px', display: 'flex', alignItems: 'center' }} className="text-mono">
                  {data.CarPerformanceIndex}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>DRIVETRAIN</span>
                <span className="text-neon-cyan text-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {getDrivetrain(data.DrivetrainType)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px', flexShrink: 0 }}>{t.vehicle}</span>
                <span className="text-neon-cyan text-mono" style={{ fontSize: '1.1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getCarName(data.CarOrdinal) ? `${getCarName(data.CarOrdinal)} (ID: ${data.CarOrdinal})` : data.CarOrdinal ? `${t.unknownCar} (ID: ${data.CarOrdinal})` : t.noCarLoaded}
                </span>
              </div>
            </div>

            {/* Center Dial Dial Gauge */}
            <div className="col-4">
              <Tachometer
                currentRpm={data.CurrentEngineRpm}
                maxRpm={data.EngineMaxRpm}
                idleRpm={data.EngineIdleRpm}
                speed={data.Speed}
                gear={data.Gear}
                useMetric={useMetric}
              />
            </div>

            {/* G Force Radar */}
            <div className="col-4">
              <GForceMeter accelX={data.AccelerationX} accelZ={data.AccelerationZ} />
            </div>

            {/* Controls and Pedals Inputs */}
            <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px', marginBottom: '5px' }}>
                {t.pedalWheelInputs}
              </h3>
              
              {/* Accel Throttle Bar */}
              <div className="pedal-bar-container">
                <div className="pedal-bar-label">
                  <span>{t.throttle}</span>
                  <span className="text-neon-green text-mono">{Math.round((data.Accel / 255) * 100)}%</span>
                </div>
                <div className="pedal-bar-bg">
                  <div className="pedal-bar-fill pedal-bar-throttle" style={{ width: `${(data.Accel / 255) * 100}%` }} />
                </div>
              </div>

              {/* Brake Bar */}
              <div className="pedal-bar-container">
                <div className="pedal-bar-label">
                  <span>{t.brake}</span>
                  <span className="text-neon-pink text-mono">{Math.round((data.Brake / 255) * 100)}%</span>
                </div>
                <div className="pedal-bar-bg">
                  <div className="pedal-bar-fill pedal-bar-brake" style={{ width: `${(data.Brake / 255) * 100}%` }} />
                </div>
              </div>

              {/* Clutch Bar */}
              <div className="pedal-bar-container">
                <div className="pedal-bar-label">
                  <span>{t.clutch}</span>
                  <span className="text-neon-cyan text-mono">{Math.round((data.Clutch / 255) * 100)}%</span>
                </div>
                <div className="pedal-bar-bg">
                  <div className="pedal-bar-fill pedal-bar-clutch" style={{ width: `${(data.Clutch / 255) * 100}%` }} />
                </div>
              </div>

              {/* Handbrake Bar */}
              <div className="pedal-bar-container">
                <div className="pedal-bar-label">
                  <span>{t.handbrake}</span>
                  <span style={{ color: 'var(--accent-orange)' }} className="text-mono">{Math.round((data.HandBrake / 255) * 100)}%</span>
                </div>
                <div className="pedal-bar-bg">
                  <div className="pedal-bar-fill pedal-bar-handbrake" style={{ width: `${(data.HandBrake / 255) * 100}%` }} />
                </div>
              </div>

              {/* Steering scale bar */}
              <div className="steer-indicator-container" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span>{t.steeringWheel}</span>
                  <span className="text-neon-cyan text-mono">
                    {data.Steer > 0 ? `R ${Math.round((data.Steer/127)*100)}%` : data.Steer < 0 ? `L ${Math.round(Math.abs(data.Steer/127)*100)}%` : t.centered}
                  </span>
                </div>
                <div className="steer-track">
                  <div className="steer-center" />
                  <div className="steer-pointer" style={{ left: `${getSteerPercent(data.Steer)}%` }} />
                </div>
              </div>
            </div>

            {/* Row 2: Tires & Suspension, Engine metrics, Grip Monitor (col-4 each) */}
            <div className="col-4">
              <TireTelemetry
                tempFL={data.TireTempFrontLeft}
                tempFR={data.TireTempFrontRight}
                tempRL={data.TireTempRearLeft}
                tempRR={data.TireTempRearRight}
                slipFL={data.TireCombinedSlipFrontLeft}
                slipFR={data.TireCombinedSlipFrontRight}
                slipRL={data.TireCombinedSlipRearLeft}
                slipRR={data.TireCombinedSlipRearRight}
                suspFL={data.NormalizedSuspensionTravelFrontLeft}
                suspFR={data.NormalizedSuspensionTravelFrontRight}
                suspRL={data.NormalizedSuspensionTravelRearLeft}
                suspRR={data.NormalizedSuspensionTravelRearRight}
                useMetric={useMetric}
                lang={lang}
              />
            </div>

            <div className="col-4">
              <EngineMetrics
                power={data.Power}
                torque={data.Torque}
                boost={data.Boost}
                useMetric={useMetric}
                lang={lang}
              />
            </div>

            <div className="col-4">
              <GripMonitor
                slipFL={data.TireCombinedSlipFrontLeft}
                slipFR={data.TireCombinedSlipFrontRight}
                slipRL={data.TireCombinedSlipRearLeft}
                slipRR={data.TireCombinedSlipRearRight}
                lang={lang}
              />
            </div>
          </>
        )}

        {activeTab === 'map' && (
          <div className="col-12">
            <TrackMap
              posX={data.PositionX}
              posZ={data.PositionZ}
              yaw={data.Yaw}
              isRaceOn={data.IsRaceOn}
              lang={lang}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="col-12">
            <TelemetryStats
              power={data.Power}
              torque={data.Torque}
              boost={data.Boost}
              fuel={data.Fuel}
              distanceTraveled={data.DistanceTraveled}
              bestLap={data.BestLap}
              lastLap={data.LastLap}
              currentLap={data.CurrentLap}
              currentRaceTime={data.CurrentRaceTime}
              lapNumber={data.LapNumber}
              racePosition={data.RacePosition}
              carClass={data.CarClass}
              carPerformanceIndex={data.CarPerformanceIndex}
              drivetrainType={data.DrivetrainType}
              useMetric={useMetric}
              lang={lang}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={updateSettings}
            carCount={carCount}
            onUpdateCarDb={handleUpdateCarDb}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}

export default App;
