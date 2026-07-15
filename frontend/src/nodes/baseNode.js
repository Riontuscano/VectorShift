import { Handle, Position } from 'reactflow';

export const BaseNode = ({
  id,
  title,
  icon,
  subtitle,
  inputs = [],
  outputs = [],
  colorTheme = '#1A1A1A',
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '14px',
        color: 'var(--text-primary)',
        fontFamily: "'Smooch Sans', sans-serif",
        minWidth: '180px',
        maxWidth: '240px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        '--node-theme': colorTheme,
        '--node-glow': `${colorTheme}30`,
      }}
      className="custom-node-wrapper"
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        borderBottom: subtitle ? '1px solid var(--border-subtle)' : 'none',
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: `${colorTheme}10`,
          border: `1px solid ${colorTheme}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colorTheme,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontWeight: '700',
            fontSize: '15px',
            letterSpacing: '0.01em',
            color: 'var(--text-primary)',
            lineHeight: '1.2',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '2px',
              fontWeight: '400',
              lineHeight: '1.3',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* ── Input Handles ── */}
      {inputs.map((input, idx) => {
        const total = inputs.length;
        const topPercent = `${((idx + 1) / (total + 1)) * 100}%`;
        return (
          <div key={input.id || idx}>
            <Handle
              type="target"
              position={input.position || Position.Left}
              id={input.id}
              style={{
                top: topPercent,
                background: 'var(--bg-card)',
                border: `2px solid ${colorTheme}`,
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                ...input.style,
              }}
            />
            {input.label && (
              <span style={{
                position: 'absolute',
                left: '14px',
                top: topPercent,
                transform: 'translateY(-50%)',
                fontSize: '10px',
                fontWeight: '600',
                color: '#9B9590',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}>
                {input.label}
              </span>
            )}
          </div>
        );
      })}

      {/* ── Output Handles ── */}
      {outputs.map((output, idx) => {
        const total = outputs.length;
        const topPercent = `${((idx + 1) / (total + 1)) * 100}%`;
        return (
          <div key={output.id || idx}>
            <Handle
              type="source"
              position={output.position || Position.Right}
              id={output.id}
              style={{
                top: topPercent,
                background: colorTheme,
                border: '2px solid var(--bg-card)',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                boxShadow: '0 0 0 1px var(--border-default)',
                ...output.style,
              }}
            />
            {output.label && (
              <span style={{
                position: 'absolute',
                right: '14px',
                top: topPercent,
                transform: 'translateY(-50%)',
                fontSize: '10px',
                fontWeight: '600',
                color: '#9B9590',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                textAlign: 'right',
              }}>
                {output.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
