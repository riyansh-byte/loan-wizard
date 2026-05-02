import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Check } from 'lucide-react';
import './Success.css';

const NEXT_STEPS = [
  'Our team will review your application within 2 business hours.',
  'You will receive a call from a Poonawalla Fincorp representative to confirm details.',
  'Funds will be disbursed to your registered bank account within 24 hours of approval.'
];

const Success = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('LW-2026-00142');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-checkmark">
          <svg viewBox="0 0 90 90">
            <circle className="success-checkmark__circle" cx="45" cy="45" r="40" />
            <path className="success-checkmark__tick" d="M32 46 L41 55 L59 35" />
          </svg>
        </div>
        <h1>Application Submitted!</h1>
        <p className="success-subtitle">
          Thank you, Rahul Sharma. Your loan application has been received and is under review.
        </p>

        <div className="success-reference">
          <div className="success-reference__label">Application Reference</div>
          <div className="success-reference__row">
            <span className="success-reference__value">LW-2026-00142</span>
            <button type="button" className="success-reference__copy" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <FileText size={16} />}
            </button>
          </div>
        </div>

        <div className="success-divider" />

        <div className="success-next">
          <p className="success-next__label">What happens next</p>
          <ul>
            {NEXT_STEPS.map((step, index) => (
              <li key={step}>
                <span className="success-next__index">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="success-actions">
          <Link className="success-actions__primary" to="/video-call">
            Back to Home
          </Link>
          <Link className="success-actions__secondary" to="/dashboard">
            View Dashboard →
          </Link>
        </div>

        <div className="success-footer">
          Poonawalla Fincorp Limited · NBFC regulated by RBI · CIN: L65910MH2005PLC268649
        </div>
      </div>
    </div>
  );
};

export default Success;
