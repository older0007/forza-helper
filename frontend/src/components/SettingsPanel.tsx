import React from 'react';
import { allLocales } from '../locales';

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
  
  r2Mode: 'linear' | 'full' | 'traction';
}

interface SettingsPanelProps {
  settings: TriggerSettings;
  onSettingsChange: (newSettings: TriggerSettings) => void;
  carCount: number;
  onUpdateCarDb: () => Promise<number>;
  lang: string;
}



export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  carCount,
  onUpdateCarDb,
  lang,
}) => {
  const t = allLocales[lang]?.settings || allLocales['en'].settings;

  const [updateState, setUpdateState] = React.useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const handleUpdateClick = async () => {
    setUpdateState({ status: 'loading', message: t.carDbUpdating });
    try {
      const newCount = await onUpdateCarDb();
      setUpdateState({
        status: 'success',
        message: lang === 'uk' ? `Успішно! Завантажено ${newCount} авто.` : `Success! Loaded ${newCount} cars.`,
      });
    } catch (e: any) {
      setUpdateState({
        status: 'error',
        message: (lang === 'uk' ? 'Помилка оновлення: ' : 'Failed to update: ') + (e.message || 'Unknown error'),
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
      {/* Header with title */}
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>{t.title}</h2>
      </div>
      
      <p style={styles.description}>
        {t.desc}
      </p>

      {/* SECTION 1: GENERAL INTENSITY */}
      <h3 style={styles.sectionHeading}>{t.generalSection}</h3>
      <div style={styles.settingsGrid}>
        {/* ABS Intensity Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.absStrengthLabel}</span>
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
            {t.absStrengthHint}
          </p>
        </div>

        {/* Traction Control Intensity Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.tcStrengthLabel}</span>
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
            {t.tcStrengthHint}
          </p>
        </div>

        {/* Pedal Stiffness Slider */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.resistanceLabel}</span>
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
            {t.resistanceHint}
          </p>
        </div>

        {/* Car Database Update Card */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.carDbLabel}</span>
            <span className="text-neon-pink text-mono" style={styles.value}>
              {carCount} {lang === 'uk' ? 'авто' : 'cars'}
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
            {updateState.status === 'loading' ? t.carDbUpdating : t.carDbUpdateBtn}
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
            {t.carDbHint}
          </p>
        </div>
      </div>

      {/* SECTION 2: ADVANCED ABS */}
      <h3 style={styles.sectionHeading}>{t.absSection}</h3>
      <div style={styles.settingsGrid}>
        {/* ABS Min Speed */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.absMinSpeedLabel}</span>
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
            {t.absMinSpeedHint}
          </p>
        </div>

        {/* ABS Freq */}
        <div style={styles.card}>
          <div style={styles.labelRow}>
            <span style={styles.label}>{t.absFreqLabel}</span>
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
            {t.absFreqHint}
          </p>
        </div>
      </div>

      {/* SECTION 3: ENGINE & GEAR SHIFTS */}
      <h3 style={styles.sectionHeading}>{t.engineSection}</h3>
      <div style={styles.settingsGrid}>
        {/* Rev Limiter Card */}
        <div style={styles.card}>
          <div style={{ ...styles.labelRow, marginBottom: '5px' }}>
            <span style={styles.label}>{t.revLimitLabel}</span>
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
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{t.revLimitThreshold}</span>
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
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{t.revLimitFreq}</span>
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
            {t.revLimitHint}
          </p>
        </div>

        {/* Gear Shift Card */}
        <div style={styles.card}>
          <div style={{ ...styles.labelRow, marginBottom: '5px' }}>
            <span style={styles.label}>{t.gearShiftLabel}</span>
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
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{t.gearShiftDuration}</span>
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
                  <span style={{ ...styles.label, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{t.gearShiftStrength}</span>
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
            {t.gearShiftHint}
          </p>
        </div>
      </div>

      {/* SECTION 4: ACCELERATOR PEDAL MODE (R2) */}
      <h3 style={styles.sectionHeading}>{t.r2ModeSection}</h3>
      <p style={{ ...styles.description, marginBottom: '15px' }}>
        {t.r2ModeDesc}
      </p>
      
      <div style={styles.modeSelectorGrid}>
        {/* Mode 1: Linear */}
        <div 
          onClick={() => handleSettingChange('r2Mode', 'linear')}
          style={{
            ...styles.modeCard,
            ...(settings.r2Mode === 'linear' ? styles.modeCardActive : {})
          }}
        >
          <div style={styles.modeHeader}>
            <span style={styles.modeTitle}>{t.r2LinearTitle}</span>
            {settings.r2Mode === 'linear' && <span style={styles.activeDot} />}
          </div>
          <p style={styles.modeDesc}>
            {t.r2LinearDesc}
          </p>
          {settings.r2Mode === 'linear' && (
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <div style={styles.labelRow}>
                <span style={{ ...styles.label, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  {t.r2LinearStrengthLabel}
                </span>
                <span className="text-neon-pink text-mono" style={{ ...styles.value, fontSize: '0.85rem' }}>
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
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        {/* Mode 2: Full Dynamic */}
        <div 
          onClick={() => handleSettingChange('r2Mode', 'full')}
          style={{
            ...styles.modeCard,
            ...(settings.r2Mode === 'full' ? styles.modeCardActive : {})
          }}
        >
          <div style={styles.modeHeader}>
            <span style={styles.modeTitle}>{t.r2FullTitle}</span>
            {settings.r2Mode === 'full' && <span style={styles.activeDot} />}
          </div>
          <p style={styles.modeDesc}>
            {t.r2FullDesc}
          </p>
        </div>

        {/* Mode 3: Traction Loss */}
        <div 
          onClick={() => handleSettingChange('r2Mode', 'traction')}
          style={{
            ...styles.modeCard,
            ...(settings.r2Mode === 'traction' ? styles.modeCardActive : {})
          }}
        >
          <div style={styles.modeHeader}>
            <span style={styles.modeTitle}>{t.r2TractionTitle}</span>
            {settings.r2Mode === 'traction' && <span style={styles.activeDot} />}
          </div>
          <p style={styles.modeDesc}>
            {t.r2TractionDesc}
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '10px',
    marginBottom: '5px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  heading: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '1px',
    color: 'var(--text-primary)',
    margin: 0,
  },
  langSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  langLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  langSelect: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
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
  modeSelectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  modeCard: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  modeCardActive: {
    border: '1px solid var(--accent-cyan)',
    boxShadow: '0 0 10px rgba(5, 255, 197, 0.15)',
    background: 'rgba(5, 255, 197, 0.03)',
  },
  modeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-cyan)',
    boxShadow: '0 0 8px var(--accent-cyan)',
  },
  modeDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
};
