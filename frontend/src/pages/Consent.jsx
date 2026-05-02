import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import './Consent.css';

const STEPS = ['Video Call', 'Document Upload', 'Review Details', 'Loan Offer', 'Consent'];

const formatRupee = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);

const Consent = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPointerPos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = event.touches ? event.touches[0] : event;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPointerPos(event);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1A3F8F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
    setHasSigned(true);
  };

  const draw = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPointerPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = () => {
    if (!(agreed && hasSigned)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/success');
    }, 1500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    return () => {
      drawing.current = false;
    };
  }, []);

  return (
    <div className="consent-page">
      <div className="consent-page__inner">
        <div className="consent-stepper">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`consent-stepper__item ${index === 4 ? 'active' : index < 4 ? 'complete' : ''}`}
            >
              <span className="consent-stepper__dot" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <header className="consent-header">
          <h1>Final Step — Your Consent</h1>
          <p>Review your chosen offer and provide your digital consent to proceed.</p>
        </header>

        <div className="consent-card">
          <p className="consent-card__label">Your Selected Offer</p>
          <div className="consent-card__row">
            <span className="consent-card__badge">Standard Offer</span>
            <span className="consent-card__amount">{formatRupee(320000)}</span>
          </div>
          <p className="consent-card__term">36 months · 11.5% p.a. · EMI ₹10,540/month</p>
          <p className="consent-card__total">₹3,79,440 total payable</p>
          <p className="consent-card__meta">For: Rahul Sharma · Session: LW-2026-00142</p>
        </div>

        <div className="consent-declaration">
          <div className="consent-declaration__header">
            <ShieldCheck size={18} />
            <span>Consent Declaration</span>
          </div>
          <p>
            I, Rahul Sharma, hereby confirm that all information provided during this video session is accurate,
            complete, and provided voluntarily. I consent to Poonawalla Fincorp Limited processing my loan application in
            accordance with their Privacy Policy, RBI Digital Lending Guidelines 2022, and the Digital Personal Data
            Protection Act 2023. I acknowledge that this session has been recorded for compliance and audit purposes.
          </p>
          <label className="consent-checkbox">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            I have read and agree to the above declaration
          </label>
        </div>

        <div className="consent-signature">
          <div className="consent-signature__header">
            <div>
              <p className="consent-signature__label">Digital Signature</p>
              <p className="consent-signature__sublabel">Sign in the box below using your mouse or finger</p>
            </div>
            <button type="button" className="consent-signature__clear" onClick={clearSignature}>
              Clear Signature
            </button>
          </div>
          <div className="consent-signature__canvas-wrap">
            {!hasSigned && <span className="consent-signature__placeholder">Sign here</span>}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>

        <button
          type="button"
          className="consent-submit"
          disabled={!agreed || !hasSigned || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </button>

        <div className="consent-footer">
          <Lock size={14} />
          <span>256-bit SSL · RBI V-CIP Compliant · DPDP Act 2023</span>
        </div>
      </div>
    </div>
  );
};

export default Consent;
