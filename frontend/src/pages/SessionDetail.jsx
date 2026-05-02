import React from 'react';
import Layout from '../components/ui/Layout';
import Card from '../components/ui/Card';
import './SessionDetail.css';

const MOCK_EVENTS = [
  { event: 'SESSION_STARTED', timestamp: '2026-04-12T08:15:00Z', description: 'Session initiated, geo captured', color: '#1A3F8F' },
  { event: 'GEO_CAPTURED', timestamp: '2026-04-12T08:15:03Z', description: 'Location: Mumbai, Maharashtra. No VPN detected.', color: '#1A3F8F' },
  { event: 'STT_COMPLETE', timestamp: '2026-04-12T08:18:45Z', description: 'Transcript extracted. Consent phrase captured.', color: '#7C3AED' },
  { event: 'DOC_UPLOADED', timestamp: '2026-04-12T08:19:10Z', description: 'Aadhaar uploaded successfully to S3.', color: '#D97706' },
  { event: 'OCR_COMPLETE', timestamp: '2026-04-12T08:19:22Z', description: 'Name: Rahul Sharma. DOB: 15/03/1990. Match: confirmed.', color: '#D97706' },
  { event: 'CV_COMPLETE', timestamp: '2026-04-12T08:19:30Z', description: 'Age estimated: 34. Liveness: passed. Emotion: neutral.', color: '#7C3AED' },
  { event: 'RISK_SCORED', timestamp: '2026-04-12T08:19:35Z', description: 'Risk Band: A. Default probability: 7.8%. Max eligible: ₹4,00,000', color: '#DC2626' },
  { event: 'OFFER_GENERATED', timestamp: '2026-04-12T08:19:38Z', description: '3 offer variants generated. Standard offer: ₹3,20,000 at 10.5%', color: '#059669' },
  { event: 'CUSTOMER_ACCEPTED', timestamp: '2026-04-12T08:22:15Z', description: 'Customer selected Standard offer. ₹3,20,000 / 24 months.', color: '#059669' },
  { event: 'CONSENT_LOGGED', timestamp: '2026-04-12T08:22:30Z', description: 'Verbal consent captured and timestamped. Digital signature recorded.', color: '#059669' },
];

const MOCK_TRANSCRIPT = [
  { time: '08:15:12', speaker: 'Agent', text: 'Hi Rahul, welcome to LoanWizard. I will guide you through the video onboarding.', isConsent: false },
  { time: '08:17:03', speaker: 'Agent', text: 'Please hold the Aadhaar close to the camera so we can capture the document.', isConsent: false },
  { time: '08:18:10', speaker: 'System', text: 'Document scan complete. OCR confidence 98%.', isConsent: false },
  { time: '08:18:45', speaker: 'System', text: 'Consent phrase captured: "I confirm the information provided is true and I agree to proceed."', isConsent: true },
  { time: '08:19:05', speaker: 'Agent', text: 'We are now finalizing your eligibility. Hold on for the offer summary.', isConsent: false },
];

const FRAUD_SIGNALS = [
  { id: 'geo', label: 'Geo Match', fired: false },
  { id: 'liveness', label: 'Liveness Passed', fired: false },
  { id: 'face', label: 'Face Match', fired: false },
  { id: 'doc', label: 'Document Match', fired: false },
  { id: 'ocr', label: 'OCR Verification', fired: false },
  { id: 'speech', label: 'Speech Match', fired: false },
  { id: 'risk', label: 'Risk Band Approved', fired: false },
  { id: 'income', label: 'Income Anomaly', fired: true, detail: '+20' },
  { id: 'consent', label: 'Consent Phrase', fired: false },
];

const formatTimestamp = (value) =>
  new Date(value).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const SessionDetail = () => {
  return (
    <Layout>
      <div className="session-detail">
        <div className="session-detail__header">
          <div>
            <p className="session-detail__eyebrow">LoanWizard Admin</p>
            <h1 className="session-detail__title">Session LW-2048-A1</h1>
          </div>
          <div className="session-detail__meta">
            <span className="mono">sess_a1b2c3d4</span>
            <span>12 Apr 2026 · 08:15 AM IST</span>
          </div>
        </div>

        <div className="session-detail__grid">
          <div className="session-detail__main">
            <Card title="Session Timeline">
              <div className="session-detail__timeline">
                {MOCK_EVENTS.map((item) => (
                  <div className="timeline-item" key={item.event}>
                    <span className="timeline-item__dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <div className="timeline-item__body">
                      <div className="timeline-item__header">
                        <span className="timeline-item__event">{item.event}</span>
                        <span className="timeline-item__timestamp mono">{formatTimestamp(item.timestamp)}</span>
                      </div>
                      <p className="timeline-item__description">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Call Transcript" className="session-detail__transcript-card">
              <div className="session-detail__transcript-content">
                {MOCK_TRANSCRIPT.map((line) => (
                  <div
                    key={`${line.speaker}-${line.time}`}
                    className={`transcript-line ${line.isConsent ? 'transcript-line--consent' : ''}`}
                  >
                    <div className="transcript-line__meta">
                      <span className="mono transcript-line__time">{line.time}</span>
                      <span className="transcript-line__speaker">{line.speaker}</span>
                      {line.isConsent && <span className="transcript-line__badge">CONSENT</span>}
                    </div>
                    <p className="transcript-line__text">{line.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="session-detail__sidebar">
            <Card title="Customer Summary">
              <div className="session-detail__summary-row">
                <span className="session-detail__summary-label">Name</span>
                <span className="session-detail__summary-value">Rahul Sharma</span>
              </div>
              <div className="session-detail__summary-row">
                <span className="session-detail__summary-label">Session ID</span>
                <span className="session-detail__summary-value mono">sess_a1b2c3d4</span>
              </div>
              <div className="session-detail__summary-row">
                <span className="session-detail__summary-label">Date</span>
                <span className="session-detail__summary-value">12 Apr 2026</span>
              </div>
              <div className="session-detail__summary-row session-detail__summary-band">
                <span className="session-detail__summary-label">Risk Band</span>
                <span className="risk-chip risk-chip--a">A</span>
              </div>
            </Card>

            <Card title="Fraud Signals">
              <ul className="fraud-signals__list">
                {FRAUD_SIGNALS.map((signal) => (
                  <li
                    key={signal.id}
                    className={`fraud-signals__item ${signal.fired ? 'fraud-signals__item--fired' : ''}`}
                  >
                    <span className="fraud-signals__icon">
                      {signal.fired ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18" />
                          <path d="M6 6 18 18" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <div className="fraud-signals__content">
                      <span className="fraud-signals__label">{signal.label}</span>
                      {signal.detail && <span className="fraud-signals__detail">{signal.detail}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Offer Accepted">
              <div className="offer-accepted">
                <div className="offer-accepted__name">Standard • Band A</div>
                <div className="offer-accepted__amount mono">₹3,20,000</div>
                <div className="offer-accepted__meta">
                  <span>36 months</span>
                  <span>11.5% p.a.</span>
                  <span>EMI ₹16,607</span>
                </div>
              </div>
            </Card>

            <Card title="Consent Record">
              <div className="consent-record">
                <div className="consent-record__row">
                  <span className="consent-record__label">Timestamp</span>
                  <span className="consent-record__value mono">08:22:30</span>
                </div>
                <div className="consent-record__row">
                  <span className="consent-record__label">Phrase</span>
                  <span className="consent-record__value consent-record__value--italic">
                    "I confirm the information provided is true and I agree to proceed."
                  </span>
                </div>
                <div className="consent-record__row">
                  <span className="consent-record__label">Session hash</span>
                  <span className="consent-record__value mono">LW-2048...c3d4</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SessionDetail;
