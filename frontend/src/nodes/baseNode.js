import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

export const BaseNode = ({
  id,
  title,
  icon,
  subtitle,
  inputs = [],
  outputs = [],
  colorTheme = '#1A1A1A',
  children,
}) => {
  // Subscribe to this specific node's data in the store
  const node = useStore(state => state.nodes.find(n => n.id === id));
  const data = node?.data || {};
  const status = data.status || 'idle'; // 'idle', 'running', 'completed', 'error'

  // Dynamic borders and shadows based on execution status
  let borderStyle = '1px solid var(--border-default)';
  let boxShadowStyle = 'var(--shadow-sm)';
  if (status === 'running') {
    borderStyle = '1px solid #2563eb';
    boxShadowStyle = '0 0 16px rgba(37, 99, 235, 0.4)';
  } else if (status === 'completed') {
    borderStyle = '1px solid #16a34a';
    boxShadowStyle = '0 0 12px rgba(22, 163, 74, 0.2)';
  } else if (status === 'skipped') {
    borderStyle = '1px dashed var(--border-default)';
    boxShadowStyle = 'none';
  } else if (status === 'error') {
    borderStyle = '1px solid #dc2626';
    boxShadowStyle = '0 0 12px rgba(220, 38, 38, 0.2)';
  }

  // Generate unified rows for input/output handles
  const maxRows = Math.max(inputs.length, outputs.length);
  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push({
      input: inputs[i] || null,
      output: outputs[i] || null,
    });
  }

  // Check if any port has a text label
  const hasLabels = inputs.some(i => i.label) || outputs.some(o => o.label);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: borderStyle,
        borderRadius: '14px',
        color: 'var(--text-primary)',
        fontFamily: "'Smooch Sans', sans-serif",
        minWidth: '180px',
        maxWidth: '240px',
        boxShadow: boxShadowStyle,
        position: 'relative',
        '--node-theme': colorTheme,
        '--node-glow': `${colorTheme}30`,
        paddingBottom: (!hasLabels && inputs.length === 0 && outputs.length === 0 && !children) ? '0' : '8px',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
        opacity: status === 'skipped' ? 0.5 : 1,
      }}
      className="custom-node-wrapper"
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        borderBottom: (children || (hasLabels && maxRows > 0)) ? '1px solid var(--border-subtle)' : 'none',
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

        {/* Status Badge */}
        {status !== 'idle' && (
          <div style={{
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: '4px',
            background: status === 'running' 
              ? 'rgba(37, 99, 235, 0.1)' 
              : status === 'completed' 
                ? 'rgba(22, 163, 74, 0.1)' 
                : status === 'skipped'
                  ? 'rgba(107, 114, 128, 0.1)'
                  : 'rgba(220, 38, 38, 0.1)',
            color: status === 'running' 
              ? '#2563eb' 
              : status === 'completed' 
                ? '#16a34a' 
                : status === 'skipped'
                  ? '#6b7280'
                  : '#dc2626',
            lineHeight: '1',
            marginLeft: 'auto',
          }}>
            {status}
          </div>
        )}
      </div>

      {/* ── Node Body (Children) ── */}
      {children && (
        <div style={{ padding: '12px 16px 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {children}
        </div>
      )}

      {/* ── Handles / Ports Section ── */}
      {maxRows > 0 && (
        hasLabels ? (
          /* Row-based labeled ports */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 0 4px',
            position: 'relative',
          }}>
            {rows.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: '22px',
                  position: 'relative',
                  width: '100%',
                  padding: '0 16px',
                }}
              >
                {/* Input Handle (Left edge) */}
                {row.input && (
                  <Handle
                    type="target"
                    position={row.input.position || Position.Left}
                    id={row.input.id}
                    style={{
                      left: '0px',
                      background: 'var(--bg-card)',
                      border: `2px solid ${colorTheme}`,
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      ...row.input.style,
                    }}
                  />
                )}

                {/* Input Label (Left-aligned) */}
                {row.input ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    userSelect: 'none',
                  }}>
                    {row.input.label}
                  </span>
                ) : <div />}

                {/* Output Label (Right-aligned) */}
                {row.output ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginLeft: 'auto',
                    marginRight: '0px',
                    userSelect: 'none',
                  }}>
                    {row.output.label}
                  </span>
                ) : <div />}

                {/* Output Handle (Right edge) */}
                {row.output && (
                  <Handle
                    type="source"
                    position={row.output.position || Position.Right}
                    id={row.output.id}
                    style={{
                      right: '0px',
                      background: colorTheme,
                      border: '2px solid var(--bg-card)',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      boxShadow: '0 0 0 1px var(--border-default)',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translate(50%, -50%)',
                      ...row.output.style,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Absolute positioned unlabeled handles (e.g. InputNode, OutputNode, TextNode) */
          <>
            {inputs.map((input, idx) => {
              const total = inputs.length;
              const topPercent = `${((idx + 1) / (total + 1)) * 100}%`;
              return (
                <Handle
                  key={input.id || idx}
                  type="target"
                  position={input.position || Position.Left}
                  id={input.id}
                  style={{
                    top: topPercent,
                    left: '0px',
                    background: 'var(--bg-card)',
                    border: `2px solid ${colorTheme}`,
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    ...input.style,
                  }}
                />
              );
            })}
            {outputs.map((output, idx) => {
              const total = outputs.length;
              const topPercent = `${((idx + 1) / (total + 1)) * 100}%`;
              return (
                <Handle
                  key={output.id || idx}
                  type="source"
                  position={output.position || Position.Right}
                  id={output.id}
                  style={{
                    top: topPercent,
                    right: '0px',
                    background: colorTheme,
                    border: '2px solid var(--bg-card)',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 1px var(--border-default)',
                    transform: 'translate(50%, -50%)',
                    ...output.style,
                  }}
                />
              );
            })}
          </>
        )
      )}
    </div>
  );
};
