import "../styles/Home.css";
import Navbar from "../components/Navbar";
import React from "react";
import Footer from "../components/Footer";


type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Skill-to-Role Matching",
    description: "Maps evolving skills to open roles using AI—beyond keyword matching.",
    icon: <IconSpark />,
  },
  {
    title: "Personalized Upskilling Plans",
    description: "Practical, sequenced learning paths that consider time and cost.",
    icon: <IconPath />,
  },
  {
    title: "Smart Recommendations",
    description: "Top applicants for open positions and best-fit roles for current employees.",
    icon: <IconStars />,
  },
  {
    title: "Explainable & Governed AI",
    description: "Human-readable reasons, bias checks, and privacy safeguards built in.",
    icon: <IconShield />,
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Connect your data",
    text: "Import employees, applicants, roles, and skills into one secure system.",
  },
  {
    step: "2",
    title: "Understand skills & gaps",
    text: "Right HR identifies strengths, gaps, and role readiness across teams.",
  },
  {
    step: "3",
    title: "Get recommendations",
    text: "See best-fit candidates for roles and growth paths for employees.",
  },
  {
    step: "4",
    title: "Trust every decision",
    text: "Explanations, fairness checks, and decision logs come standard.",
  },
];

type Persona = {
  title: string;
  text: string;
  icon: React.ReactNode;
};


const PERSONAS = [
  {
    title: "HR Leaders",
    text: "Make workforce plans that scale—without sacrificing fairness and clarity.",
    icon: <IconShield />,
  },
  {
    title: "HR Managers",
    text: "Streamline hiring, mobility, and performance workflows with explainable recommendations.",
    icon: <IconPath />,
  },
  {
    title: "Talent Acquisition",
    text: "Fill roles faster with ranked candidates and transparent reasoning.",
    icon: <IconStars />,
  },
];


const GOVERNANCE = [
  "Bias detection & fairness checks in recommendations",
  "Explainable AI: clear reasons for every suggestion",
  "Privacy-first handling for sensitive HR data",
  "Audit-ready decision logs and governance controls",
];

export default function HomePage() {
  return (
    <main className="page">
      {/* HERO */}
      <section className="hero">
        <Navbar />
        <div className="heroContent">
          <img src="/images/logo.png" alt="Right HR logo" className="heroLogo" />

          <h1 className="heroTitle">Finding the right people the right way</h1>

          <p className="heroSub">
            AI-powered talent strategy that connects skills, roles, and growth with transparency,
            fairness, and trust.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section sectionLight featuresSection">
        <div className="container">
          <header className="featuresHeader">
            <h2 className="featuresTitle">What Right HR does</h2>
            <p className="featuresLead">
              A modern, enterprise-ready platform that connects people, skills, and roles — without
              hiding the “why.”
            </p>
          </header>

          <div className="grid4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card featureCard">
                <div className="cardIcon">{f.icon}</div>
                <h3 className="h3">{f.title}</h3>
                <p className="bodyText">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section sectionLight">
        <div className="container">
          <header className="howHeader">
            <h2 className="howTitle">Simple, clear, enterprise-ready.</h2>
            <p className="howLead">
              Connect your company data, generate recommendations, and understand every decision with
              built-in governance.
            </p>
          </header>

          <div className="steps">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="step">
                <div className="stepNum" aria-hidden="true">
                  {s.step}
                </div>
                <div>
                  <div className="stepTitle">{s.title}</div>
                  <div className="stepText">{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="section sectionPowder">
        <div className="container">
          <header className="personasHeader">
            <h2 className="personasTitle">Built for real teams</h2>
            <p className="personasLead">
              Right HR supports every part of the talent lifecycle—while keeping people in control.
            </p>
          </header>

          <div className="grid3">
            {PERSONAS.map((p) => (
              <div key={p.title} className="card personaCard">
                <div className="personaIcon">{p.icon}</div>
                <h3 className="h3">{p.title}</h3>
                <p className="bodyText">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOVERNANCE */}
      <section className="section sectionLight">
        <div className="container twoCol">
          <div>
            <h2 className="h2">Trust & governance</h2>
            <p className="lead">
              AI can move fast—but HR decisions must be fair, explainable, and secure. Right HR bakes
              governance into every recommendation.
            </p>

            <ul className="checklist">
              {GOVERNANCE.map((g) => (
                <li key={g}>
                  <span className="check" aria-hidden="true">
                    ✓
                  </span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel" aria-label="Example governance panel">
            <div className="panelHeader">
              <div className="panelTitle">Recommendation Details</div>
              <div className="panelBadge">Explainable</div>
            </div>

            <div className="panelBody">
              <div className="panelRow">
                <div className="k">Suggested Role</div>
                <div className="v">Data Analyst II</div>
              </div>

              <div className="panelRow">
                <div className="k">Match Score</div>
                <div className="v">
                  <span className="meter">
                    <span className="meterFill" style={{ width: "78%" }} />
                  </span>
                  <span className="meterLabel">78%</span>
                </div>
              </div>

              <div className="divider" />

              <div className="miniTitle">Why this was recommended</div>
              <div className="miniText">
                Strong alignment in SQL + reporting. Gap detected in stakeholder communication and
                experimentation.
              </div>

              <div className="divider" />

              <div className="miniTitle">Fairness checks</div>
              <div className="chips">
                <span className="chip">No protected attributes used</span>
                <span className="chip">Bias scan: pass</span>
                <span className="chip">Decision logged</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container ctaInner">
          <h2 className="ctaTitle">Ready to see Right HR inside your company?</h2>
          <p className="ctaSub">
            Create an account to explore recommendations, role matching, and upskilling plans.
          </p>

          <div className="ctaButtons">
            <a className="btn btnPrimary" href="/create-user">
              Create Account
            </a>
            <a className="btn btnSecondary" href="/login">
              Log In
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
    
  );
}

/* ---------- Inline icons ---------- */
function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2zM5 13l.9 3.1L9 17l-3.1.9L5 21l-.9-3.1L1 17l3.1-.9L5 13zm14 0l.9 3.1L23 17l-3.1.9L19 21l-.9-3.1L15 17l3.1-.9L19 13z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPath() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M6 4h12v4H6V4zm0 6h8v4H6v-4zm0 6h12v4H6v-4z" fill="currentColor" />
      <path
        d="M16.5 12.5l1.5-1.5 3 3-3 3-1.5-1.5 1.5-1.5-1.5-1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconStars() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M12 2l2.9 6.2 6.8.7-5.1 4.5 1.5 6.6L12 16.9 5.9 20l1.5-6.6L2.3 8.9l6.8-.7L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
        fill="currentColor"
      />
      <path
        d="M10.3 12.7l-1.6-1.6-1.4 1.4 3 3 6-6-1.4-1.4-4.6 4.6z"
        fill="#fff"
        opacity="0.9"
      />
    </svg>
  );
}
