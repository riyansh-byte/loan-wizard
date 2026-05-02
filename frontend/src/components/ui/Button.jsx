import React from 'react';
import './Button.css';

/**
 * Button — Poonawalla Fincorp Design System
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`pf-btn pf-btn--${variant} pf-btn--${size} ${loading ? 'pf-btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="pf-btn__spinner" aria-hidden="true" />
      )}
      <span className={loading ? 'pf-btn__label--hidden' : ''}>{children}</span>
    </button>
  );
};

export default Button;
