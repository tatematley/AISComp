import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerLeft">
          <span>Candid</span>
          <span className="footerDot">•</span>
          <span>Finding the right people the right way</span>
        </div>

        <div className="footerRight">
          <a href="/privacy">Privacy Policy</a>
          <a href="mailto:hello@candid.com">hello@candid.com</a>
        </div>
      </div>

      <div className="footerBottom">
        © {new Date().getFullYear()} Candid
      </div>
    </footer>
  );
}
