import React from 'react';

interface TachometerProps {
  currentRpm: number;
  maxRpm: number;
  idleRpm: number;
  speed: number; // in m/s
  gear: number;
  useMetric: boolean;
}

export const Tachometer: React.FC<TachometerProps> = ({
  currentRpm = 0,
  maxRpm = 8000,
  speed = 0,
  gear = 11,
  useMetric = true,
}) => {
  // Convert speed (m/s) to display value
  const displaySpeed = Math.round(useMetric ? speed * 3.6 : speed * 2.23694);
  const speedUnit = useMetric ? 'KM/H' : 'MPH';

  // Format gear
  // Forza V2 Gear format: 0 = Reverse, 11 = Neutral (Wait! Let's double check - if 11 is neutral, else N, or if gear is 0, print R, if gear is 11 or 0 print N/R)
  let gearText = 'N';
  if (gear === 0) {
    gearText = 'R';
  } else if (gear === 11 || gear === 15) { // 11 or sometimes other values represent Neutral/Park
    gearText = 'N';
  } else if (gear >= 1 && gear <= 10) {
    gearText = gear.toString();
  }

  // Calculate RPM percentage
  const safeMaxRpm = maxRpm || 8000;
  const rpmPct = Math.min(100, Math.max(0, (currentRpm / safeMaxRpm) * 100));

  // Determine if we are at the redline (above 90% of max RPM)
  const isRedline = currentRpm > safeMaxRpm * 0.9;

  // SVG parameters
  const size = 300;
  const radius = 120;
  const strokeWidth = 14;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Arc angle: start at 135 deg (bottom-left), end at 45 deg (bottom-right)
  // Total arc length = 270 degrees
  const angleStart = 135;
  const angleEnd = 405;
  const angleRange = angleEnd - angleStart;
  
  // Stroke dashoffset for RPM arc
  const arcLength = (angleRange / 360) * circumference;
  const strokeDasharray = `${arcLength} ${circumference}`;
  const strokeDashoffset = arcLength - (rpmPct / 100) * arcLength;

  return (
    <div style={styles.container} className="glass-panel">
      <div style={styles.gaugeWrapper}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle / glow */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth + 4}
            strokeDasharray={strokeDasharray}
            transform={`rotate(${angleStart} ${center} ${center})`}
            strokeLinecap="round"
          />

          {/* Scale background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            transform={`rotate(${angleStart} ${center} ${center})`}
            strokeLinecap="round"
          />

          {/* RPM indicator fill */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isRedline ? 'var(--accent-pink)' : 'var(--accent-cyan)'}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(${angleStart} ${center} ${center})`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.06s linear, stroke 0.2s',
              filter: isRedline 
                ? 'drop-shadow(0px 0px 8px var(--accent-pink))' 
                : 'drop-shadow(0px 0px 8px var(--accent-cyan))'
            }}
          />

          {/* RPM ticks & numbers (simple styling helper) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((tick) => {
            const tickRpm = (safeMaxRpm / 9) * tick;
            const angle = angleStart + (tick / 9) * angleRange;
            const isTickActive = currentRpm >= tickRpm;
            const rad = (angle * Math.PI) / 180;
            
            // tick mark coordinates
            const x1 = center + (radius - strokeWidth) * Math.cos(rad);
            const y1 = center + (radius - strokeWidth) * Math.sin(rad);
            const x2 = center + (radius + 2) * Math.cos(rad);
            const y2 = center + (radius + 2) * Math.sin(rad);

            // text coordinates
            const tx = center + (radius - 28) * Math.cos(rad);
            const ty = center + (radius - 28) * Math.sin(rad) + 5;

            const isRedlineTick = tickRpm > safeMaxRpm * 0.9;

            return (
              <g key={tick}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isTickActive 
                      ? (isRedlineTick ? 'var(--accent-pink)' : 'var(--accent-cyan)') 
                      : 'rgba(255, 255, 255, 0.2)'
                  }
                  strokeWidth={2}
                />
                <text
                  x={tx}
                  y={ty}
                  fill={
                    isTickActive
                      ? (isRedlineTick ? 'var(--accent-pink)' : '#ffffff')
                      : 'var(--text-secondary)'
                  }
                  fontSize="10px"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {Math.round(tickRpm / 1000)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Display Details */}
        <div style={styles.centerDisplay}>
          {/* Gear display */}
          <div 
            style={{
              ...styles.gearNumber,
              color: isRedline ? 'var(--accent-pink)' : 'var(--text-primary)',
              textShadow: isRedline ? 'var(--glow-pink)' : 'none',
              animation: isRedline ? 'redline-blink 0.15s infinite alternate' : 'none'
            }}
          >
            {gearText}
          </div>
          
          {/* Speed display */}
          <div style={styles.speedValue} className="text-mono">
            {displaySpeed}
          </div>
          <div style={styles.speedUnit}>{speedUnit}</div>
        </div>

        {/* Bottom details: RPM value & Redline Indicator */}
        <div style={styles.bottomStats}>
          <div style={styles.rpmLabel} className="text-mono">
            RPM <span style={{ color: isRedline ? 'var(--accent-pink)' : 'var(--accent-cyan)' }}>
              {Math.round(currentRpm)}
            </span>
          </div>
        </div>
      </div>

      {/* Redline screen flash overlays if applicable */}
      {isRedline && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes redline-blink {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
        `}} />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  gaugeWrapper: {
    position: 'relative' as const,
    width: '300px',
    height: '300px',
  },
  centerDisplay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -46%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  gearNumber: {
    fontSize: '5rem',
    fontWeight: 800,
    lineHeight: '1',
    marginBottom: '-5px',
    transition: 'color 0.2s',
  },
  speedValue: {
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: '1',
  },
  speedUnit: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    marginTop: '2px',
  },
  bottomStats: {
    position: 'absolute' as const,
    bottom: '25px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpmLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  }
};
