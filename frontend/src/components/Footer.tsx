import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerLeft">
          <span>Right HR</span>
          <span className="footerDot">•</span>
          <span>Finding the right people the right way</span>
        </div>

        <div className="footerRight">
          <a href="/privacy">Privacy</a>
          <a href="mailto:hello@righthr.com">hello@righthr.com</a>
        </div>
      </div>

      <div className="footerBottom">
        © {new Date().getFullYear()} Right HR
      </div>
    </footer>
  );
}
