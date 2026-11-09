import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import BrandMark from "@components/BrandMark";
import Icon from "@components/Icon";
import { Notice } from "@components/PageParts";
import { useAuth } from "@hooks/useAuth";

export default function LoginPage() {
  const { status, user, login, notice } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") return <div className="screen-loader">Loading Avengers Admin…</div>;
  if (user?.role === "admin") return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (cause) {
      setError(cause.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <BrandMark />
          <span>
            AVENGERS<small>ADMIN CONSOLE</small>
          </span>
        </div>
        <div className="eyebrow">SECURE ACCESS</div>
        <h1>Welcome back</h1>
        <p>Sign in with your verified administrator account.</p>
        <Notice tone="warning">{notice}</Notice>
        <Notice>{error}</Notice>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="primary-button login-submit" type="submit" disabled={submitting}>
            <Icon name="key" size={12} />
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="login-foot">Access is restricted to authorized administrators.</div>
      </div>
      <div className="login-glow" />
    </div>
  );
}
