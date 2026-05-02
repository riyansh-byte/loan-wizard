import React from 'react';
import './Card.css';

/**
 * Card — Poonawalla Fincorp Design System
 * Props:
 *   title     — optional card header title string
 *   actions   — optional JSX for header right slot (buttons, chips)
 *   noPadding — removes body padding (for tables that need full bleed)
 *   className — extra classes
 */
const Card = ({
  title,
  actions,
  children,
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`pf-card ${className}`} {...props}>
      {(title || actions) && (
        <div className="pf-card__header">
          {title && <h3 className="pf-card__title">{title}</h3>}
          {actions && <div className="pf-card__actions">{actions}</div>}
        </div>
      )}
      <div className={`pf-card__body ${noPadding ? 'pf-card__body--no-padding' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
