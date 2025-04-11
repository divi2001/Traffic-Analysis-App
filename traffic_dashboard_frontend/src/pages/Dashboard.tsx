// src/pages/Dashboard.tsx
import { useEffect, useState, useRef } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";


interface Job {
  id: number;
  job_number: string;
  name: string;
  status: string;
  videos: { id: number; filename: string }[];
  created_at: string;
  completed_at: string | null;
  latitude: string | null;
  longitude: string | null;
  additional_notes: string | null;
  survey_hours: string | null;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [scrollToJob, setScrollToJob] = useState<number | null>(null);
  const jobRefs = useRef<{[key: number]: HTMLTableRowElement | null}>({});

  useEffect(() => {
    async function fetchJobs() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        const response = await api.get("/jobs/dashboard/");
        setJobs(response.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load jobs";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
    
    // Set up polling to refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.scrollToJob) {
      setScrollToJob(location.state.scrollToJob);
    }
  }, [location.state]);

  useEffect(() => {
    if (scrollToJob && jobRefs.current[scrollToJob]) {
      // Find the job in the jobs array
      const newJob = jobs.find(job => job.id === scrollToJob);
      
      if (newJob) {
        toast.success(
          `Job ${newJob.job_number} is now being analyzed!`, 
          { duration: 4000 }
        );
      }
      
      jobRefs.current[scrollToJob]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Reset after scrolling
      setScrollToJob(null);
    }
  }, [scrollToJob, jobs]);

  const filteredJobs = jobs.filter(
    job =>
      job.job_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "ANALYZING") {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Analyzing</span>
        </div>
      );
    }
    // Add other status cases if needed
    return null;
  };

  const handleRowClick = (job: Job) => {
    navigate(`/view-job/${job.id}`);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Job Dashboard</h1>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Search by job number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-4 text-5xl">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No analyzing jobs</h3>
          <p className="text-gray-500">All jobs are either pending or complete</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Number</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    ref={(el) => { jobRefs.current[job.id] = el; }}
                    className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                      scrollToJob === job.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleRowClick(job)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.job_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {job.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : 'Awaiting'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {job.videos.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the row click event
                          handleRowClick(job);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}