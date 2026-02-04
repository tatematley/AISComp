import "../styles/Privacy.css";

export default function Privacy() {
  return (
    <main className="privacyPage">
      {/* Top-left logo (match CreateUser / Login style) */}
      <a className="privacyLogoLink" href="/" aria-label="Go back to home">
        <img src="/images/logoSide.png" alt="Candid" className="privacyLogo" />
      </a>

      {/* One surface/card behind title + content + footer */}
      <div className="privacyShell privacySurface">
        <header className="privacyHeader">
          <h1 className="privacyTitle">Privacy Policy</h1>
          <p className="privacySubtitle">
            This policy explains how Candid collects, uses, and protects data in our platform.
          </p>
        </header>

        <section className="privacyContent">
          <h2>Purpose</h2>
          <p>
            This Privacy Policy explains how Candid collects, uses, and protects personal
            data when individuals use our AI-assisted talent matching, hiring, and career
            development platform. This includes both internal employees and external job
            applicants.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We collect only information that is relevant to hiring and career development,
            including:
          </p>
          <ul>
            <li>Skills, qualifications, certifications, and work experience</li>
            <li>Education and professional background</li>
            <li>Career interests and development goals (when voluntarily provided)</li>
            <li>Application materials such as resumes</li>
          </ul>
          <p>
            We do not collect or use protected personal attributes, including gender, race,
            ethnicity, age, disability status, or other sensitive characteristics.
          </p>

          <h2>How We Use Information</h2>
          <p>
            Collected data is used solely to assess skill alignment with open roles,
            recommend opportunities, identify skill gaps, support personalized upskilling,
            and promote fair and consistent evaluation. Data is never sold or used for
            unrelated purposes.
          </p>

          <h2>Use of Artificial Intelligence</h2>
          <p>
            Candid uses AI to support skill-based matching and recommendations. AI provides
            recommendations and explanations only and does not make hiring, promotion, or
            placement decisions. All final decisions are made by qualified human HR
            professionals or hiring managers.
          </p>

          <h2>Fairness and Bias Prevention</h2>
          <p>
            We apply safeguards to promote fairness and reduce bias, including:
          </p>
          <ul>
            <li>Skill- and qualification-based analysis only</li>
            <li>Exclusion of protected characteristics from AI inputs</li>
            <li>Explainable recommendations with clear reasoning</li>
            <li>Human review and override of all AI suggestions</li>
          </ul>

          <h2>Transparency and Consent</h2>
          <p>
            By using Candid or submitting information through the platform, users consent
            to their data being processed for AI-assisted hiring or career development
            purposes. Participation is voluntary and does not negatively impact employment
            or application status.
          </p>

          <h2>Security Safeguards</h2>
          <p>
            We protect personal data through secure authentication, role-based access
            controls, encrypted data storage, secure transmission, and system monitoring.
            Only authorized HR personnel may access user data.
          </p>

          <h2>Accountability</h2>
          <p>
            We maintain logs of AI-supported recommendations and human review actions to
            support audits, compliance, and responsible system governance.
          </p>
        </section>

        <footer className="privacyFooter">
          <a
            className="privacyDownloadLink"
            href="/Candid_Privacy_Policy.pdf"
          >
            Download PDF
          </a>
        </footer>
      </div>
    </main>
  );
}
