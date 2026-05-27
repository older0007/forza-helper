import React, { useEffect, useRef } from 'react';

interface GForceMeterProps {
  accelX: number; // Right acceleration (m/s^2)
  accelZ: number; // Forward acceleration (m/s^2)
}

export const GForceMeter: React.FC<GForceMeterProps> = ({ accelX = 0, accelZ = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<{ x: number; z: number }[]>([]);

  // Convert m/s^2 to G-force (1 G ≈ 9.80665 m/s^2)
  // In Forza:
  // accelX > 0 is accelerating to the right (lat G leftwards on driver)
  // accelZ > 0 is accelerating forward (long G backwards on driver)
  const gX = accelX / 9.80665;
  const gZ = accelZ / 9.80665;

  // Track history for trails
  useEffect(() => {
    const history = historyRef.current;
    history.push({ x: gX, z: gZ });
    if (history.length > 25) {
      history.shift();
    }
  }, [gX, gZ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxG = 2.0; // Max G range represented by outer ring
    const scale = (width / 2 - 20) / maxG; // scale factor pixels/G

    // Draw grid rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const rings = [0.5, 1.0, 1.5, 2.0];
    rings.forEach((ringVal) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringVal * scale, 0, 2 * Math.PI);
      ctx.stroke();

      // Ring labels
      ctx.fillStyle = '#90a0b7';
      ctx.font = '9px var(--font-mono)';
      ctx.fillText(`${ringVal}G`, centerX + ringVal * scale - 12, centerY - 4);
    });

    // Draw crosshair axes
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, height - 10);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#90a0b7';
    ctx.font = '10px var(--font-display)';
    ctx.textAlign = 'center';
    ctx.fillText('FORWARD', centerX, 18);
    ctx.fillText('BRAKE', centerX, height - 10);
    ctx.textAlign = 'left';
    ctx.fillText('LAT L', 15, centerY - 5);
    ctx.textAlign = 'right';
    ctx.fillText('LAT R', width - 15, centerY - 5);

    // Draw trail history
    const history = historyRef.current;
    if (history.length > 1) {
      ctx.lineWidth = 2;
      for (let i = 0; i < history.length - 1; i++) {
        const pt1 = history[i];
        const pt2 = history[i + 1];
        
        // Map G-forces to screen space
        // Note: X is lateral (left/right), Z is longitudinal (accel/decel).
        // On screen:
        // lateral G: positive is right, negative is left
        // longitudinal G: positive is forward (up on canvas), negative is backward (down on canvas)
        const x1 = centerX + pt1.x * scale;
        const y1 = centerY - pt1.z * scale;
        const x2 = centerX + pt2.x * scale;
        const y2 = centerY - pt2.z * scale;

        const opacity = (i / history.length) * 0.4;
        ctx.strokeStyle = `rgba(0, 243, 255, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw current G-Force point
    const currentX = centerX + gX * scale;
    const currentY = centerY - gZ * scale;

    // Draw outer glow for dot
    const grad = ctx.createRadialGradient(currentX, currentY, 1, currentX, currentY, 12);
    grad.addColorStop(0, 'rgba(255, 0, 127, 1)');
    grad.addColorStop(0.3, 'rgba(255, 0, 127, 0.4)');
    grad.addColorStop(1, 'rgba(255, 0, 127, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Draw center core dot
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border around the core dot
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 5, 0, 2 * Math.PI);
    ctx.stroke();

  }, [gX, gZ]);

  return (
    <div style={styles.container} className="glass-panel">
      <h3 style={styles.title}>G-FORCE METER</h3>
      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} width={220} height={220} style={styles.canvas} />
      </div>
      <div style={styles.statsContainer} className="text-mono">
        <div style={styles.statItem}>
          <span style={{ color: 'var(--text-secondary)' }}>LAT:</span>{' '}
          <span style={{ color: gX >= 0 ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}>
            {Math.abs(gX).toFixed(2)} G
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={{ color: 'var(--text-secondary)' }}>LONG:</span>{' '}
          <span style={{ color: gZ >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {gZ.toFixed(2)} G
          </span>
        </div>
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
    justifyContent: 'space-between',
    height: '100%',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  canvasContainer: {
    position: 'relative' as const,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    display: 'block',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px 0 12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    marginTop: '10px',
  },
  statItem: {
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};
