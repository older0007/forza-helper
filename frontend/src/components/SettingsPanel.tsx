import React from 'react';

export interface TriggerSettings {
  absStrength: number;
  tcStrength: number;
  resistanceStrength: number;
  
  absMinSpeedKmh: number;
  absFreq: number;
  
  enableRevLimiter: boolean;
  revLimitRatio: number;
  revLimitFreq: number;
  
  enableGearShift: boolean;
  gearShiftDurationMs: number;
  gearShiftStrength: number;
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

  const handleSettingChange = <K extends keyof TriggerSettings>(key: K, val: TriggerSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  return (
    <div style={styles.container} className="col-12 glass-panel">
      <h2 style={styles.heading}>DUALSENSE ADAPTIVE TRIGGERS SETTINGS</h2>
      <p style={styles.description}>
        Adjust the physical force feedback intensity and advanced trigger physics for your PS5 controller. Changes are saved automatically.
      </p>

      {/* SECTION 1: GENERAL INTENSITY */}
      <h3 style={styles.sectionHeading}>General Intensity & Database</h3>
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
            onChange={(e) => handleSettingChange('absStrength', parseFloat(e.target.value))}
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
            onChange={(e) => handleSettingChange('tcStrength', parseFloat(e.target.value))}
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
            onChange={(e) => handleSettingChange('resistanceStrength', parseFloat(e.target.value))}
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

      {/* SECTION 2: ADVANCED ABS */}
      <h3 style={styles.sectionHeading}>Advanced ABS Settings (L2)</h3>
      <div style={styles.settingsGrid}>
        {/* ABS Min Speed */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>ABS Minimum Speed</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {settings.absMinSpeedKmh} km/h
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={settings.absMinSpeedKmh}
            onChange={(e) => handleSettingChange('absMinSpeedKmh', parseInt(e.target.value))}
            className="settings-slider"
          />
          <p style={styles.hint}>
            Disables L2 ABS trigger rumble at low speeds to prevent vibrations while parking or starting.
          </p>
        </div>

        {/* ABS Freq */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>ABS Vibration Frequency</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {settings.absFreq} Hz
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="40"
            step="2"
            value={settings.absFreq}
            onChange={(e) => handleSettingChange('absFreq', parseInt(e.target.value))}
            className="settings-slider"
          />
          <p style={styles.hint}>
            The speed of L2 brake trigger pulsations when tires slip. Higher values feel like finer ABS vibration.
          </p>
        </div>
      </div>

      {/* SECTION 3: ENGINE & GEAR SHIFTS */}
      <h3 style={styles.sectionHeading}>Engine Limiter & Gear Shift Effects (R2)</h3>
      <div style={styles.settingsGrid}>
        {/* Rev Limiter Card */}
        <div style={styles.card}>
          <div style={{ ...styles.labelRow, marginBottom: '5px' }}>
            <span style={styles.label}>Rev Limiter Vibration (R2)</span>
            <label className="control-toggle">
              <input
                type="checkbox"
                checked={settings.enableRevLimiter}
                onChange={(e) => handleSettingChange('enableRevLimiter', e.target.checked)}
              />
              <span className="toggle-switch" />
            </label>
          </div>
          
          {settings.enableRevLimiter && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <div style={styles.labelRow}>
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Activation Threshold</span>
                  <span className="text-neon-pink text-mono" style={{ ...styles.value, fontSize: '0.95rem' }}>
                    {Math.round(settings.revLimitRatio * 100)}% RPM
                  </span>
                </div>
                <input
                  type="range"
                  min="0.90"
                  max="0.99"
                  step="0.01"
                  value={settings.revLimitRatio}
                  onChange={(e) => handleSettingChange('revLimitRatio', parseFloat(e.target.value))}
                  className="settings-slider"
                />
              </div>

              <div>
                <div style={styles.labelRow}>
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Vibration Frequency</span>
                  <span className="text-neon-pink text-mono" style={{ ...styles.value, fontSize: '0.95rem' }}>
                    {settings.revLimitFreq} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="2"
                  value={settings.revLimitFreq}
                  onChange={(e) => handleSettingChange('revLimitFreq', parseInt(e.target.value))}
                  className="settings-slider"
                />
              </div>
            </div>
          )}
          <p style={styles.hint}>
            Vibrates the R2 accelerator trigger when engine hits the redline, warning you to shift gears.
          </p>
        </div>

        {/* Gear Shift Card */}
        <div style={styles.card}>
          <div style={{ ...styles.labelRow, marginBottom: '5px' }}>
            <span style={styles.label}>Gear Shift Thump (L2/R2)</span>
            <label className="control-toggle">
              <input
                type="checkbox"
                checked={settings.enableGearShift}
                onChange={(e) => handleSettingChange('enableGearShift', e.target.checked)}
              />
              <span className="toggle-switch" />
            </label>
          </div>
          
          {settings.enableGearShift && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <div style={styles.labelRow}>
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Thump Duration</span>
                  <span className="text-neon-pink text-mono" style={{ ...styles.value, fontSize: '0.95rem' }}>
                    {settings.gearShiftDurationMs} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={settings.gearShiftDurationMs}
                  onChange={(e) => handleSettingChange('gearShiftDurationMs', parseInt(e.target.value))}
                  className="settings-slider"
                />
              </div>

              <div>
                <div style={styles.labelRow}>
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Thump Intensity</span>
                  <span className="text-neon-pink text-mono" style={{ ...styles.value, fontSize: '0.95rem' }}>
                    {Math.round(settings.gearShiftStrength * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.gearShiftStrength}
                  onChange={(e) => handleSettingChange('gearShiftStrength', parseFloat(e.target.value))}
                  className="settings-slider"
                />
              </div>
            </div>
          )}
          <p style={styles.hint}>
            Delivers a physical pulse to the pedals when the car changes gears to simulate clutch/shifting kickback.
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
  sectionHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: 'var(--accent-cyan)',
    textTransform: 'uppercase' as const,
    marginTop: '25px',
    marginBottom: '10px',
    borderLeft: '3px solid var(--accent-cyan)',
    paddingLeft: '10px',
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
