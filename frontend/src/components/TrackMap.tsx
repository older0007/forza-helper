import React, { useEffect, useRef, useState } from 'react';

interface TrackMapProps {
  posX: number;
  posZ: number;
  yaw: number; // yaw rotation in radians/degrees
  isRaceOn: number;
}

interface Point {
  x: number;
  z: number;
}

export const TrackMap: React.FC<TrackMapProps> = ({
  posX = 0,
  posZ = 0,
  yaw = 0,
  isRaceOn = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [path, setPath] = useState<Point[]>([]);

  // Monitor race state changes to reset path
  const prevIsRaceOn = useRef<number>(isRaceOn);
  useEffect(() => {
    if (isRaceOn === 1 && prevIsRaceOn.current === 0) {
      // Race started, clear path
      setPath([]);
    }
    prevIsRaceOn.current = isRaceOn;
  }, [isRaceOn]);

  // Append new position to path
  useEffect(() => {
    // Record if coordinates are not zero (regardless of race state, e.g., in Free Roam)
    if (posX !== 0 || posZ !== 0) {
      setPath((prevPath) => {
        // Only add if the car has moved significantly (e.g., > 0.8 meters)
        if (prevPath.length > 0) {
          const lastPoint = prevPath[prevPath.length - 1];
          const dist = Math.hypot(posX - lastPoint.x, posZ - lastPoint.z);
          if (dist < 0.8) return prevPath;
        }

        const newPath = [...prevPath, { x: posX, z: posZ }];
        // Limit path length to 2000 points to prevent memory bloat
        if (newPath.length > 2000) {
          newPath.shift();
        }
        return newPath;
      });
    }
  }, [posX, posZ]);

  // Handle drawing & autoscaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // If path is empty, draw standby state
    if (path.length < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#90a0b7';
      ctx.font = '13px var(--font-display)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAITING FOR TELEMETRY DATA...', width / 2, height / 2);
      
      // Draw a small dot at current center position for preview
      return;
    }

    // 1. Calculate bounding box of the path
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    path.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
    });

    // Also include current position to avoid mapping bugs
    if (posX < minX) minX = posX;
    if (posX > maxX) maxX = posX;
    if (posZ < minZ) minZ = posZ;
    if (posZ > maxZ) maxZ = posZ;

    // Add padding to bounding box (at least 20 meters, or 10% of range)
    const rangeX = Math.max(20, maxX - minX);
    const rangeZ = Math.max(20, maxZ - minZ);
    const centerX = minX + rangeX / 2;
    const centerZ = minZ + rangeZ / 2;
    
    // Choose size such that aspect ratio is preserved
    const maxRange = Math.max(rangeX, rangeZ);
    const scale = (Math.min(width, height) - 40) / maxRange;

    // 2. Render Path
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const getScreenCoord = (pt: Point) => {
      // Map world coords (X, Z) to screen (pixel) coords
      // In games, Z is usually forward/backwards (north/south) and X is left/right (east/west)
      // We map X to Canvas X, and Z to Canvas Y (inverted so north is up)
      const screenX = width / 2 + (pt.x - centerX) * scale;
      const screenY = height / 2 - (pt.z - centerZ) * scale;
      return { x: screenX, y: screenY };
    };

    // Draw main track line
    const firstCoord = getScreenCoord(path[0]);
    ctx.moveTo(firstCoord.x, firstCoord.y);

    for (let i = 1; i < path.length; i++) {
      const coord = getScreenCoord(path[i]);
      ctx.lineTo(coord.x, coord.y);
    }
    ctx.stroke();

    // Draw glowing trace for the most recent path segments
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    const startIdx = Math.max(0, path.length - 80);
    const traceStart = getScreenCoord(path[startIdx]);
    ctx.moveTo(traceStart.x, traceStart.y);
    for (let i = startIdx + 1; i < path.length; i++) {
      const coord = getScreenCoord(path[i]);
      ctx.lineTo(coord.x, coord.y);
    }
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.stroke();
    // Reset shadow
    ctx.shadowBlur = 0;

    // 3. Draw current car marker
    const carPos = getScreenCoord({ x: posX, z: posZ });
    
    // Glow around car
    const carGlow = ctx.createRadialGradient(carPos.x, carPos.y, 1, carPos.x, carPos.y, 10);
    carGlow.addColorStop(0, '#ff007f');
    carGlow.addColorStop(0.4, 'rgba(255, 0, 127, 0.4)');
    carGlow.addColorStop(1, 'rgba(255, 0, 127, 0)');
    ctx.fillStyle = carGlow;
    ctx.beginPath();
    ctx.arc(carPos.x, carPos.y, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Arrow indicating direction (Yaw)
    ctx.fillStyle = '#ff007f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // Draw arrow shape pointing in the direction of Yaw
    // Yaw: in Forza, yaw rotation is in radians. 0 is north, positive rotates clockwise.
    // Standard canvas rotates clockwise. So we offset accordingly.
    // Screen rotation angle = -Yaw - Math.PI/2 (since north is up)
    const angle = -yaw - Math.PI / 2;
    const arrowLength = 9;
    const arrowWidth = 6;

    const tipX = carPos.x + arrowLength * Math.cos(angle);
    const tipY = carPos.y + arrowLength * Math.sin(angle);
    const leftX = carPos.x + arrowWidth * Math.cos(angle + (3 * Math.PI) / 4);
    const leftY = carPos.y + arrowWidth * Math.sin(angle + (3 * Math.PI) / 4);
    const rightX = carPos.x + arrowWidth * Math.cos(angle - (3 * Math.PI) / 4);
    const rightY = carPos.y + arrowWidth * Math.sin(angle - (3 * Math.PI) / 4);

    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(carPos.x, carPos.y); // center point
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }, [path, posX, posZ, yaw]);

  const handleClear = () => {
    setPath([]);
  };

  return (
    <div style={styles.container} className="glass-panel">
      <div style={styles.header}>
        <h3 style={styles.title}>LIVE TRACK MAP</h3>
        <button onClick={handleClear} style={styles.clearBtn} className="text-mono">
          CLEAR PATH
        </button>
      </div>
      
      <div style={styles.mapContainer}>
        <canvas ref={canvasRef} width={450} height={350} style={styles.canvas} />
      </div>
      
      <div style={styles.footer} className="text-mono">
        <div>
          POINTS RECORDED: <span className="text-neon-cyan">{path.length}</span>
        </div>
        <div>
          X: <span className="text-neon-pink">{posX.toFixed(1)}</span> Z:{' '}
          <span className="text-neon-pink">{posZ.toFixed(1)}</span>
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
    height: '100%',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: '15px',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1.5px',
    fontWeight: 600,
  },
  clearBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  mapContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexGrow: 1,
  },
  canvas: {
    display: 'block',
    maxWidth: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
};
