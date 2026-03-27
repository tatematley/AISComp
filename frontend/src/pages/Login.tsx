import "../styles/Login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { apiFetch } from "../lib/api";
import { clearStoredAuth, storeUser } from "../lib/auth";

type MfaChallenge = {
  challengeToken: string;
  username: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Login failed");
      }

      if (data?.mfaRequired && data?.challengeToken) {
        setMfaChallenge({
          challengeToken: String(data.challengeToken),
          username,
        });
        setMfaCode("");
        return;
      }

      storeUser(data.user ?? null);
      navigate("/applicants");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaChallenge) return;

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/mfa/verify-login", {
        method: "POST",
        body: JSON.stringify({
          challengeToken: mfaChallenge.challengeToken,
          code: mfaCode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Verification failed");
      }

      storeUser(data.user ?? null);
      setMfaChallenge(null);
      setMfaCode("");
      navigate("/applicants");
    } catch (err: any) {
      setError(err?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <a className="loginLogoLink" href="/" aria-label="Go back to home">
        <img src="/images/logoSide.png" alt="Candid" className="loginLogo" />
      </a>

      <div className="loginContainer">
        <div className="loginCard">
          <h1 className="loginTitle">{mfaChallenge ? "Verify sign in" : "Sign in"}</h1>

          {!mfaChallenge ? (
            <form className="loginForm" onSubmit={handleSubmit}>
              <label className="loginLabel">
                Username
                <input
                  className="loginInput"
                  type="text"
                  name="username"
                  placeholder="username"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="loginLabel">
                Password
                <div className="loginPasswordWrap">
                  <input
                    className="loginInput loginPasswordInput"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="loginPasswordToggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && <p className="loginError">{error}</p>}

              <button className="loginBtnPrimary" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Continue"}
              </button>

              <div className="loginLinks">
                <span className="loginLinkText">Don’t have an account?</span>
                <button
                  type="button"
                  className="loginLinkBtn"
                  onClick={() => navigate("/create-user")}
                >
                  Create an account
                </button>
              </div>
            </form>
          ) : (
            <form className="loginForm" onSubmit={handleMfaSubmit}>
              <p className="loginMfaText">
                Enter the 6-digit code from Microsoft Authenticator for{" "}
                <strong>{mfaChallenge.username}</strong>. You can also use a recovery code.
              </p>

              <label className="loginLabel">
                Verification code
                <input
                  className="loginInput"
                  type="text"
                  inputMode="numeric"
                  name="mfaCode"
                  placeholder="123456 or recovery code"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </label>

              {error && <p className="loginError">{error}</p>}

              <button className="loginBtnPrimary" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                className="loginBtnSecondary"
                onClick={() => {
                  setMfaChallenge(null);
                  setMfaCode("");
                  setError(null);
                  clearStoredAuth();
                }}
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
