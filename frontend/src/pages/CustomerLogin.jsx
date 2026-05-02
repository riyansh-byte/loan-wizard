import { useState } from 'react';
import { Eye, EyeOff, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CustomerLogin.css';

const VALID_TEMP_PASSWORD = 'TEMP123456';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    setCredentials((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      if (credentials.password === VALID_TEMP_PASSWORD && credentials.email) {
        navigate('/customer/change-password', { replace: true });
      } else {
        setError('Invalid temporary password. Please try again.');
      }
    }, 300);
  };

  return (
    <div className="customer-login-page">
      <div className="customer-login-card">
        <div className="logo-row">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-wordmark">Loan Wizard</span>
        </div>
        <h1>Access your application</h1>
        <p className="subtitle">
          Use the temporary password sent to your registered email address.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="customer-email">Email address</label>
            <input
              id="customer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={credentials.email}
              onChange={handleChange('email')}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="customer-temp-password">Temporary Password</label>
            <div className="input-with-icon">
              <input
                id="customer-temp-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter temporary password"
                value={credentials.password}
                onChange={handleChange('password')}
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading && <span className="button-spinner" aria-hidden="true" />}
            <span>{isLoading ? 'Signing in…' : 'Sign In'}</span>
          </button>
          {error && <div className="inline-alert">{error}</div>}
        </form>

        <div className="note">
          <Clock size={16} />
          <span>Your temporary password expires in 24 hours.</span>
        </div>
      </div>
    </div>
  );
}
