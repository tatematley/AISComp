import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/Profile.css";

type EmployeeProfile = {
  candidate_id: number;
  name: string;
  profile_photo?: string | null;
  email?: string | null;
  phone_number?: string | null;

  current_role?: string | null;
  department_name?: string | null;
  location_name?: string | null;
  education_level?: string | null;
  years_exp?: number | null;
  availability_hours?: number | null;
  start_date?: string | null;

  internal?: boolean | null;
  tenure?: number | null;
  performance_rating?: number | null;
  pip?: boolean | null;
};

export default function Profile() {
  const { id } = useParams();

  // TEMP: dummy data for layout (swap to fetch later)
  const data: EmployeeProfile = useMemo(
    () => ({
      candidate_id: Number(id || 0),
      name: "Jordan Lee",
      profile_photo: "/images/profile-placeholder.png", // put a placeholder in public/images
      email: "jordan.lee@email.com",
      phone_number: "555-0101",
      current_role: "Data Analyst",
      department_name: "Analytics",
      location_name: "HQ - Provo, UT",
      education_level: "Bachelor’s",
      years_exp: 2,
      availability_hours: 40,
      start_date: "2025-08-01",
      internal: true,
      tenure: 1.8,
      performance_rating: 4,
      pip: false,
    }),
    [id]
  );

  return (
    <main className="profilePage">
      <div className="profileTopBar">
        <Link to="/employees" className="profileBack">
          ← Back to Employees
        </Link>
      </div>

      <section className="profileCard">
        <div className="profileHeader">
          <div className="profileAvatarWrap">
            <img
              className="profileAvatar"
              src={data.profile_photo || "/images/parker.jpeg"}
              alt={`${data.name} headshot`}
            />
          </div>

          <div className="profileHeaderInfo">
            <h1 className="profileName">{data.name}</h1>
            <p className="profileMeta">
              {data.current_role || "—"}{" "}
              <span className="profileDot">•</span>{" "}
              {data.department_name || "—"}{" "}
              <span className="profileDot">•</span>{" "}
              {data.location_name || "—"}
            </p>

            <div className="profileChips">
              {data.internal ? (
                <span className="profileChip strong">Internal</span>
              ) : (
                <span className="profileChip">External</span>
              )}
              {data.pip ? (
                <span className="profileChip danger">PIP</span>
              ) : (
                <span className="profileChip">Good standing</span>
              )}
              {typeof data.performance_rating === "number" && (
                <span className="profileChip">
                  Rating: {data.performance_rating}/5
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profileGrid">
          <div className="profileSection">
            <h2 className="profileSectionTitle">Contact</h2>

            <div className="profileField">
              <div className="profileLabel">Email</div>
              <a className="profileValueLink" href={`mailto:${data.email ?? ""}`}>
                {data.email || "—"}
              </a>
            </div>

            <div className="profileField">
              <div className="profileLabel">Phone</div>
              <a className="profileValueLink" href={`tel:${data.phone_number ?? ""}`}>
                {data.phone_number || "—"}
              </a>
            </div>
          </div>

          <div className="profileSection">
            <h2 className="profileSectionTitle">Job info</h2>

            <div className="profileField">
              <div className="profileLabel">Position</div>
              <div className="profileValue">{data.current_role || "—"}</div>
            </div>

            <div className="profileField">
              <div className="profileLabel">Department</div>
              <div className="profileValue">{data.department_name || "—"}</div>
            </div>

            <div className="profileField">
              <div className="profileLabel">Start date</div>
              <div className="profileValue">{data.start_date || "—"}</div>
            </div>
          </div>

          <div className="profileSection">
            <h2 className="profileSectionTitle">Background</h2>

            <div className="profileField">
              <div className="profileLabel">Education</div>
              <div className="profileValue">{data.education_level || "—"}</div>
            </div>

            <div className="profileField">
              <div className="profileLabel">Years experience</div>
              <div className="profileValue">
                {typeof data.years_exp === "number" ? data.years_exp : "—"}
              </div>
            </div>

            <div className="profileField">
              <div className="profileLabel">Availability</div>
              <div className="profileValue">
                {typeof data.availability_hours === "number"
                  ? `${data.availability_hours} hrs/wk`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="profileSection">
            <h2 className="profileSectionTitle">Location</h2>

            <div className="profileField">
              <div className="profileLabel">Office</div>
              <div className="profileValue">{data.location_name || "—"}</div>
            </div>

            <div className="profileField">
              <div className="profileLabel">Tenure</div>
              <div className="profileValue">
                {typeof data.tenure === "number" ? `${data.tenure} yrs` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* reserved space for recommenders later */}
        <div className="profileFuture">
          <div className="profileFutureInner">
            Recommenders will live here later.
          </div>
        </div>
      </section>
    </main>
  );
}
