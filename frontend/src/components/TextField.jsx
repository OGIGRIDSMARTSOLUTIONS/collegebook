import { useId, useState } from 'react';

export function TextField({ label, error, className = '', type, ...props }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const inputId = useId();

  return (
    <label htmlFor={inputId} className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>}
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-secondary/70 focus:border-brand ${
            isPassword ? 'pr-10' : ''
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary hover:text-text"
          >
            {revealed ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  );
}

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.7C4.5 8.1 3 12 3 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2M17.4 17.4C19.5 15.9 21 12 21 12s-1.2-2.4-3.4-4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
