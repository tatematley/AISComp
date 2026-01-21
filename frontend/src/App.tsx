import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import Applicants from "./pages/Applicants";
import Job from "./pages/Job";
import ProfileEdit from "./pages/ProfileEdit";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Admin pages */}
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/:id" element={<Profile />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<Job />} />
      <Route path="/applicants" element={<Applicants />} />
      {/* Edit pages */}
      <Route path="/employees/:id/edit" element={<ProfileEdit />} />
    </Routes>
  );
}




