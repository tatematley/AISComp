import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../styles/AdminNavbar.css";

type NavbarProps = {
  userName?: string; // optional (you can wire this up later)
  userImageUrl?: string; // optional
  onLogout?: () => void; // optional for now
};

export default function Navbar({
  userName = "Admin",
  userImageUrl,
  onLogout,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="adminNav">
      <div className="adminNavInner">
        <div className="adminNavLeft">
        {/* Left: Logo */}
            <NavLink to="/" className="adminNavLogoLink" aria-label="Right HR Home">
            <img
                src="/images/logoSide.png"
                alt="Right HR"
                className="adminNavLogo"
            />
            </NavLink>
        </div>

        {/* Middle: Links */}
        <nav className="adminNavCenter">
            <nav className="adminNavLinks" aria-label="Primary">
            <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                `adminNavLink ${isActive ? "active" : ""}`
                }
            >
                Dashboard
            </NavLink>
            <NavLink
                to="/employees"
                className={({ isActive }) =>
                `adminNavLink ${isActive ? "active" : ""}`
                }
            >
                Employees
            </NavLink>
            <NavLink
                to="/jobs"
                className={({ isActive }) =>
                `adminNavLink ${isActive ? "active" : ""}`
                }
            >
                Jobs
            </NavLink>
            <NavLink
                to="/applicants"
                className={({ isActive }) =>
                `adminNavLink ${isActive ? "active" : ""}`
                }
            >
                Applicants
            </NavLink>
            </nav>
        </nav>

        {/* Right: User */}
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
                src={userImageUrl ?? "/images/tate.jpeg"}
                alt={userName}
                />
            </button>

            {open && (
                <div className="adminNavMenu" role="menu">
                <div className="adminNavMenuHeader">
                    <div className="adminNavMenuName">{userName}</div>
                    <div className="adminNavMenuSub">Signed in</div>
                </div>

                <button
                    className="adminNavMenuItem"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                    setOpen(false);
                    onLogout?.();
                    }}
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
