import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { apiFetch } from "../lib/api";
import { clearStoredAuth, storeUser } from "../lib/auth";
import "../styles/Security.css";

type MfaStatus = {
  mfaEnabled: boolean;
  username: string;
  issuer: string;
};

type PendingSetup = {
  setupToken: string;
  secret: string;
  issuer: string;
  accountName: string;
  otpAuthUrl: string;
};

export default function Security() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [pendingSetup, setPendingSetup] = useState<PendingSetup | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoading(true);
        const [statusRes, meRes] = await Promise.all([
          apiFetch("/api/auth/mfa/status"),
          apiFetch("/api/auth/me"),
        ]);

        if (statusRes.status === 401 || meRes.status === 401) {
          clearStoredAuth();
          navigate("/login");
          return;
        }

        const statusJson = await statusRes.json();
        const meJson = await meRes.json();

        setStatus(statusJson);
        if (meJson?.user) storeUser(meJson.user);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load security settings.");
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [navigate]);

  async function startSetup() {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await apiFetch("/api/auth/mfa/setup/initiate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Unable to start MFA setup.");
      setPendingSetup(data);
      setRecoveryCodes([]);
    } catch (err: any) {
      setError(err?.message ?? "Unable to start MFA setup.");
    } finally {
      setSaving(false);
    }
  }

  async function completeSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingSetup) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await apiFetch("/api/auth/mfa/setup/complete", {
        method: "POST",
        body: JSON.stringify({
          setupToken: pendingSetup.setupToken,
          code: verifyCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Unable to complete MFA setup.");

      setStatus((current) =>
        current
          ? {
              ...current,
              mfaEnabled: true,
            }
          : current,
      );
      setRecoveryCodes(data.recoveryCodes ?? []);
      setPendingSetup(null);
      setVerifyCode("");
      setMessage("Multi-factor authentication is now enabled.");
    } catch (err: any) {
      setError(err?.message ?? "Unable to complete MFA setup.");
    } finally {
      setSaving(false);
    }
  }

  async function disableMfa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await apiFetch("/api/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Unable to disable MFA.");

      setStatus((current) =>
        current
          ? {
              ...current,
              mfaEnabled: Boolean(data?.mfaEnabled),
            }
          : current,
      );
      setDisablePassword("");
      setDisableCode("");
      setPendingSetup(null);
      setRecoveryCodes([]);
      setMessage("Multi-factor authentication has been disabled.");
    } catch (err: any) {
      setError(err?.message ?? "Unable to disable MFA.");
    } finally {
      setSaving(false);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setError(`Unable to copy ${label.toLowerCase()}.`);
    }
  }

  return (
    <>
      <AdminNavbar />
      <main className="securityPage">
        <section className="securityHero">
          <p className="securityEyebrow">Account Security</p>
          <h1 className="securityTitle">Protect your sign-in</h1>
          <p className="securitySubtitle">
            Use Microsoft Authenticator or another authenticator app to add a second
            verification step after your password.
          </p>
        </section>

        {loading ? (
          <section className="securityCard">
            <p className="securityText">Loading security settings...</p>
          </section>
        ) : (
          <div className="securityGrid">
            <section className="securityCard">
              <div className="securityCardHeader">
                <div>
                  <p className="securityEyebrow">Status</p>
                  <h2 className="securityCardTitle">Multi-factor authentication</h2>
                </div>
                <span className={`securityBadge ${status?.mfaEnabled ? "enabled" : ""}`}>
                  {status?.mfaEnabled ? "Enabled" : "Not enabled"}
                </span>
              </div>

              <p className="securityText">
                Authenticator apps are free, and yes, Microsoft Authenticator works with
                standard TOTP codes for this setup.
              </p>

              {error && <p className="securityError">{error}</p>}
              {message && <p className="securityMessage">{message}</p>}

              {!status?.mfaEnabled && !pendingSetup && (
                <button
                  type="button"
                  className="securityPrimaryBtn"
                  onClick={startSetup}
                  disabled={saving}
                >
                  {saving ? "Preparing..." : "Set up Microsoft Authenticator"}
                </button>
              )}

              {status?.mfaEnabled && (
                <form className="securityForm" onSubmit={disableMfa}>
                  <p className="securitySectionLabel">Disable MFA</p>
                  <input
                    className="securityInput"
                    type="password"
                    placeholder="Current password"
                    value={disablePassword}
                    onChange={(event) => setDisablePassword(event.target.value)}
                    required
                  />
                  <input
                    className="securityInput"
                    type="text"
                    inputMode="numeric"
                    placeholder="Authenticator code"
                    value={disableCode}
                    onChange={(event) => setDisableCode(event.target.value)}
                    required
                  />
                  <button type="submit" className="securitySecondaryBtn" disabled={saving}>
                    {saving ? "Saving..." : "Disable MFA"}
                  </button>
                </form>
              )}
            </section>

            <section className="securityCard">
              <div className="securityCardHeader">
                <div>
                  <p className="securityEyebrow">How It Works</p>
                  <h2 className="securityCardTitle">Authenticator setup</h2>
                </div>
              </div>

              <ol className="securitySteps">
                <li>Open Microsoft Authenticator on your phone.</li>
                <li>Tap the plus button and choose to add another account.</li>
                <li>Use the secret key below if you want to enter it manually.</li>
                <li>Enter the 6-digit code from the app to finish setup.</li>
              </ol>

              <p className="securityText">
                Signed in as <strong>{status?.username}</strong> with issuer{" "}
                <strong>{status?.issuer}</strong>.
              </p>

              {pendingSetup && (
                <form className="securityForm" onSubmit={completeSetup}>
                  <div className="securityKeyBlock">
                    <div>
                      <p className="securitySectionLabel">Manual setup key</p>
                      <code className="securityCode">{pendingSetup.secret}</code>
                    </div>
                    <button
                      type="button"
                      className="securityGhostBtn"
                      onClick={() => copyValue(pendingSetup.secret, "Setup key")}
                    >
                      Copy key
                    </button>
                  </div>

                  <div className="securityKeyBlock">
                    <div>
                      <p className="securitySectionLabel">OTP URI</p>
                      <code className="securityCode small">{pendingSetup.otpAuthUrl}</code>
                    </div>
                    <button
                      type="button"
                      className="securityGhostBtn"
                      onClick={() => copyValue(pendingSetup.otpAuthUrl, "OTP URI")}
                    >
                      Copy URI
                    </button>
                  </div>

                  <input
                    className="securityInput"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    value={verifyCode}
                    onChange={(event) => setVerifyCode(event.target.value)}
                    required
                  />

                  <button type="submit" className="securityPrimaryBtn" disabled={saving}>
                    {saving ? "Verifying..." : "Enable MFA"}
                  </button>
                </form>
              )}

              {recoveryCodes.length > 0 && (
                <div className="securityRecoveryBlock">
                  <p className="securitySectionLabel">Recovery codes</p>
                  <p className="securityText">
                    Save these once. Each code works one time if you lose access to
                    your authenticator app.
                  </p>
                  <div className="securityRecoveryGrid">
                    {recoveryCodes.map((code) => (
                      <code key={code} className="securityRecoveryCode">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
