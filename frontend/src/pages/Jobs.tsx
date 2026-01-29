import React, { useEffect, useMemo, useState } from "react";
import "../styles/Jobs.css";
import { Link, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

type JobRow = {
  job_id: number;
  job_title: string | null;
  job_category: string | null;
  job_description: string | null;
  department: string | null;
  job_status_id: number | null;
  job_location: string | null;
  work_status: string | null;
};

const PAGE_SIZE = 20;

// Optional: map status ids to labels if you want it readable in the table
const statusLabel = (id: number | null) => {
  if (id == null) return "—";
  const map: Record<number, string> = {
    1: "Open",
    2: "Closed",
    3: "On hold",
  };
  return map[id] ?? `Status ${id}`;
};

// Optional: keep description short in table view
const clamp = (text: string | null, max = 90) => {
  if (!text) return "—";
  const t = text.trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: update endpoint to whatever your API is
        const res = await fetch("http://localhost:5050/api/jobs");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = (await res.json()) as JobRow[];
        setJobs(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((j) => {
      const haystack = [
        j.job_title ?? "",
        j.job_category ?? "",
        j.department ?? "",
        j.job_location ?? "",
        j.work_status ?? "",
        j.job_description ?? "",
        statusLabel(j.job_status_id),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [jobs, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <>
      <AdminNavbar />
      <main className="jobsPage">
        <header className="jobsHeader">
          <div className="jobsTitleBlock">
            <h1 className="jobsTitle">Jobs</h1>
            <span
              className="jobsAddAction"
              role="button"
              tabIndex={0}
              aria-label="Add new job"
              onClick={() => navigate("/jobs/new")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/jobs/new");
                }
              }}
            >
              <span className="jobsAddText">New Job</span>
            </span>

            <p className="jobsSubtitle">Search and manage job postings.</p>
          </div>

          <div className="jobsSearchWrap">
            <input
              className="jobsSearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, department, location…"
              aria-label="Search jobs"
            />
          </div>
        </header>

        <section className="jobsCard">
          <div className="jobsTableHead">
            <div>Title</div>
            <div>Department</div>
            <div>Location</div>
            <div>Status</div>
          </div>

          {loading && <div className="jobsState">Loading…</div>}
          {error && <div className="jobsState error">Error: {error}</div>}

          {!loading && !error && pageRows.length === 0 && (
            <div className="jobsState">No jobs found.</div>
          )}

          {!loading &&
            !error &&
            pageRows.map((j) => (
              <Link
                to={`/jobs/${j.job_id}`}
                className="jobsRowLink"
                key={j.job_id}
                aria-label={`Open job ${j.job_title ?? j.job_id}`}
              >
                <div className="jobsTitleCell">
                  <div className="jobsPrimary">
                    {j.job_title ?? `Job ${j.job_id}`}
                  </div>
                  <div className="jobsSecondary">
                    {j.job_category ?? "—"} • {j.work_status ?? "—"}
                  </div>
                  <div className="jobsDesc">
                    {clamp(j.job_description, 110)}
                  </div>
                </div>

                <div className="jobsCell">{j.department ?? "—"}</div>
                <div className="jobsCell">{j.job_location ?? "—"}</div>
                <div className="jobsCell">{statusLabel(j.job_status_id)}</div>
              </Link>
            ))}

          <footer className="jobsFooter">
            <div className="jobsCount">
              Showing{" "}
              <strong>
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong>{filtered.length}</strong>
            </div>

            <div className="jobsPager">
              <button
                className="jobsPagerBtn"
                onClick={goPrev}
                disabled={page === 1}
              >
                Prev
              </button>
              <div className="jobsPagerInfo">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
              <button
                className="jobsPagerBtn"
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
