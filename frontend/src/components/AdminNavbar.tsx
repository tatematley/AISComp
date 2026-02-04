import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../styles/AdminNavbar.css";

type NavbarProps = {
  userImageUrl?: string;
  onLogout?: () => void;
};

export default function Navbar({ userImageUrl, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const userPhotoMap: Record<string, string> = {
    tatematley: "/images/profiles/tate.jpeg",
    sarahboyer: "/images/profiles/sarah.jpeg",
    zburnsie: "/images/profiles/zach.jpeg",
  };

  const getStoredUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();

  const username = storedUser?.username ?? "User";

  const roleLabel =
    storedUser?.role === "manager"
      ? "Manager"
      : storedUser?.role === "employee"
      ? "Employee"
      : "User";

  const resolvedUserImage =
    userImageUrl ??
    userPhotoMap[username] ??
    "/images/profiles/default-avatar.png";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setOpen(false);
    onLogout?.();
    navigate("/", { replace: true });
  };

  return (
    <header className="adminNav">
      <div className="adminNavInner">
        <div className="adminNavLeft">
          <NavLink to="/" className="adminNavLogoLink" aria-label="Right HR Home">
            <img
              src="/images/logoSide.png"
              alt="Right HR"
              className="adminNavLogo"
            />
          </NavLink>
        </div>

        <nav className="adminNavCenter">
          <nav className="adminNavLinks" aria-label="Primary">
            <NavLink to="/dashboard" className={({ isActive }) =>
              `adminNavLink ${isActive ? "active" : ""}`
            }>
              Dashboard
            </NavLink>
            <NavLink to="/employees" className={({ isActive }) =>
              `adminNavLink ${isActive ? "active" : ""}`
            }>
              Employees
            </NavLink>
            <NavLink to="/jobs" className={({ isActive }) =>
              `adminNavLink ${isActive ? "active" : ""}`
            }>
              Jobs
            </NavLink>
            <NavLink to="/applicants" className={({ isActive }) =>
              `adminNavLink ${isActive ? "active" : ""}`
            }>
              Applicants
            </NavLink>
          </nav>
        </nav>

        <div className="adminNavRight">
          <div className="adminNavUser" ref={menuRef}>
            <button
              className="adminNavUserBtn"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Open user menu"
              type="button"
            >
              <img
                className="adminNavAvatar"
                src={resolvedUserImage}
                alt={username}
              />
            </button>

            {open && (
              <div className="adminNavMenu" role="menu">
                <div className="adminNavMenuHeader">
                  {/* Username on top */}
                  <div className="adminNavMenuName">{username}</div>

                  {/* Role underneath */}
                  <div className="adminNavMenuSub">{roleLabel}</div>
                </div>

                <button
                  className="adminNavMenuItem"
                  role="menuitem"
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
