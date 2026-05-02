import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import './Login.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    setCredentials((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(credentials.email.trim(), credentials.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage('Invalid credentials. Please contact your administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-row">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-wordmark">Loan Wizard</span>
        </div>
        <span className="badge">Admin Portal</span>
        <h1>Sign in to your account</h1>
        <p className="subtitle">
          Access is restricted to authorised Poonawalla Fincorp personnel.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@poonawallafincorp.com"
              value={credentials.email}
              onChange={handleChange('email')}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
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
          {errorMessage && (
            <div className="inline-alert">{errorMessage}</div>
          )}
        </form>
      </div>

      <p className="login-footer">
        Forgot your password? Contact your system administrator.
      </p>
    </div>
  );
}
