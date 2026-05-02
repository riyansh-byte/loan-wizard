import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
import Layout from '../components/ui/Layout';
import Card from '../components/ui/Card';
import './Review.css';

const STEPS = ['Video Call', 'Document Upload', 'Review', 'Offer', 'Consent'];
const BASE_INCOME = 85000;

const initialValues = {
  fullName: 'Rahul Sharma',
  dateOfBirth: '1990-03-15',
  monthlyIncome: '85000',
  employmentType: 'Salaried',
  loanPurpose: 'Home Renovation',
  declaredAge: '34',
};

const FIELD_LABELS = {
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  monthlyIncome: 'Monthly Income',
  employmentType: 'Employment Type',
  loanPurpose: 'Loan Purpose',
  declaredAge: 'Declared Age',
};

const ORIGINAL_VALUES = {
  fullName: { stt: 'Rahul Sharma', doc: 'Rahul Sharma' },
  dateOfBirth: { stt: '1990-03-15', doc: '1990-03-15' },
  monthlyIncome: { stt: '85000', doc: '85000' },
  employmentType: { stt: 'Salaried', doc: 'Salaried' },
  loanPurpose: { stt: 'Home Renovation', doc: 'Home Renovation' },
  declaredAge: { stt: '34', doc: '34' },
};

const Review = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialValues);
  const [kycComplete, setKycComplete] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [flaggedFields, setFlaggedFields] = useState([]);

  const numericIncome = useMemo(
    () => Number(formValues.monthlyIncome) || 0,
    [formValues.monthlyIncome],
  );
  const incomeDelta = Math.abs(numericIncome - BASE_INCOME) / BASE_INCOME;
  const showIncomeAlert = Boolean(formValues.monthlyIncome) && incomeDelta > 0.4;

  const handleFieldChange = (field) => (event) => {
    const rawValue = event.target.value;
    const value =
      field === 'monthlyIncome'
        ? rawValue.replace(/[^\d]/g, '')
        : rawValue;

    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const flagged = new Set();

    const normalized = (value) => (value || '').toString().trim();

    const computeLevenshtein = (a, b) => {
      const m = a.length;
      const n = b.length;
      if (!m && !n) return 0;
      const matrix = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i += 1) matrix[i][0] = i;
      for (let j = 0; j <= n; j += 1) matrix[0][j] = j;
      for (let i = 1; i <= m; i += 1) {
        for (let j = 1; j <= n; j += 1) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[m][n];
    };

    const similarityRatio = (value, reference) => {
      const normA = normalized(value);
      const normB = normalized(reference);
      const maxLen = Math.max(normA.length, normB.length);
      if (!maxLen) return 0;
      return computeLevenshtein(normA.toLowerCase(), normB.toLowerCase()) / maxLen;
    };

    const ratioToStt = similarityRatio(formValues.fullName, ORIGINAL_VALUES.fullName.stt);
    const ratioToDoc = similarityRatio(formValues.fullName, ORIGINAL_VALUES.fullName.doc);
    if (ratioToStt > 0.2 && ratioToDoc > 0.2) {
      flagged.add('fullName');
    }

    const dobValue = formValues.dateOfBirth;
    if (dobValue && dobValue !== ORIGINAL_VALUES.dateOfBirth.stt && dobValue !== ORIGINAL_VALUES.dateOfBirth.doc) {
      flagged.add('dateOfBirth');
    }

    const currentAge = Number(formValues.declaredAge) || 0;
    const ageStt = Number(ORIGINAL_VALUES.declaredAge.stt);
    const ageDoc = Number(ORIGINAL_VALUES.declaredAge.doc);
    if (Math.abs(currentAge - ageStt) > 5 && Math.abs(currentAge - ageDoc) > 5) {
      flagged.add('declaredAge');
    }

    const incomeValue = Number(formValues.monthlyIncome) || 0;
    const incomeStt = Number(ORIGINAL_VALUES.monthlyIncome.stt);
    const incomeDoc = Number(ORIGINAL_VALUES.monthlyIncome.doc);
    const ratioSttIncome = Math.abs(incomeValue - incomeStt) / (incomeStt || 1);
    const ratioDocIncome = Math.abs(incomeValue - incomeDoc) / (incomeDoc || 1);
    if (ratioSttIncome > 0.4 && ratioDocIncome > 0.4) {
      flagged.add('monthlyIncome');
    }

    if (
      formValues.employmentType &&
      formValues.employmentType !== ORIGINAL_VALUES.employmentType.stt &&
      formValues.employmentType !== ORIGINAL_VALUES.employmentType.doc
    ) {
      flagged.add('employmentType');
    }

    if (
      formValues.loanPurpose &&
      formValues.loanPurpose !== ORIGINAL_VALUES.loanPurpose.stt &&
      formValues.loanPurpose !== ORIGINAL_VALUES.loanPurpose.doc
    ) {
      flagged.add('loanPurpose');
    }

    setFlaggedFields(Array.from(flagged));
  }, [formValues]);

  const canProceed = kycComplete && agreed;

  const handleConfirm = (event) => {
    event?.preventDefault();
    if (!canProceed) {
      return;
    }

    console.log('Submitting review payload', {
      values: formValues,
      flaggedFields,
    });

    navigate('/offer');
  };

  const isFieldFlagged = (field) => flaggedFields.includes(field);

  return (
    <Layout>
      <div className="review-page">
        <div className="review-page__inner">
          <header className="review-header">
            <div>
              <p className="review-header__title">Please verify your details</p>
              <p className="review-header__subtitle">
                These details were captured during your call. Edit anything that looks incorrect before we proceed.
              </p>
            </div>
            <div className="review-stepper">
              {STEPS.map((step, index) => {
                const status = index < 2 ? 'complete' : index === 2 ? 'active' : 'upcoming';
                return (
                  <div key={step} className={`review-stepper__item review-stepper__item--${status}`}>
                    <span className="review-stepper__dot" />
                    <span className="review-stepper__label">{step}</span>
                  </div>
                );
              })}
            </div>
          </header>

          <Card className="review-card">
            <div
              className={`kyc-banner ${kycComplete ? 'kyc-banner--success' : 'kyc-banner--warning'}`}
            >
              <div className="kyc-banner__content">
                {kycComplete ? (
                  <Check size={20} className="kyc-banner__icon" />
                ) : (
                  <AlertTriangle size={20} className="kyc-banner__icon" />
                )}
                <p className="kyc-banner__text">
                  {kycComplete
                    ? 'Identity verified · Aadhaar uploaded · Name and DOB matched'
                    : 'Document verification pending. Please upload your identity document to proceed.'}
                </p>
              </div>
              {!kycComplete && (
                <button
                  type="button"
                  className="kyc-banner__cta"
                  onClick={() => navigate('/video-call')}
                >
                  Upload Document
                </button>
              )}
            </div>

            {!kycComplete && (
              <button
                type="button"
                className="simulate-kyc"
                onClick={() => setKycComplete(true)}
              >
                Simulate KYC Complete{' '}
                <span className="simulate-kyc__hint">(Demo: Simulate verification)</span>
              </button>
            )}

            <form className="review-form" onSubmit={handleConfirm}>
            <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="full-name">Full Name</label>
                  <input
                    id="full-name"
                    type="text"
                    value={formValues.fullName}
                    onChange={handleFieldChange('fullName')}
                  />
                  {isFieldFlagged('fullName') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="date-of-birth">Date of Birth</label>
                  <input
                    id="date-of-birth"
                    type="date"
                    value={formValues.dateOfBirth}
                    onChange={handleFieldChange('dateOfBirth')}
                  />
                  {isFieldFlagged('dateOfBirth') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="monthly-income">Monthly Income</label>
                  <div className="currency-input">
                    <span>₹</span>
                    <input
                      id="monthly-income"
                      type="text"
                      inputMode="numeric"
                      value={formValues.monthlyIncome}
                      onChange={handleFieldChange('monthlyIncome')}
                      placeholder="85000"
                    />
                  </div>
                  {isFieldFlagged('monthlyIncome') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="employment-type">Employment Type</label>
                  <select
                    id="employment-type"
                    value={formValues.employmentType}
                    onChange={handleFieldChange('employmentType')}
                  >
                    <option>Salaried</option>
                    <option>Self-employed</option>
                    <option>Contractor</option>
                  </select>
                  {isFieldFlagged('employmentType') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="loan-purpose">Loan Purpose</label>
                  <select
                    id="loan-purpose"
                    value={formValues.loanPurpose}
                    onChange={handleFieldChange('loanPurpose')}
                  >
                    <option>Home Renovation</option>
                    <option>Medical</option>
                    <option>Business</option>
                    <option>Education</option>
                  </select>
                  {isFieldFlagged('loanPurpose') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="declared-age">Declared Age</label>
                  <input
                    id="declared-age"
                    type="number"
                    min="18"
                    value={formValues.declaredAge}
                    onChange={handleFieldChange('declaredAge')}
                  />
                  {isFieldFlagged('declaredAge') && (
                    <div className="field-flagged">
                      This change differs from your captured data and has been flagged for review.
                    </div>
                  )}
                </div>
              </div>

              <div className="review-card__footer">
                <label className="review-card__checkbox">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                  />
                  <span>I confirm all details above are accurate</span>
                </label>
                <button
                  className="btn review-card__cta"
                  type="submit"
                  disabled={!canProceed}
                  title={!canProceed ? 'Complete document verification to proceed' : undefined}
                >
                  Confirm &amp; Proceed
                </button>
                <button type="button" className="review-card__link">
                  Something looks wrong — request manual review
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Review;
