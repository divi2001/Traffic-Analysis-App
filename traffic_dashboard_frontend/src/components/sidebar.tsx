// Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import logo from "../assets/MHC logo Final FIle-01.png"; 
import { 
  FiUpload, 
  FiFilePlus, 
  FiFolder, 
  FiPieChart,
  FiLogOut,
  FiArchive,
  FiVideo 
} from "react-icons/fi";

export default function Sidebar() {
  const auth = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    // { path: "/upload", label: "Upload Video", icon: <FiUpload /> },
    { path: "/create-job", label: "Create New Job", icon: <FiFilePlus /> },
    // { path: "/jobs", label: "My Jobs", icon: <FiFolder /> },
    // { path: "/dashboard", label: "Job Dashboard", icon: <FiPieChart /> },
    { path: "/historical-surveys", label: "Historical Surveys", icon: <FiArchive /> },
    { path: "/example-videos", label: "Example Output", icon: <FiVideo /> }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} style={{height: "6rem"}} alt="MHC Traffic Logo" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <button 
        onClick={auth?.logout} 
        className="sidebar-logout"
      >
        <FiLogOut className="logout-icon" />
        Logout
      </button>
    </aside>
  );
}