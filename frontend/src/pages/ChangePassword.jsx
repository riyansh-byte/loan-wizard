import { useMemo, useState } from 'react';
import { Eye, EyeOff, Key, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChangePassword.css';

const generatePassword = () => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
const segmentColors = ['#DC2626', '#F97316', '#F59E0B', '#16A34A'];

const evaluateStrength = (value) => {
  if (!value) {
    return 0;
  }

  let score = 0;
  if (value.length >= 12) {
    score += 2;
  } else if (value.length >= 10) {
    score += 1;
  }
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) {
    score += 1;
  }
  if (/\d/.test(value)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1;
  }

  return Math.min(3, Math.floor(score / 2));
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const strengthLevel = useMemo(() => evaluateStrength(newPassword), [newPassword]);
  const strengthLabel = strengthLabels[strengthLevel];

  const canSubmit =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword;

  const handleGenerate = () => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setNewPassword(password);
    setConfirmPassword(password);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Ensure the passwords match and are not empty.');
      return;
    }

    navigate('/customer/portal', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="logo-row">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-wordmark">Loan Wizard</span>
        </div>
        <h1>Set your new password</h1>
        <p className="subtitle">
          Your temporary password is active. Please set a permanent password to secure your account.
        </p>

        <form className="change-password-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="current-password">Current password</label>
            <div className="input-with-icon">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => setShowCurrent((prev) => !prev)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="new-password">New password</label>
            <div className="input-with-icon">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="strength-meter">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className="strength-segment"
                  style={{
                    backgroundColor:
                      strengthLevel >= index ? segmentColors[index] : '#E5E7EB',
                  }}
                />
              ))}
            </div>
            <p className="strength-label">{strengthLabel}</p>
          </div>

          {generatedPassword && (
            <div className="generated-password">
              <span className="generated-password__label">Generated password</span>
              <div className="generated-password__inner">
                <span className="generated-password__value">{generatedPassword}</span>
                <button
                  type="button"
                  className="generated-password__copy"
                  onClick={handleCopy}
                >
                  <Copy size={16} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="confirm-password">Confirm password</label>
            <div className="input-with-icon">
              <input
                id="confirm-password"
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                aria-hidden="true"
                onClick={() => setShowNew((prev) => !prev)}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="suggest-password"
            onClick={handleGenerate}
          >
            <Key size={14} />
            <span>Suggest strong password</span>
          </button>

          {error && <div className="inline-alert">{error}</div>}

          <button
            type="submit"
            className="submit-button submit-button--wide"
            disabled={!canSubmit}
          >
            Set Password
          </button>
        </form>
      </div>
    </div>
  );
}
