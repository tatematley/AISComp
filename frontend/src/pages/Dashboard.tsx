import AdminNavbar from "../components/AdminNavbar";
import "../styles/Dashboard.css";

export default function Dashboard() {
  return (
    <>
      <AdminNavbar />

      <div className="dashboardPage">
        <div className="dashboardHeader">
          <div className="dashboardTitleBlock">
            <h1 className="dashboardTitle">Analytics Dashboard</h1>
            <div className="dashboardSubtitle">
              Hiring pipeline, applicants, and employee insights
            </div>
          </div>
        </div>

        {/* Dashboard card */}
        <div className="dashboardCard">
          <iframe
            className="dashboardIframe"
            src="https://public.tableau.com/views/AIS_comp_Sarah/Dashboard2?:embed=y&:display_count=yes&:showVizHome=no&:toolbar=yes"
            allowFullScreen
          />
        </div>
      </div>
    </>
  );
}
