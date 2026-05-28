import React from 'react';
import { allLocales } from '../locales';

interface TelemetryStatsProps {
  power: number; // Watts
  torque: number; // Nm
  boost: number; // psi or ratio?
  fuel: number;
  distanceTraveled: number; // meters
  bestLap: number; // seconds
  lastLap: number; // seconds
  currentLap: number; // seconds
  currentRaceTime: number; // seconds
  lapNumber: number;
  racePosition: number;
  carClass: number; // 0-7? (D, C, B, A, S1, S2, X)
  carPerformanceIndex: number; // 100-999
  drivetrainType: number; // 0 = FWD, 1 = RWD, 2 = AWD
  useMetric: boolean;
  lang: string;
}



export const TelemetryStats: React.FC<TelemetryStatsProps> = ({
  power = 0,
  torque = 0,
  boost = 0,
  fuel = 0,
  distanceTraveled = 0,
  bestLap = 0,
  lastLap = 0,
  currentLap = 0,
  currentRaceTime = 0,
  lapNumber = 0,
  racePosition = 0,
  carClass = 0,
  carPerformanceIndex = 0,
  drivetrainType = 2,
  useMetric = true,
  lang = 'en',
}) => {
  const t = allLocales[lang]?.stats || allLocales['en'].stats;

  // Conversions clamped to minimum of 0
  // Watts to Horsepower: 1 HP = 745.7 W
  const hp = Math.max(0, Math.round(power / 745.7));
  // Nm to Ft-lbs: 1 ft-lb = 1.3558 Nm (or Nm * 0.73756)
  const displayTorque = Math.max(0, Math.round(useMetric ? torque : torque * 0.73756));
  const torqueUnit = useMetric ? 'Nm' : 'FT-LB';
  // Boost pressure (convert to PSI)
  const displayBoost = Math.max(0, parseFloat((boost * 0.145038).toFixed(1)));

  // Distance (meters to km or miles)
  const displayDistance = useMetric 
    ? (distanceTraveled / 1000).toFixed(2) + ' KM' 
    : (distanceTraveled * 0.000621371).toFixed(2) + ' MI';

  // Format times (seconds to mm:ss.fff)
  const formatTime = (timeSec: number) => {
    if (timeSec <= 0) return '--:--.---';
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    const ms = Math.floor((timeSec % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
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

  // Car Class decoding (standard Forza classes: 0=D, 1=C, 2=B, 3=A, 4=S1, 5=S2, 6=X)
  const getCarClass = (val: number) => {
    const classes = ['D', 'C', 'B', 'A', 'S1', 'S2', 'X'];
    if (val >= 0 && val < classes.length) {
      return classes[val];
    }
    return 'S1'; // Default / Fallback
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

  const classLetter = getCarClass(carClass);
  const classColor = getCarClassColor(carClass);

  return (
    <div style={styles.container}>
      {/* Top Banner: Car Class & Performance Index */}
      <div style={styles.banner} className="glass-panel">
        <div style={styles.carBadge}>
          <div style={{ ...styles.classBox, backgroundColor: classColor }} className="text-mono">
            {classLetter}
          </div>
          <div style={styles.piBox} className="text-mono">
            {carPerformanceIndex}
          </div>
        </div>
        <div style={styles.bannerStat}>
          <div style={styles.bannerLabel}>{t.drivetrain}</div>
          <div style={styles.bannerValue} className="text-neon-cyan text-mono">
            {getDrivetrain(drivetrainType)}
          </div>
        </div>
        <div style={styles.bannerStat}>
          <div style={styles.bannerLabel}>{t.distance}</div>
          <div style={styles.bannerValue} className="text-mono">
            {displayDistance}
          </div>
        </div>
        <div style={styles.bannerStat}>
          <div style={styles.bannerLabel}>{t.fuelLevel}</div>
          <div style={styles.bannerValue} className="text-neon-green text-mono">
            {Math.round(fuel * 100)}%
          </div>
        </div>
      </div>

      {/* Grid of stats */}
      <div style={styles.statsGrid}>
        {/* Engine Card */}
        <div style={styles.card} className="glass-panel">
          <h4 style={styles.cardTitle}>{t.engineMetrics}</h4>
          <div style={styles.cardContent}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.horsepower}</span>
              <span style={styles.statVal} className="text-neon-pink text-mono">{hp} <span style={styles.unit}>HP</span></span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.torque}</span>
              <span style={styles.statVal} className="text-mono">{displayTorque} <span style={styles.unit}>{torqueUnit}</span></span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.boostPressure}</span>
              <span style={styles.statVal} className="text-neon-cyan text-mono">{displayBoost.toFixed(1)} <span style={styles.unit}>PSI</span></span>
            </div>
          </div>
        </div>

        {/* Lap Times Card */}
        <div style={styles.card} className="glass-panel">
          <h4 style={styles.cardTitle}>{t.timingPosition}</h4>
          <div style={styles.cardContent}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.racePosition}</span>
              <span style={styles.statVal} className="text-neon-green text-mono">#{racePosition || 1}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.currentLap}</span>
              <span style={styles.statVal} className="text-mono">#{lapNumber}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.currentLapTime}</span>
              <span style={styles.statVal} className="text-mono">{formatTime(currentLap)}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.totalRaceTime}</span>
              <span style={styles.statVal} className="text-mono">{formatTime(currentRaceTime)}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.lastLapTime}</span>
              <span style={styles.statVal} className="text-mono">{formatTime(lastLap)}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>{t.bestLapTime}</span>
              <span style={styles.statVal} className="text-neon-cyan text-mono">{formatTime(bestLap)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    height: '100%',
  },
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  carBadge: {
    display: 'flex',
    border: '1.5px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  classBox: {
    color: '#000000',
    fontWeight: 800,
    fontSize: '1.2rem',
    padding: '4px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  piBox: {
    background: 'rgba(0, 0, 0, 0.4)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '1.2rem',
    padding: '4px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  bannerStat: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  bannerLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
    fontWeight: 600,
    marginBottom: '2px',
  },
  bannerValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
    flexGrow: 1,
  },
  card: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    marginBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    justifyContent: 'center',
    flexGrow: 1,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  statVal: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  unit: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
};

// Add media queries helper (CSS handles this, but grid layout handles it in layout wrapper)
const injectResponsiveStyles = () => {
  if (typeof window !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media (min-width: 768px) {
        .stats-grid-responsive {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }
};
injectResponsiveStyles();
