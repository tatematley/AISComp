import "../styles/Login.css";
import React from "react";

export default function Login() {
  return (
    <main className="loginPage">
      <a className="loginLogoLink" href="/" aria-label="Go back to home">
        <img
            src="/images/logoSide.png"
            alt="Right HR"
            className="loginLogo"
        />
        </a>

      <div className="loginContainer">
        <div className="loginCard">
          <h1 className="loginTitle">Sign in</h1>

          <form className="loginForm">
            <label className="loginLabel">
              Email
              <input
                className="loginInput"
                type="email"
                name="email"
                placeholder="you@company.com"
                autoComplete="email"
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
              />
            </label>

            <button className="loginBtnPrimary" type="submit">
              Continue
            </button>

            <button className="loginBtnSecondary" type="button">
              Create an Account
            </button>

            <div className="loginLinks">
              <a className="loginLink" href="/forgot-password">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
