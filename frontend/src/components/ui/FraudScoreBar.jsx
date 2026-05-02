import React from 'react';
import './FraudScoreBar.css';

const getScoreColor = (score) => {
  if (score <= 20) return 'var(--pf-fraud-clean)';
  if (score <= 45) return 'var(--pf-fraud-low)';
  if (score <= 70) return 'var(--pf-fraud-high)';
  return 'var(--pf-fraud-critical)';
};

const FraudScoreBar = ({ score = 0 }) => {
  const color = getScoreColor(score);
  const pct = Math.min(Math.max(score, 0), 100);

  return (
    <div className="fraud-bar">
      <div className="fraud-bar__track">
        <div
          className="fraud-bar__fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="fraud-bar__score mono" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

export default FraudScoreBar;
