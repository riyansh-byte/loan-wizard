import { useNavigate } from 'react-router-dom';
import './CustomerPortal.css';

export default function CustomerPortal() {
  const navigate = useNavigate();

  return (
    <div className="customer-portal-page">
      <div className="customer-portal-card">
        <div className="logo-row">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-wordmark">Loan Wizard</span>
        </div>
        <h1>Welcome to your loan portal.</h1>

        <div className="info-row">
          <span>Application Reference</span>
          <strong>LW-2026-00142</strong>
        </div>

        <div className="info-row">
          <span>Status</span>
          <span className="status-chip status-chip--amber">Under Review</span>
        </div>

        <p className="info-message">
          Our team will contact you within 2 business hours.
        </p>

        <button
          type="button"
          className="customer-portal__cta"
          onClick={() => navigate('/', { replace: true })}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
