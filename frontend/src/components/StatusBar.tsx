import type { JobStatus } from "../types";

interface StatusBarProps {
  job: JobStatus | null;
}

function StatusBar({ job }: StatusBarProps) {
  const getStatusColor = () => {
    if (!job) return "bg-gray-600";
    switch (job.status) {
      case "pending":
        return "bg-yellow-500";
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusText = () => {
    if (!job) return "Ready";
    switch (job.status) {
      case "pending":
        return "Queued";
      case "running":
        return `Processing (${Math.round(job.progress * 100)}%)`;
      case "completed":
        return "Complete";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <footer className="bg-gray-800 border-t border-gray-700 px-6 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-gray-400">{getStatusText()}</span>
        </div>
        <div className="text-gray-500">VoxVideo Studio v0.1.0</div>
      </div>
    </footer>
  );
}

export default StatusBar;
