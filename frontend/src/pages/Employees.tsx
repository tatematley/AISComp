import { useEffect, useMemo, useState } from "react";
import "../styles/Employees.css";
import AdminNavbar from "../components/AdminNavbar";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { isManager } from "../lib/auth";


type EmployeeRow = {
  candidate_id: number;
  name: string | null;
  position: string | null;
  email: string | null;
  phone_number: string | null;
};

const PAGE_SIZE = 20;

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = isManager();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/api/candidates");
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = (await res.json()) as EmployeeRow[];
        setEmployees(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((e) => {
      const haystack = [
        e.name ?? "",
        e.position ?? "",
        e.email ?? "",
        e.phone_number ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [employees, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset to page 1 when search changes (prevents “empty page” confusion)
  useEffect(() => {
    setPage(1);
  }, [query]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));


  return (
    <>
    <AdminNavbar />
    <main className="employeesPage">
      <header className="employeesHeader">
        <div className="employeesTitleBlock">
            <h1 className="employeesTitle">Employees</h1>
            {canEdit && (
              <span
                className="employeesAddAction"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/employees/new")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate("/employees/new");
                }}
              >
                <span className="employeesAddIcon">+</span>
                <span>New Employee</span>
              </span>
            )}

            <p className="employeesSubtitle">Search and manage employee records.</p>
        </div>


        <div className="employeesSearchWrap">
          <input
            className="employeesSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, email, phone…"
            aria-label="Search employees"
          />
        </div>
      </header>

      <section className="employeesCard">
        <div className="employeesTableHead">
          <div>Name</div>
          <div>Position</div>
          <div>Email</div>
          <div>Phone</div>
        </div>

        {loading && <div className="employeesState">Loading…</div>}
        {error && <div className="employeesState error">Error: {error}</div>}

        {!loading && !error && pageRows.length === 0 && (
          <div className="employeesState">No employees found.</div>
        )}

        {!loading &&
            !error &&
            pageRows.map((e) => (
              <div
                key={e.candidate_id}
                className="employeesRowLink"
                role="link"
                tabIndex={0}
                aria-label={`Open employee ${e.name ?? e.candidate_id}`}
                onClick={() =>
                  navigate(`/employees/${e.candidate_id}`, {
                    state: { from: location.pathname + location.search },
                  })
                }
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    navigate(`/employees/${e.candidate_id}`, {
                      state: { from: location.pathname + location.search },
                    });
                  }
                }}
              >
                <div className="employeesName">
                  {e.name ?? `Candidate ${e.candidate_id}`}
                </div>

                <div className="employeesCell">{e.position ?? "—"}</div>

                <div className="employeesCell">
                  {e.email ? (
                    <a
                      className="employeesLink"
                      href={`mailto:${e.email}`}
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      {e.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="employeesCell">{e.phone_number ?? "—"}</div>
              </div>
            ))
          }


        <footer className="employeesFooter">
          <div className="employeesCount">
            Showing{" "}
            <strong>
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            of <strong>{filtered.length}</strong>
          </div>

          <div className="employeesPager">
            <button
              className="employeesPagerBtn"
              onClick={goPrev}
              disabled={page === 1}
            >
              Prev
            </button>
            <div className="employeesPagerInfo">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>
            <button
              className="employeesPagerBtn"
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
