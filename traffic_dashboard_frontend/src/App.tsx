// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Navbar from "./components/Navbar";
import UploadVideo from "./pages/UploadVideo";
import Dashboard from "./pages/Dashboard";
import CreateEditJob from "./pages/CreateEditJob";
import Jobs from "./pages/Jobs";
import Auth from "./pages/Auth";
import HistoricalSurveys from "./pages/HistoricalSurveys";
import ExampleVideos from "./pages/ExampleVideos";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { Toaster } from 'react-hot-toast'; // Add this import
import './App.css';

export default function App() {
  const auth = useContext(AuthContext);
  
  return (
    <div className="app-container">
      {/* Add the Toaster component here */}
      <Toaster position="top-right" />
      
      {auth?.user ? (
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Navbar />
            <div className="content-area">
            <Routes>
              <Route path="/upload" element={<UploadVideo />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/historical-surveys" element={<HistoricalSurveys />} />
              <Route path="/example-videos" element={<ExampleVideos />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-job" element={<CreateEditJob />} />
              <Route path="/edit-job/:jobId" element={<CreateEditJob />} />
              <Route path="/view-job/:jobId" element={<CreateEditJob />} /> {/* New route for viewing job details */}
            </Routes>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      )}
    </div>
  );
}