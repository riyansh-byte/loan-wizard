import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import './Offer.css';

const offers = [
  {
    name: 'Conservative',
    badge: 'Safe Choice',
    badgeStyle: 'badge--success',
    amount: 240000,
    term: '24 months · 10.5% p.a.',
    emi: 11200,
    total: 268800,
    description: 'Lower amount with comfortable repayments — ideal if you prefer financial safety.',
    buttonStyle: 'outline'
  },
  {
    name: 'Standard',
    badge: 'Most Popular',
    badgeStyle: 'badge--primary',
    amount: 320000,
    term: '36 months · 11.5% p.a.',
    emi: 10540,
    total: 379440,
    description: 'Our most chosen option — balanced amount with manageable monthly payments.',
    buttonStyle: 'solid'
  },
  {
    name: 'Aggressive',
    badge: 'Maximum Benefit',
    badgeStyle: 'badge--info',
    amount: 400000,
    term: '24 months · 12.5% p.a.',
    emi: 18960,
    total: 455040,
    description: 'Maximum eligible amount — choose this if you need the full loan for your renovation.',
    buttonStyle: 'outline'
  }
];

const positiveFactors = [
  'Stable declared income',
  'Identity verified — document matches call',
  'Low fraud score (0/100)',
  'Liveness check passed'
];

const factorsNoted = ['First-time applicant — limited credit history'];

const formatRupee = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);

const Offer = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Standard');

  const selectedOffer = useMemo(() => offers.find((offer) => offer.name === selected), [selected]);

  return (
    <div className="offer-page">
      <div className="offer-page__inner">
        <div className="offer-header">
          <div className="offer-stepper">
            {['Video Call', 'Document Upload', 'Review', 'Offer', 'Consent'].map((step, index) => {
              const status = index < 3 ? 'complete' : index === 3 ? 'active' : 'upcoming';
              return (
                <div key={step} className={`offer-stepper__item offer-stepper__item--${status}`}>
                  <span className="offer-stepper__dot" />
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
          <div className="offer-title">
            <h1>Your Personalised Loan Offers</h1>
            <p>Based on your profile, we have prepared three options. Choose the one that works best for you.</p>
            <div className="offer-chip">
              <ShieldCheck size={14} />
              For Rahul Sharma
            </div>
          </div>
        </div>

        <div className="offer-cards">
          {offers.map((offer) => {
            const isSelected = offer.name === selected;
            return (
              <article
                key={offer.name}
                className={`offer-card ${isSelected ? 'offer-card--selected' : ''} ${
                  offer.name === 'Standard' ? 'offer-card--standout' : ''
                }`}
                onClick={() => setSelected(offer.name)}
              >
                {isSelected && (
                  <span className="offer-card__check">
                    <Check size={16} />
                  </span>
                )}
                <div className={`offer-card__badge ${offer.badgeStyle}`}>{offer.badge}</div>
                <div className="offer-card__amount">{formatRupee(offer.amount)}</div>
                <p className="offer-card__term">{offer.term}</p>
                <p className="offer-card__emi">EMI {formatRupee(offer.emi)}/month</p>
                <p className="offer-card__total">{formatRupee(offer.total)} total</p>
                <p className="offer-card__description">{offer.description}</p>
                <button
                  type="button"
                  className={`offer-card__btn offer-card__btn--${isSelected ? 'selected' : offer.buttonStyle}`}
                >
                  {isSelected ? 'Selected ✓' : 'Select this offer'}
                </button>
              </article>
            );
          })}
        </div>

        <div className="explain-card">
          <div className="explain-card__header">
            <ShieldCheck size={20} />
            <h2>How we decided</h2>
          </div>
          <div className="explain-card__body">
            <div>
              <p className="explain-title">Positive factors</p>
              <ul>
                {positiveFactors.map((factor) => (
                  <li key={factor}>
                    <Check size={16} />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="explain-title">Factors noted</p>
              <ul>
                {factorsNoted.map((factor) => (
                  <li key={factor}>
                    <span className="warning-icon">!</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="explain-card__confidence">
            <span className="confidence-pill">Confidence: 87%</span>
          </div>
        </div>

        <div className="offer-footer">
          <button
            type="button"
            className="offer-footer__btn"
            disabled={!selected}
            onClick={() => navigate('/consent')}
          >
            Accept &amp; Continue →
          </button>
          <p className="offer-footer__note">
            You can discuss these offers with our team before accepting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Offer;
