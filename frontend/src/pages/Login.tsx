import "../styles/Login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5050";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
 
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // send them to your internal landing page
      navigate("/employees"); // change if your app starts elsewhere
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
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
          <h1 className="loginTitle">Sign in</h1>

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
              <input
                className="loginInput"
                type="password"
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
            </label>

            {error && <p style={{ marginTop: 10 }}>{error}</p>}

            <button className="loginBtnPrimary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
