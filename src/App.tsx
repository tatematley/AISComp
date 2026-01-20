import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Profile from "./components/Profile"
import Jobs from "./pages/Jobs";

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
    </Routes>
  );
}
