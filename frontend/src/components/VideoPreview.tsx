import { useEffect, useState } from "react";
import { Play, Download, RefreshCw } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { api } from "../services/api";

function VideoPreview() {
  const { currentJob, setCurrentJob } = useAppStore();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentJob?.status === "completed" && currentJob.result) {
      setVideoUrl(api.getVideoUrl(currentJob.job_id));
    }
  }, [currentJob]);

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `voxvideo-${currentJob?.job_id}.mp4`;
      a.click();
    }
  };

  const handleReset = () => {
    setCurrentJob(null);
    setVideoUrl(null);
  };

  const renderProgress = () => {
    if (!currentJob) return null;

    const { status, progress } = currentJob;

    const stages = [
      { key: "transcribe", label: "Transcribing", threshold: 0.3 },
      { key: "generate", label: "Generating Video", threshold: 0.8 },
      { key: "voiceover", label: "Adding Voiceover", threshold: 0.95 },
      { key: "complete", label: "Complete", threshold: 1.0 },
    ];

    const currentStage =
      stages.find((s) => progress < s.threshold) || stages[stages.length - 1];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">{currentStage.label}</span>
          <span className="text-gray-400">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {status === "running" && (
          <p className="text-sm text-gray-400 text-center">
            This may take a few minutes depending on your GPU...
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Preview</h2>
        {videoUrl && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="New Video"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="max-w-full max-h-full object-contain"
          />
        ) : currentJob ? (
          <div className="w-full px-8">{renderProgress()}</div>
        ) : (
          <div className="text-center text-gray-500">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Your generated video will appear here</p>
          </div>
        )}
      </div>

      {currentJob?.status === "failed" && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">
            Generation failed: {currentJob.error}
          </p>
        </div>
      )}

      {currentJob?.result?.prompt && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Prompt:</p>
          <p className="text-sm text-gray-200">{currentJob.result.prompt}</p>
        </div>
      )}
    </div>
  );
}

export default VideoPreview;
