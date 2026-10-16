import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    // Ask Supabase to sign in, or to create a new account
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // If email confirmation is on, sign-up gives no session yet
    if (mode === 'signup' && !data.session) {
      setMessage('Check your email to confirm your account, then sign in.');
    }
    // When sign-in works, App.jsx notices by itself and shows the app
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setMessage('');
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Career Hub</h1>
        <p>{mode === 'signin' ? 'Sign in to your account' : 'Create your account'}</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />

        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        {message && <p className="login-message">{message}</p>}

        <button type="button" className="link-btn" onClick={switchMode}>
          {mode === 'signin' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}

export default Login;