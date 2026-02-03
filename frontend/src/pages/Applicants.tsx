import { useEffect, useMemo, useState } from "react";
import "../styles/Applicants.css";
import { Link, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";

type ApplicantRow = {
  candidate_id: number;
  name: string | null;
  position: string | null;
  email: string | null;
  phone_number: string | null;
  application_date: string | null;
  internal: boolean; // still needed for filtering, not displayed
};

type ApplicantFilter = "all" | "internal" | "external";

const PAGE_SIZE = 20;

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Applicants() {
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ApplicantFilter>("all");

  const navigate = useNavigate();
  const canEdit = isManager();

  /* ----------------------------- Fetch applicants ----------------------------- */
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch(`/api/applicants?filter=${filter}`);

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = (await res.json()) as ApplicantRow[];
        setApplicants(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load applicants");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [filter, navigate]);

  /* ----------------------------- Search filtering ----------------------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applicants;

    return applicants.filter((a) => {
      const haystack = [
        a.name ?? "",
        a.position ?? "",
        a.email ?? "",
        a.phone_number ?? "",
        a.application_date ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [applicants, query]);

  /* ----------------------------- Pagination ----------------------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => setPage(1), [query, filter]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  /* ----------------------------- Render ----------------------------- */
  return (
    <>
      <AdminNavbar />

      <main className="applicantsPage">
        <header className="applicantsHeader">
          <div className="applicantsTitleBlock">
            <h1 className="applicantsTitle">Applicants</h1>

            {canEdit && (
              <span
                className="applicantsAddAction"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/applicants/new")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/applicants/new");
                  }
                }}
              >
                <span className="applicantsAddIcon">+</span>
                <span>New Applicant</span>
              </span>
            )}

            <p className="applicantsSubtitle">Search and manage applicants.</p>

            <div className="applicantSegmented">
              <button
                type="button"
                className={`segment ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={`segment ${filter === "internal" ? "active" : ""}`}
                onClick={() => setFilter("internal")}
              >
                Internal
              </button>

              <button
                type="button"
                className={`segment ${filter === "external" ? "active" : ""}`}
                onClick={() => setFilter("external")}
              >
                External
              </button>
            </div>
          </div>

          <div className="applicantsSearchWrap">
            <input
              className="applicantsSearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, position, email, phone…"
              aria-label="Search applicants"
            />
          </div>
        </header>

        <section className="applicantsCard">
          <div className="applicantsTableHead">
            <div>Name</div>
            <div>Position</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Applied</div>
          </div>

          {loading && <div className="applicantsState">Loading…</div>}
          {error && <div className="applicantsState error">Error: {error}</div>}

          {!loading && !error && pageRows.length === 0 && (
            <div className="applicantsState">No applicants found.</div>
          )}

          {!loading &&
            !error &&
            pageRows.map((a) => (
              <Link
                to={`/applicants/${a.candidate_id}`}
                className="applicantsRowLink"
                key={a.candidate_id}
              >
                <div className="applicantsName">
                  {a.name ?? `Candidate ${a.candidate_id}`}
                </div>

                <div className="applicantsCell">{a.position ?? "—"}</div>

                <div className="applicantsCell">
                  {a.email ? (
                    <a
                      className="applicantsLink"
                      href={`mailto:${a.email}`}
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      {a.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="applicantsCell">{a.phone_number ?? "—"}</div>

                <div className="applicantsCell">
                  {formatDate(a.application_date)}
                </div>
              </Link>
            ))}

          <footer className="applicantsFooter">
            <div className="applicantsCount">
              Showing{" "}
              <strong>
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong>{filtered.length}</strong>
            </div>

            <div className="applicantsPager">
              <button
                className="applicantsPagerBtn"
                onClick={goPrev}
                disabled={page === 1}
              >
                Prev
              </button>
              <div className="applicantsPagerInfo">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
              <button
                className="applicantsPagerBtn"
                onClick={goNext}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}
