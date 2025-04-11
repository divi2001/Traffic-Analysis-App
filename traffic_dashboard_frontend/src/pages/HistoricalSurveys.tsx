// src/pages/HistoricalSurveys.tsx
import React, { useState, useEffect } from "react";
import { Search, Download, Loader2, CheckCircle, FileWarning } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

interface Survey {
  id: number;
  job_number: string;
  name: string;
  status: string;
  created_at: string;
  completed_at: string;
  videos: { id: number; filename: string }[];
}

interface Report {
  id: number;
  file_path: string;
  report_type: string;
  generated_at: string;
}

const HistoricalSurveys = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null); // Track which job is downloading

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const response = await api.get("/jobs/historical/");
        console.log("API Response:", response.data);
        setSurveys(response.data);
      } catch (error) {
        toast.error("Failed to load historical surveys");
        console.error("Error fetching surveys:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSurveys();
  }, []);

  const handleDownloadReport = async (jobId: number) => {
    setDownloading(jobId);
    try {
      // First get the reports for this job
      const reportsResponse = await api.get<Report[]>(`/jobs/${jobId}/reports/`);
      
      if (reportsResponse.data.length === 0) {
        toast.error('No reports available for this job');
        return;
      }
  
      // For simplicity, we'll download the most recent report
      const mostRecentReport = reportsResponse.data.reduce((latest, report) => 
        new Date(report.generated_at) > new Date(latest.generated_at) ? report : latest
      );
      
      // Make an authenticated request to download the file
      const downloadResponse = await api.get(
        `/jobs/${jobId}/reports/${mostRecentReport.id}/download`,
        { 
          responseType: 'blob', // Important: specify response type as blob
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        }
      );
      
      // Extract filename from Content-Disposition header if available
      let filename = `report_${jobId}.xlsx`; // Default filename
      const contentDisposition = downloadResponse.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else {
        // Use the original filename from the report file path if no header
        const originalPath = mostRecentReport.file_path;
        const pathParts = originalPath.split('/');
        if (pathParts.length > 0) {
          filename = pathParts[pathParts.length - 1];
        }
      }
      
      // Create a blob URL and trigger download
      const blob = new Blob([downloadResponse.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up
  
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };
  
  const filteredSurveys = surveys.filter(
    survey =>
      survey.job_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "ANALYZING") {  // Changed from "Analyzing" to "ANALYZING"
      return (
        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Analyzing</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Complete</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Historical Surveys</h1>
        
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
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSurveys.map((survey) => (
                <tr
                  key={survey.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {survey.job_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {survey.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={survey.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(survey.completed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {downloading === survey.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600 mx-auto" />
                    ) : (
                      <button
                        onClick={() => handleDownloadReport(survey.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors duration-150"
                        title="Download Reports"
                        disabled={downloading === survey.id}
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricalSurveys;