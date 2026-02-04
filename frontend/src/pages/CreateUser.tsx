import "../styles/CreateUser.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function CreateUser() {
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
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const acceptedPolicy = form.get("acceptedPolicy") === "on";

    // basic validations (client-side)
    if (!username) {
      setLoading(false);
      return setError("Please enter a username.");
    }
    if (password.length < 8) {
      setLoading(false);
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirmPassword) {
      setLoading(false);
      return setError("Passwords do not match.");
    }
    if (!acceptedPolicy) {
      setLoading(false);
      return setError("You must agree to the Privacy Policy to continue.");
    }

    try {
      // We’ll implement this route next in server.ts
      // If you prefer a different endpoint name, tell me and I’ll match it.
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username,
            password,
            acceptedPolicy,
            }),
        });


      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? "Unable to create user.");
      }

      // If your backend returns token + user (recommended), we store it:
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      // Send them somewhere sensible
      navigate("/employees");
    } catch (err: any) {
      setError(err?.message ?? "Unable to create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="createUserPage">
      <a className="createUserLogoLink" href="/" aria-label="Go back to home">
        <img src="/images/logoSide.png" alt="Candid" className="createUserLogo" />
      </a>

      <div className="createUserContainer">
        <div className="createUserCard">
          <h1 className="createUserTitle">Create account</h1>
          <p className="createUserSubtitle">
            Set up your username and password. You’ll confirm the Privacy Policy before continuing.
          </p>

          <form className="createUserForm" onSubmit={handleSubmit}>
            <label className="createUserLabel">
              Username
              <input
                className="createUserInput"
                type="text"
                name="username"
                placeholder="username"
                autoComplete="username"
                required
              />
            </label>

            <label className="createUserLabel">
              Password
              <input
                className="createUserInput"
                type="password"
                name="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity("Password must be at least 8 characters.")
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
              />
            </label>

            <label className="createUserLabel">
              Confirm password
              <input
                className="createUserInput"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity("Password must be at least 8 characters.")
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
              />
            </label>

            <label className="createUserPolicyRow">
              <input
                className="createUserCheckbox"
                type="checkbox"
                name="acceptedPolicy"
              />
              <span className="createUserPolicyText">
                I agree to the{" "}
                <a className="createUserLink" href="/privacy">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {error && <p className="createUserError">{error}</p>}

            <button className="createUserBtnPrimary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="createUserLinks">
                <span className="createUserText">Already have an account?</span>
                <button
                    type="button"
                    className="createUserInlineLink"
                    onClick={() => navigate("/login")}
                >
                    Sign in
                </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
