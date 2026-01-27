import AdminNavbar from "../components/AdminNavbar";
import "../styles/Dashboard.css";

export default function Dashboard() {
  return (
    <>
      <AdminNavbar userName="Admin" />

      <div className="dashboardWithAdminNav">
        {/* Page header */}
        <div className="dashboardPageHeader">
          <div className="dashboardPageHeaderInner">
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
            src="https://public.tableau.com/views/AISDashboard/Dashboard?:embed=yes&:showVizHome=no&:toolbar=no"
            allowFullScreen
          />
        </div>
      </div>
    </>
  );
}
