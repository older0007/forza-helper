import React, { useState, useEffect } from 'react';

interface EngineMetricsProps {
  power: number; // Watts
  torque: number; // Nm
  boost: number; // raw value
  useMetric: boolean;
}

export const EngineMetrics: React.FC<EngineMetricsProps> = ({
  power = 0,
  torque = 0,
  boost = 0,
  useMetric = true,
}) => {
  const [peakPower, setPeakPower] = useState(0);
  const [peakTorque, setPeakTorque] = useState(0);
  const [peakBoost, setPeakBoost] = useState(0);

  // Conversions clamped to minimum of 0
  const hp = Math.max(0, Math.round(power / 745.7));
  const displayTorque = Math.max(0, Math.round(useMetric ? torque : torque * 0.73756));
  const torqueUnit = useMetric ? 'Nm' : 'FT-LB';
  // Boost pressure (Forza boost is in Pascals/relative, convert to PSI)
  const displayBoost = Math.max(0, parseFloat((boost * 0.145038).toFixed(1)));

  // Update Peaks
  useEffect(() => {
    if (hp > peakPower) {
      setPeakPower(hp);
    }
  }, [hp, peakPower]);

  useEffect(() => {
    if (displayTorque > peakTorque) {
      setPeakTorque(displayTorque);
    }
  }, [displayTorque, peakTorque]);

  useEffect(() => {
    if (displayBoost > peakBoost) {
      setPeakBoost(displayBoost);
    }
  }, [displayBoost, peakBoost]);

  const handleReset = () => {
    setPeakPower(hp);
    setPeakTorque(displayTorque);
    setPeakBoost(displayBoost);
  };

  return (
    <div style={styles.container} className="glass-panel">
      <h3 style={styles.title}>ENGINE PERFORMANCE & PEAKS</h3>

      <div style={styles.metricsList}>
        {/* Power / HP Row */}
        <div style={styles.metricRow}>
          <div style={styles.metricInfo}>
            <span style={styles.label}>HORSEPOWER</span>
            <span className="text-neon-cyan text-mono" style={styles.liveValue}>
              {hp} <span style={styles.unit}>HP</span>
            </span>
          </div>
          <div style={styles.peakInfo}>
            <span style={styles.peakLabel}>PEAK RECORD</span>
            <span className="text-neon-pink text-mono" style={styles.peakValue}>
              {peakPower} <span style={styles.unit}>HP</span>
            </span>
          </div>
        </div>

        {/* Torque Row */}
        <div style={styles.metricRow}>
          <div style={styles.metricInfo}>
            <span style={styles.label}>TORQUE</span>
            <span className="text-neon-cyan text-mono" style={styles.liveValue}>
              {displayTorque} <span style={styles.unit}>{torqueUnit}</span>
            </span>
          </div>
          <div style={styles.peakInfo}>
            <span style={styles.peakLabel}>PEAK RECORD</span>
            <span className="text-neon-pink text-mono" style={styles.peakValue}>
              {peakTorque} <span style={styles.unit}>{torqueUnit}</span>
            </span>
          </div>
        </div>

        {/* Boost Row */}
        <div style={styles.metricRow}>
          <div style={styles.metricInfo}>
            <span style={styles.label}>BOOST PRESSURE</span>
            <span className="text-neon-cyan text-mono" style={styles.liveValue}>
              {displayBoost} <span style={styles.unit}>PSI</span>
            </span>
          </div>
          <div style={styles.peakInfo}>
            <span style={styles.peakLabel}>PEAK RECORD</span>
            <span className="text-neon-pink text-mono" style={styles.peakValue}>
              {peakBoost} <span style={styles.unit}>PSI</span>
            </span>
          </div>
        </div>
      </div>

      <button onClick={handleReset} style={styles.resetBtn}>
        RESET PEAKS
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    height: '100%',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
    marginBottom: '15px',
    textAlign: 'center' as const,
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    flexGrow: 1,
    justifyContent: 'center',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    padding: '12px 18px',
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  peakInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
    paddingLeft: '18px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  liveValue: {
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  peakLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  peakValue: {
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  unit: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginLeft: '2px',
  },
  resetBtn: {
    background: 'rgba(255, 0, 127, 0.1)',
    border: '1px solid rgba(255, 0, 127, 0.25)',
    color: 'var(--accent-pink)',
    boxShadow: '0 0 10px rgba(255, 0, 127, 0.1) inset',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '0.8rem',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    letterSpacing: '1px',
    marginTop: '20px',
    width: '100%',
    textAlign: 'center' as const,
  },
};
