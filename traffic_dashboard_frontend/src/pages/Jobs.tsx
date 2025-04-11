import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";

interface Job {
  id: number;
  name: string;
  status: string;
  videos: { id: number; filename: string }[];
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserJobs() {
      try {
        const response = await api.get("/jobs/list/");  // Fetch jobs for logged-in user
        setJobs(response.data);
      } catch (error) {
        toast.error("Failed to load jobs.");
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserJobs();
  }, []);

  return (
    <div className="pt-16">
      <h1 className="text-2xl font-bold mb-4">📝 My Jobs</h1>

      {loading ? (
        <p className="text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">No jobs found.</p>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id} className="border p-4 rounded">
              <h2 className="text-lg font-semibold">{job.name}</h2>
              <p className="font-bold text-sm">
                Status: 
                <span className={
                  job.status === "pending" ? "text-yellow-500" :
                  job.status === "processing" ? "text-blue-500" :
                  "text-green-500"
                }>
                  {" "}{job.status}
                </span>
              </p>
              <h3 className="mt-2 font-semibold">Assigned Videos:</h3>
              <ul className="list-disc ml-5">
                {job.videos.map((video) => (
                  <li key={video.id} className="text-gray-700">🎥 {video.filename}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}