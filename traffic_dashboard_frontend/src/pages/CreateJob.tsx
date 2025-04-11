import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";

export default function CreateJob() {
  const [jobName, setJobName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  

  const handleCreateJob = async () => {
    if (!jobName) {
      toast.error("Please enter a job name.");
      return;
    }

    try {
      await api.post("/jobs/create/", { name: jobName });
      toast.success("✅ Job created successfully!");
    } catch (error) {
      toast.error("❌ Job creation failed.");
    }
  };

  return (
    <div className="pt-16"> {/* Ensures space for Navbar & Sidebar */}
      <h1 className="text-2xl font-bold mb-4">📝 Create Job</h1>
      <input 
        type="text" 
        value={jobName} 
        onChange={(e) => setJobName(e.target.value)}
        placeholder="Enter job name"
        className="border p-2 rounded"
      />
      <button onClick={handleCreateJob} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition">Create</button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}