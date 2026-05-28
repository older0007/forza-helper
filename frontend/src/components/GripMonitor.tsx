import React from 'react';
import { allLocales } from '../locales';

interface GripMonitorProps {
  slipFL: number;
  slipFR: number;
  slipRL: number;
  slipRR: number;
  lang: string;
}



export const GripMonitor: React.FC<GripMonitorProps> = ({
  slipFL = 0,
  slipFR = 0,
  slipRL = 0,
  slipRR = 0,
  lang = 'en',
}) => {
  const t = allLocales[lang]?.grip || allLocales['en'].grip;
  // Calculate Front and Rear Slip averages
  // Combined slip is normally 0 (rolling) to ~1.0 (limit of traction), and >1.0 when sliding/spinning.
  // Scale to percentage, capped at 100%.
  const frontSlipPct = Math.min(100, Math.round(Math.max(0, (slipFL + slipFR) / 2) * 100));
  const rearSlipPct = Math.min(100, Math.round(Math.max(0, (slipRL + slipRR) / 2) * 100));

  // Wheelspin: is calculated when slip exceeds 1.0 (loss of traction)
  const maxSlip = Math.max(slipFL, slipFR, slipRL, slipRR);
  const wheelspinPct = maxSlip > 1.0 ? Math.min(100, Math.round(((maxSlip - 1.0) / 1.5) * 100)) : 0;

  // Grip %: 100% at 0 slip, decays as slip increases
  const avgSlip = (slipFL + slipFR + slipRL + slipRR) / 4;
  const gripPct = Math.max(0, Math.min(100, Math.round(100 - (avgSlip * 80))));

  // Get grip status text and colors
  let statusText = t.statusPerfect;
  let statusColor = '#39ff14'; // Neon Green
  if (gripPct < 40) {
    statusText = t.statusNoControl;
    statusColor = 'var(--accent-pink)'; // Neon Pink
  } else if (gripPct < 85) {
    statusText = t.statusSlipping;
    statusColor = 'var(--accent-orange)'; // Neon Orange
  }

  // Circular gauge setup
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gripPct / 100) * circumference;

  // Helper to color slip bars
  const getBarColor = (pct: number) => {
    if (pct < 15) return '#39ff14'; // green
    if (pct < 50) return 'var(--accent-cyan)'; // cyan
    if (pct < 80) return 'var(--accent-orange)'; // orange
    return 'var(--accent-pink)'; // pink
  };

  return (
    <div style={styles.container} className="glass-panel">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>{t.title}</h3>
          <span style={styles.subtitle}>{t.desc}</span>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.liveDot} />
          LIVE
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={styles.content}>
        {/* Left Side: Circular SVG Grip Gauge */}
        <div style={styles.gaugeContainer}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={styles.svg}>
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            {/* Colored Progress Ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke={statusColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{
                transition: 'stroke-dashoffset 0.08s linear, stroke 0.2s ease',
                filter: `drop-shadow(0 0 4px ${statusColor}88)`,
              }}
            />
          </svg>
          {/* Inner Value Text */}
          <div style={styles.gaugeLabelWrapper}>
            <span style={styles.gripValue} className="text-mono">{gripPct}%</span>
            <span style={styles.gripLabel}>{t.gripLabel}</span>
          </div>
        </div>

        {/* Right Side: Slip bars list */}
        <div style={styles.metricsList}>
          {/* Front Slip */}
          <div style={styles.metricRow}>
            <div style={styles.metricLabelRow}>
              <span style={styles.metricLabel}>{t.frontSlip}</span>
              <span style={styles.arrow} className="text-neon-cyan">→</span>
            </div>
            <div style={styles.barWrapper}>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${frontSlipPct}%`,
                    backgroundColor: getBarColor(frontSlipPct),
                    boxShadow: frontSlipPct > 20 ? `0 0 8px ${getBarColor(frontSlipPct)}88` : 'none',
                  }}
                />
              </div>
              <span style={styles.metricVal} className="text-mono">{frontSlipPct}%</span>
            </div>
          </div>

          {/* Rear Slip */}
          <div style={styles.metricRow}>
            <div style={styles.metricLabelRow}>
              <span style={styles.metricLabel}>{t.rearSlip}</span>
              <span style={styles.arrow} className="text-neon-cyan">→</span>
            </div>
            <div style={styles.barWrapper}>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${rearSlipPct}%`,
                    backgroundColor: getBarColor(rearSlipPct),
                    boxShadow: rearSlipPct > 20 ? `0 0 8px ${getBarColor(rearSlipPct)}88` : 'none',
                  }}
                />
              </div>
              <span style={styles.metricVal} className="text-mono">{rearSlipPct}%</span>
            </div>
          </div>

          {/* Wheelspin */}
          <div style={styles.metricRow}>
            <div style={styles.metricLabelRow}>
              <span style={styles.metricLabel}>{t.wheelspin}</span>
              <span style={styles.arrow} className="text-neon-cyan">→</span>
            </div>
            <div style={styles.barWrapper}>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${wheelspinPct}%`,
                    backgroundColor: getBarColor(wheelspinPct),
                    boxShadow: wheelspinPct > 15 ? `0 0 8px ${getBarColor(wheelspinPct)}88` : 'none',
                  }}
                />
              </div>
              <span style={styles.metricVal} className="text-mono">{wheelspinPct}%</span>
            </div>
          </div>

          {/* Status Row */}
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>{t.status}</span>
            <span style={{ ...styles.statusValue, color: statusColor, textShadow: `0 0 10px ${statusColor}aa` }} className="text-mono">
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    margin: 0,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 500,
  },
  liveBadge: {
    background: 'rgba(57, 255, 20, 0.08)',
    border: '1px solid rgba(57, 255, 20, 0.2)',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#39ff14',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '1px',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#39ff14',
    boxShadow: '0 0 8px #39ff14',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    flexGrow: 1,
    width: '100%',
  },
  gaugeContainer: {
    position: 'relative' as const,
    width: '140px',
    height: '140px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  svg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  gaugeLabelWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    zIndex: 2,
    marginTop: '5px',
  },
  gripValue: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1,
  },
  gripLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
    fontWeight: 700,
    marginTop: '4px',
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    flexGrow: 1,
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metricLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.5px',
  },
  arrow: {
    fontSize: '0.75rem',
    fontWeight: 800,
  },
  barWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barBg: {
    flexGrow: 1,
    height: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.08s linear, background-color 0.2s, box-shadow 0.2s',
  },
  metricVal: {
    fontSize: '0.8rem',
    fontWeight: 700,
    minWidth: '32px',
    textAlign: 'right' as const,
    color: '#ffffff',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '5px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '10px',
  },
  statusLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.5px',
  },
  statusValue: {
    fontSize: '0.85rem',
    fontWeight: 800,
    letterSpacing: '0.5px',
    transition: 'color 0.2s ease',
  },
};
