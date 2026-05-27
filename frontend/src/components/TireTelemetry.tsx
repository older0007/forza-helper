import React from 'react';

interface TireTelemetryProps {
  // Temperatures
  tempFL: number;
  tempFR: number;
  tempRL: number;
  tempRR: number;
  // Combined Slip (represents traction loss, 0 = pure grip, >1.0 = wheelspin/sliding)
  slipFL: number;
  slipFR: number;
  slipRL: number;
  slipRR: number;
  // Suspension Travel (0.0 = fully extended, 1.0 = fully compressed)
  suspFL: number;
  suspFR: number;
  suspRL: number;
  suspRR: number;
  
  useMetric: boolean;
}

export const TireTelemetry: React.FC<TireTelemetryProps> = ({
  tempFL = 60, tempFR = 60, tempRL = 60, tempRR = 60,
  slipFL = 0, slipFR = 0, slipRL = 0, slipRR = 0,
  suspFL = 0.5, suspFR = 0.5, suspRL = 0.5, suspRR = 0.5,
  useMetric = true
}) => {

  // Helper to format temperature
  const formatTemp = (tempF: number) => {
    if (useMetric) {
      // Fahrenheit to Celsius
      const tempC = (tempF - 32) * (5 / 9);
      return `${Math.round(tempC)}°C`;
    }
    return `${Math.round(tempF)}°F`;
  };

  // Helper to get color for tire temperature
  const getTempColor = (tempF: number) => {
    // Normal operating range for race tires is around 160°F - 210°F (70°C - 100°C)
    if (tempF < 120) return 'rgba(0, 243, 255, 0.45)'; // Cold (Cyan)
    if (tempF < 155) return 'rgba(57, 255, 20, 0.4)';  // Warm-up (Green-cyan)
    if (tempF < 215) return 'rgba(57, 255, 20, 0.8)';  // Optimal (Green)
    if (tempF < 240) return 'rgba(255, 159, 0, 0.85)'; // Hot (Orange)
    return 'rgba(255, 0, 127, 0.9)';                  // Overheated (Pink/Red)
  };

  // Helper to get color for tire slip
  const getSlipColor = (slipVal: number) => {
    // Combined slip: 0.0 to ~1.0+
    const absSlip = Math.abs(slipVal);
    if (absSlip < 0.1) return 'var(--text-secondary)';
    if (absSlip < 0.35) return 'var(--accent-cyan)';
    if (absSlip < 0.75) return 'var(--accent-orange)';
    return 'var(--accent-pink)';
  };

  const wheels = [
    { id: 'FL', label: 'FRONT LEFT', temp: tempFL, slip: slipFL, susp: suspFL, style: styles.wheelFL },
    { id: 'FR', label: 'FRONT RIGHT', temp: tempFR, slip: slipFR, susp: suspFR, style: styles.wheelFR },
    { id: 'RL', label: 'REAR LEFT', temp: tempRL, slip: slipRL, susp: suspRL, style: styles.wheelRL },
    { id: 'RR', label: 'REAR RIGHT', temp: tempRR, slip: slipRR, susp: suspRR, style: styles.wheelRR }
  ];

  return (
    <div style={styles.container} className="glass-panel">
      <h3 style={styles.title}>TIRES & SUSPENSION</h3>
      
      <div style={styles.chassisWrapper}>
        {/* Stylized chassis shape */}
        <div style={styles.chassisBg}></div>
        
        {/* Render the 4 wheels */}
        {wheels.map((wheel) => {
          const tempColor = getTempColor(wheel.temp);
          const slipColor = getSlipColor(wheel.slip);
          const suspPct = Math.round(wheel.susp * 100);

          return (
            <div key={wheel.id} style={{ ...styles.wheelContainer, ...wheel.style }}>
              {/* Wheel label */}
              <div style={styles.wheelLabel}>{wheel.id}</div>
              
              {/* The Tire visual box */}
              <div 
                style={{ 
                  ...styles.tireBox, 
                  backgroundColor: tempColor,
                  borderColor: wheel.slip > 0.6 ? 'var(--accent-pink)' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: wheel.slip > 0.6 ? '0 0 15px rgba(255, 0, 127, 0.5)' : 'none'
                }}
              >
                <div style={styles.tireTemp} className="text-mono">{formatTemp(wheel.temp)}</div>
              </div>
              
              {/* Stats for the wheel */}
              <div style={styles.wheelStats} className="text-mono">
                {/* Traction/Slip */}
                <div style={styles.statLine}>
                  <span>SLIP:</span>
                  <span style={{ color: slipColor }}>{wheel.slip.toFixed(2)}</span>
                </div>
                
                {/* Suspension Bar */}
                <div style={styles.suspLine}>
                  <div style={styles.suspBarBg}>
                    <div 
                      style={{ 
                        ...styles.suspBarFill, 
                        width: `${suspPct}%`,
                        backgroundColor: wheel.susp > 0.85 ? 'var(--accent-pink)' : 'var(--accent-cyan)'
                      }} 
                    />
                  </div>
                  <span style={styles.suspVal}>{suspPct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    marginBottom: '20px',
  },
  chassisWrapper: {
    position: 'relative' as const,
    width: '320px',
    height: '350px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chassisBg: {
    width: '90px',
    height: '240px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
    position: 'absolute' as const,
    zIndex: 1,
  },
  wheelContainer: {
    position: 'absolute' as const,
    width: '100px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    zIndex: 2,
  },
  wheelFL: { top: '20px', left: '10px' },
  wheelFR: { top: '20px', right: '10px' },
  wheelRL: { bottom: '20px', left: '10px' },
  wheelRR: { bottom: '20px', right: '10px' },
  wheelLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '4px',
    letterSpacing: '0.5px',
  },
  tireBox: {
    width: '42px',
    height: '75px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.2s, box-shadow 0.1s, border-color 0.1s',
  },
  tireTemp: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#ffffff',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
  },
  wheelStats: {
    width: '100%',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
    fontSize: '0.75rem',
  },
  statLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  suspLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '0 4px',
  },
  suspBarBg: {
    flexGrow: 1,
    height: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  suspBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.06s linear, background-color 0.2s',
  },
  suspVal: {
    fontSize: '0.7rem',
    minWidth: '22px',
    textAlign: 'right' as const,
    color: 'var(--text-secondary)',
  }
};
