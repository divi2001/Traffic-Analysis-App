// JobCard.tsx
import { FiVideo } from "react-icons/fi";
import { format } from "date-fns";

interface Job {
  id: number;
  name: string;
  status: string;
  videos: { id: number; filename: string }[];
  createdAt: string;
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const statusStyles = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-100"
    },
    processing: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-100"
    },
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-100"
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid date" : format(date, "MMM d, yyyy h:mm a");
    } catch {
      return "Invalid date";
    }
  };
  

  const status = job.status.toLowerCase();
  const styles = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;

  return (
    <div className={`job-card ${styles.bg} ${styles.border} border rounded-xl transition-all hover:shadow-md`}>
      <div className="job-card-header">
        <h3 className="job-title font-medium text-gray-900">{job.name}</h3>
        <span className={`status-badge text-xs font-semibold px-2 py-1 rounded-full ${styles.text} ${styles.bg}`}>
          {job.status}
        </span>
      </div>

      <div className="job-meta text-sm text-gray-500 mt-1">
        Created: {formatDate(job.createdAt)}
      </div>

      {job.videos.length > 0 && (
        <div className="mt-3">
          <h4 className="videos-title text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Videos ({job.videos.length})
          </h4>
          <ul className="videos-list mt-2 space-y-1">
            {job.videos.slice(0, 3).map((video) => (
              <li key={video.id} className="flex items-start">
                <FiVideo className="video-icon mt-0.5 mr-2 flex-shrink-0 text-gray-400" size={14} />
                <span className="text-sm text-gray-700 line-clamp-1">{video.filename}</span>
              </li>
            ))}
            {job.videos.length > 3 && (
              <li className="text-xs text-gray-500">
                +{job.videos.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}