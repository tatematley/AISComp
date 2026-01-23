import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

import Employees from "./pages/Employees";
import Employee from "./pages/Employee";
import EmployeeEdit from "./pages/EmployeeEdit";
import EmployeeAdd from "./pages/EmployeeAdd";

import Applicants from "./pages/Applicants";
import Applicant from "./pages/Applicant"; 
import ApplicantEdit from "./pages/ApplicantEdit";
import ApplicantAdd from "./pages/ApplicantAdd";

import Jobs from "./pages/Jobs";
import Job from "./pages/Job";
import JobEdit from "./pages/JobEdit";
import JobAdd from "./pages/JobAdd";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Employees (internal candidates) */}
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/:id" element={<Employee />} />
      <Route path="/employees/:id/edit" element={<EmployeeEdit />} />
      <Route path="/employees/new" element={<EmployeeAdd />} />


      {/* Applicants (non-internal candidates) */}
      <Route path="/applicants" element={<Applicants />} />
      <Route path="/applicants/:id" element={<Applicant />} />
      <Route path="/applicants/:id/edit" element={<ApplicantEdit />} />
      <Route path="/applicants/new" element={<ApplicantAdd />} />


      {/* Jobs */}
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<Job />} />
      <Route path="/jobs/:id/edit" element={<JobEdit />} />
      <Route path="/jobs/new" element={<JobAdd />} />
    </Routes>
  );
};
