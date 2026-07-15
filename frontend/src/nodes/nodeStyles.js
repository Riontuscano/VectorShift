// Shared inline style objects for node form fields

export const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export const fieldGap = {
  marginBottom: '10px',
};

export const labelStyle = {
  fontSize: '10px',
  fontWeight: '600',
  color: '#71717a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export const inputStyle = {
  padding: '8px 10px',
  background: '#0f0f11',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  color: '#fafafa',
  fontSize: '12px',
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

export const textareaStyle = {
  ...inputStyle,
  resize: 'none',
  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  lineHeight: '1.5',
};

export const descriptionStyle = {
  color: '#52525b',
  fontSize: '11px',
  lineHeight: '1.4',
};
