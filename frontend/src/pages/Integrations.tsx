import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  Globe,
  Link2,
  PlayCircle,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/Integrations.css";

type Mode = "create" | "manage";
type Category =
  | "Explore"
  | "Recommended"
  | "Job Boards"
  | "Sourcing"
  | "Analytics"
  | "Custom";

type IntegrationItem = {
  id: string;
  name: string;
  category: Category;
  shortLabel: string;
  accent: string;
  description: string;
  summary: string;
  learnMoreLabel: string;
  templateCopy: string;
  steps: string[];
  status: string;
};

const categories: Category[] = [
  "Explore",
  "Recommended",
  "Job Boards",
  "Sourcing",
  "Analytics",
  "Custom",
];

const integrations: IntegrationItem[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Recommended",
    shortLabel: "in",
    accent: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
    description:
      "Showcase open roles, track inbound interest, and keep your hiring pipeline looking connected across your recruiting stack.",
    summary:
      "Present LinkedIn as your primary professional-network integration for syncing promoted openings and candidate flow into AIS Comp.",
    learnMoreLabel: "View posting flow",
    templateCopy:
      "When a new LinkedIn applicant is received, create an applicant record and route the profile into your active hiring queue.",
    steps: [
      "Choose the LinkedIn company account you want to connect.",
      "Select which job postings should appear in AIS Comp.",
      "Review a mock sync summary and activate the workflow.",
    ],
    status: "Popular",
  },
  {
    id: "indeed",
    name: "Indeed",
    category: "Job Boards",
    shortLabel: "ID",
    accent: "linear-gradient(135deg, #1f4fde 0%, #16267d 100%)",
    description:
      "Create the impression of a high-volume applicant feed with job visibility, application intake, and streamlined recruiter review.",
    summary:
      "Use Indeed to stage a reliable pipeline for public role distribution and fast application collection in one place.",
    learnMoreLabel: "Preview recruiter sync",
    templateCopy:
      "When an Indeed application arrives, add the candidate to this workspace and flag matching roles for recruiter review.",
    steps: [
      "Pick the Indeed employer profile to mirror.",
      "Map open jobs to your AIS Comp requisitions.",
      "Save the mock automation and open the management dashboard.",
    ],
    status: "High volume",
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    category: "Analytics",
    shortLabel: "GD",
    accent: "linear-gradient(135deg, #0caa6d 0%, #056443 100%)",
    description:
      "Frame Glassdoor as a brand and applicant-insight channel with reputation visibility and candidate intent signals.",
    summary:
      "Position Glassdoor as a source for employer-brand visibility paired with applicant engagement insights for recruiters.",
    learnMoreLabel: "See brand insights",
    templateCopy:
      "When a candidate engages from Glassdoor, generate an applicant profile and surface employer-brand context for the hiring team.",
    steps: [
      "Select the employer profile to feature.",
      "Choose applicant and brand metrics to display.",
      "Launch the starter workflow and manage reporting from one place.",
    ],
    status: "Insights",
  },
  {
    id: "ziprecruiter",
    name: "ZipRecruiter",
    category: "Sourcing",
    shortLabel: "ZR",
    accent: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    description:
      "Round out the marketplace with another sourcing channel that feels ready for candidate outreach and fast role promotion.",
    summary:
      "Present ZipRecruiter as a sourcing-focused integration for job distribution, candidate flow, and recruiter follow-up.",
    learnMoreLabel: "Review sourcing path",
    templateCopy:
      "When a candidate applies through ZipRecruiter, send the profile to AIS Comp and assign a recruiter follow-up task.",
    steps: [
      "Select the hiring stream to connect.",
      "Choose which roles should accept incoming candidates.",
      "Complete setup to reveal the mock management controls.",
    ],
    status: "Sourcing",
  },
  {
    id: "custom",
    name: "Custom",
    category: "Custom",
    shortLabel: "</>",
    accent: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    description:
      "Offer a flexible custom integration card so your product looks ready for internal tools, niche job boards, or future partners.",
    summary:
      "Use the custom option to simulate bespoke connectors for any recruiting source your team wants to plug into AIS Comp.",
    learnMoreLabel: "Design custom flow",
    templateCopy:
      "When data arrives from a custom source, create a mapped applicant record and assign it to the right hiring workflow.",
    steps: [
      "Name the custom source and describe the use case.",
      "Choose the applicant fields that should be captured.",
      "Generate the starter integration and manage it from this workspace.",
    ],
    status: "Flexible",
  },
];

const categoryIcons: Record<Category, typeof Sparkles> = {
  Explore: Sparkles,
  Recommended: Globe,
  "Job Boards": BriefcaseBusiness,
  Sourcing: Link2,
  Analytics: PlayCircle,
  Custom: Settings2,
};

export default function Integrations() {
  const [mode, setMode] = useState<Mode>("create");
  const [activeCategory, setActiveCategory] = useState<Category>("Explore");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredIntegrations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return integrations.filter((integration) => {
      const matchesCategory =
        activeCategory === "Explore" || integration.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [integration.name, integration.description, integration.summary]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const selectedIntegration = useMemo(() => {
    if (!selectedId) return null;

    return (
      filteredIntegrations.find((integration) => integration.id === selectedId) ??
      integrations.find((integration) => integration.id === selectedId) ??
      null
    );
  }, [filteredIntegrations, selectedId]);

  const actionLabel = mode === "create" ? "Get Started" : "Manage Integration";
  const secondaryLabel = mode === "create" ? "Create draft" : "Open controls";

  return (
    <>
      <AdminNavbar />

      <main className="integrationsPage">
        <section className="integrationsShell">
          <aside className="integrationsSidebar">
            <div className="integrationsSidebarHeader">
              <span className="integrationsEyebrow">AIS Comp</span>
              <h1 className="integrationsSidebarTitle">Integrations</h1>
              <p className="integrationsSidebarText">
                A polished mock marketplace for job-board connections and custom workflows.
              </p>
            </div>

            <div className="integrationsCategoryList">
              {categories.map((category) => {
                const Icon = categoryIcons[category];
                const isActive = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    className={`integrationsCategoryBtn ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategory(category);
                      setSelectedId(null);
                    }}
                  >
                    <span className="integrationsCategoryIcon">
                      <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>

            <div className="integrationsSidebarFoot">
              <div className="integrationsSidebarStat">
                <span className="integrationsSidebarStatLabel">Available</span>
                <strong>{integrations.length} integrations</strong>
              </div>
              <div className="integrationsSidebarMiniGrid" aria-hidden="true">
                {integrations.map((integration) => (
                  <span
                    key={integration.id}
                    className="integrationsSidebarMiniTile"
                    style={{ background: integration.accent }}
                  >
                    {integration.shortLabel}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="integrationsContent">
            <div className="integrationsTopbar">
              <div className="integrationsTitleBlock">
                <p className="integrationsPanelEyebrow">Marketplace</p>
                <h2 className="integrationsMainTitle">Connect your recruiting stack</h2>
              </div>
              <button type="button" className="integrationsLearnBtn">
                <PlayCircle size={18} />
                <span>Learn how</span>
              </button>
            </div>

            <div className="integrationsSearchRow">
              <label className="integrationsSearchWrap" aria-label="Search integrations">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search job boards, sourcing tools, and custom connectors"
                />
              </label>

              <div className="integrationsHeroCard">
                <div>
                  <div className="integrationsHeroLabel">Featured workflow</div>
                  <div className="integrationsHeroTitle">
                    Make AIS Comp look instantly integration-ready for recruiting teams
                  </div>
                </div>
                <button type="button" className="integrationsHeroCta">
                  Explore
                </button>
              </div>
            </div>

            <div className="integrationsPanel">
              <div className="integrationsPanelHeader">
                <div>
                  <p className="integrationsPanelEyebrow">Curated</p>
                  <h2 className="integrationsPanelTitle">Browse integrations</h2>
                </div>
                <span className="integrationsResultsCount">
                  {filteredIntegrations.length} result{filteredIntegrations.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="integrationsGrid" role="list" aria-label="Available integrations">
                {filteredIntegrations.map((integration) => {
                  const isSelected = selectedId === integration.id;

                  return (
                    <button
                      key={integration.id}
                      type="button"
                      className={`integrationsCard ${isSelected ? "selected" : ""}`}
                      style={{ background: integration.accent }}
                      onClick={() => setSelectedId(integration.id)}
                    >
                      <div className="integrationsCardTop">
                        <span className="integrationsCardBadge">{integration.status}</span>
                        <ExternalLink size={16} />
                      </div>
                      <div className="integrationsCardLogo">{integration.shortLabel}</div>
                      <div className="integrationsCardName">{integration.name}</div>
                    </button>
                  );
                })}
              </div>

              {filteredIntegrations.length === 0 && (
                <div className="integrationsEmptyState">
                  No integrations match that search. Try a broader term or switch categories.
                </div>
              )}
            </div>
          </section>
        </section>

        {selectedIntegration && (
          <div
            className="integrationsModalOverlay"
            role="presentation"
            onClick={() => setSelectedId(null)}
          >
            <section
              className="integrationsModal"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedIntegration.name} integration`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="integrationsModalTopbar">
                <div className="integrationsModalBrand">AIS Comp Integrations</div>
                <div
                  className="integrationsModeToggle"
                  role="tablist"
                  aria-label="Integration mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "create"}
                    className={`integrationsModeBtn ${mode === "create" ? "active" : ""}`}
                    onClick={() => setMode("create")}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "manage"}
                    className={`integrationsModeBtn ${mode === "manage" ? "active" : ""}`}
                    onClick={() => setMode("manage")}
                  >
                    Manage
                  </button>
                </div>
                <button
                  type="button"
                  className="integrationsModalClose"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close integration details"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="integrationsModalSearchRow">
                <label className="integrationsSearchWrap" aria-label="Search integrations">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search job boards, sourcing tools, and custom connectors"
                  />
                </label>

                <button type="button" className="integrationsLearnBtn integrationsLearnBtnModal">
                  <PlayCircle size={18} />
                  <span>Learn how</span>
                </button>
              </div>

              <div className="integrationsModalBody">
                <article className="integrationsOverviewCard">
                  <div className="integrationsOverviewBanner">
                    <div
                      className="integrationsOverviewLogo"
                      style={{ background: selectedIntegration.accent }}
                    >
                      {selectedIntegration.shortLabel}
                    </div>

                    <div className="integrationsOverviewCopy">
                      <div className="integrationsOverviewHeader">
                        <h3>{selectedIntegration.name}</h3>
                        <span>{selectedIntegration.status}</span>
                      </div>
                      <p className="integrationsOverviewSummary">
                        {selectedIntegration.summary}
                      </p>
                      <a href="#integrations-get-started" className="integrationsOverviewLink">
                        {selectedIntegration.learnMoreLabel}
                      </a>
                    </div>
                  </div>

                  <div className="integrationsOverviewMeta">
                    <div className="integrationsMetaItem">
                      <span className="integrationsMetaLabel">Overview</span>
                      <p>{selectedIntegration.description}</p>
                    </div>
                    <div className="integrationsMetaItem">
                      <span className="integrationsMetaLabel">Mode</span>
                      <p>
                        {mode === "create"
                          ? "Set up a fresh integration flow for your hiring team."
                          : "Review the controls you would use to update an existing connection."}
                      </p>
                    </div>
                  </div>
                </article>

                <aside className="integrationsActionCard" id="integrations-get-started">
                  <div className="integrationsActionHeader">
                    <span className="integrationsActionPill">
                      {mode === "create" ? "Starter template" : "Management panel"}
                    </span>
                    <h3>{actionLabel}</h3>
                  </div>

                  <p className="integrationsActionText">
                    {selectedIntegration.templateCopy}
                  </p>

                  <div className="integrationsActionButtons">
                    <button type="button" className="integrationsPrimaryBtn">
                      {secondaryLabel}
                    </button>
                    <button type="button" className="integrationsSecondaryBtn">
                      Preview setup
                    </button>
                  </div>

                  <div className="integrationsSteps">
                    {selectedIntegration.steps.map((step, index) => (
                      <div key={step} className="integrationsStep">
                        <span className="integrationsStepNumber">{index + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
