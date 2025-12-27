import { useState } from "react";
import { Wand2 } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { api } from "../services/api";

function TextInput() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { setCurrentJob, settings } = useAppStore();

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const { job_id } = await api.startPipeline({
        text: prompt,
        generateVoiceover: settings.generation.generateVoiceover,
        voiceReferenceId: settings.generation.voiceReferenceId || undefined,
        videoResolution: settings.generation.resolution,
        videoFrames: settings.generation.numFrames,
      });

      const pollJob = async () => {
        const status = await api.getJobStatus(job_id);
        setCurrentJob(status);

        if (status.status === "running" || status.status === "pending") {
          setTimeout(pollJob, 1000);
        } else {
          setIsGenerating(false);
        }
      };

      pollJob();
    } catch (error) {
      console.error("Failed to start pipeline:", error);
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "A serene sunset over the ocean waves",
    "A futuristic city with flying cars",
    "A cozy cabin in a snowy forest",
    "Abstract colorful patterns flowing smoothly",
  ];

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Text Input</h2>

      <div className="flex-1 flex flex-col">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 min-h-[200px] bg-gray-700 border border-gray-600 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Describe the video you want to create..."
        />

        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300 transition-colors"
              >
                {example.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateVideo}
          disabled={!prompt.trim() || isGenerating}
          className={`mt-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            !prompt.trim() || isGenerating
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700"
          }`}
        >
          <Wand2 className="w-5 h-5" />
          {isGenerating ? "Generating..." : "Generate Video"}
        </button>
      </div>
    </div>
  );
}

export default TextInput;
