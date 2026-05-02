import React from 'react';
import './StatusChip.css';

/**
 * StatusChip
 * Statuses: approved | pending | flagged | in-review
 */
const STATUS_CONFIG = {
  approved:    { label: 'Approved',  className: 'chip--approved'  },
  pending:     { label: 'Pending',   className: 'chip--pending'   },
  flagged:     { label: 'Flagged',   className: 'chip--flagged'   },
  'in-review': { label: 'In Review', className: 'chip--in-review' },
};

const StatusChip = ({ status, customLabel, className = '' }) => {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG['pending'];
  const label = customLabel || config.label;

  return (
    <span className={`pf-chip ${config.className} ${className}`}>
      <span className="pf-chip__dot" aria-hidden="true" />
      {label}
    </span>
  );
};

export default StatusChip;
