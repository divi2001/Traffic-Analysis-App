// Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/original1.jpeg";
import { FiHome, FiUpload, FiPlusSquare } from "react-icons/fi";

export default function Navbar() {
  const location = useLocation();
  
  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <FiHome /> },
    // { path: "/upload", label: "Upload", icon: <FiUpload /> },
    { path: "/create-job", label: "Create Job", icon: <FiPlusSquare /> }
  ];

  return (
    <header className="navbar">
      <div className="navbar-brand">
        {/* <img src={logo} alt="Logo" className="navbar-logo" /> */}
        {/* <h1>Vehicle Processing</h1> */}
      </div>

      <nav className="navbar-links">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}