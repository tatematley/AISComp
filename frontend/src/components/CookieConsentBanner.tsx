import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/CookieConsentBanner.css";

const STORAGE_KEY = "cookie_consent_choice";

type ConsentChoice = "accepted" | "essential-only";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const savedChoice = localStorage.getItem(STORAGE_KEY);
    setVisible(!savedChoice);
  }, []);

  function handleChoice(choice: ConsentChoice) {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookieBanner" role="dialog" aria-label="Cookie consent">
      <div className="cookieBannerGlow" aria-hidden="true" />
      <div className="cookieBannerContent">
        <p className="cookieBannerEyebrow">Cookie Preferences</p>
        <h2 className="cookieBannerTitle">We use cookies to keep Candid secure and reliable.</h2>
        <p className="cookieBannerText">
          Essential cookies help with authentication and session security. You can
          accept optional cookies or continue with essential cookies only. Read more in our{" "}
          <Link to="/privacy" className="cookieBannerLink">
            Privacy Policy
          </Link>.
        </p>
      </div>

      <div className="cookieBannerActions">
        <button
          type="button"
          className="cookieBannerBtn cookieBannerBtnSecondary"
          onClick={() => handleChoice("essential-only")}
        >
          Essential only
        </button>
        <button
          type="button"
          className="cookieBannerBtn cookieBannerBtnPrimary"
          onClick={() => handleChoice("accepted")}
        >
          Accept all
        </button>
      </div>
    </aside>
  );
}
