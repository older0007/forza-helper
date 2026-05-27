import React from 'react';

export interface TriggerSettings {
  absStrength: number;
  tcStrength: number;
  resistanceStrength: number;
}

interface SettingsPanelProps {
  settings: TriggerSettings;
  onSettingsChange: (newSettings: TriggerSettings) => void;
  carCount: number;
  onUpdateCarDb: () => Promise<number>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  carCount,
  onUpdateCarDb,
}) => {
  const [updateState, setUpdateState] = React.useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const handleUpdateClick = async () => {
    setUpdateState({ status: 'loading', message: 'Fetching latest car database...' });
    try {
      const newCount = await onUpdateCarDb();
      setUpdateState({
        status: 'success',
        message: `Success! Loaded ${newCount} cars.`,
      });
    } catch (e: any) {
      setUpdateState({
        status: 'error',
        message: `Failed to update: ${e.message || 'Unknown error'}`,
      });
    }
  };

  const handleSliderChange = (key: keyof TriggerSettings, val: number) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  return (
    <div style={styles.container} className="col-12 glass-panel">
      <h2 style={styles.heading}>DUALSENSE ADAPTIVE TRIGGERS SETTINGS</h2>
      <p style={styles.description}>
        Adjust the physical force feedback intensity for your PS5 controller. Changes are saved automatically and synchronized to the server.
      </p>

      <div style={styles.settingsGrid}>
        {/* ABS Intensity Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>ABS Kicking Intensity (L2)</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {Math.round(settings.absStrength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.absStrength}
            onChange={(e) => handleSliderChange('absStrength', parseFloat(e.target.value))}
            className="settings-slider"
          />
          <p style={styles.hint}>
            Controls the amplitude of the pulsation trigger effect when your front wheels slip under braking.
          </p>
        </div>

        {/* Traction Control Intensity Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>Traction Control Vibration (R2)</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {Math.round(settings.tcStrength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.tcStrength}
            onChange={(e) => handleSliderChange('tcStrength', parseFloat(e.target.value))}
            className="settings-slider"
          />
          <p style={styles.hint}>
            Controls the chatter vibration amplitude on the accelerator pedal when the rear wheels lose grip.
          </p>
        </div>

        {/* Pedal Stiffness Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>Pedal Resistance Stiffness (L2/R2)</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {Math.round(settings.resistanceStrength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.resistanceStrength}
            onChange={(e) => handleSliderChange('resistanceStrength', parseFloat(e.target.value))}
            className="settings-slider"
          />
          <p style={styles.hint}>
            Scales the normal resistance weight of the triggers (weight of the accelerator and stiffness of the brakes).
          </p>
        </div>

        {/* Car Database Update Card */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>Car Database (FH4 / FH5 / FH6)</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {carCount} cars
            </span>
          </div>
          <button
            onClick={handleUpdateClick}
            disabled={updateState.status === 'loading'}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 46, 99, 0.1)',
              border: '1px solid var(--accent-pink)',
              borderRadius: '6px',
              color: '#ffffff',
              fontWeight: 700,
              cursor: updateState.status === 'loading' ? 'not-allowed' : 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              if (updateState.status !== 'loading') {
                e.currentTarget.style.background = 'rgba(255, 46, 99, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 46, 99, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 46, 99, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {updateState.status === 'loading' ? 'UPDATING...' : 'UPDATE DATABASE'}
          </button>
          {updateState.message && (
            <p style={{
              fontSize: '0.8rem',
              color: updateState.status === 'success' ? '#10b981' : updateState.status === 'error' ? '#ef4444' : 'var(--text-secondary)',
              marginTop: '5px',
              fontWeight: 600,
            }}>
              {updateState.message}
            </p>
          )}
          <p style={styles.hint}>
            Downloads the latest database of car ID to car model mappings from GitHub to display names instead of IDs.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    marginTop: '10px',
  },
  heading: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '1px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '10px',
    marginBottom: '5px',
  },
  description: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginBottom: '20px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  value: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.3',
  },
};
