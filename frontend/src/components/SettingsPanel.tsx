import { useEffect, useRef, useState } from "react";
import { Settings, Upload, Volume2 } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { api } from "../services/api";

function SettingsPanel() {
  const { settings, updateSettings, setGpuStatus, setModelInfo } =
    useAppStore();
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const [gpuStatus, modelInfo] = await Promise.all([
          api.getGpuStatus(),
          api.getModelInfo(),
        ]);
        setGpuStatus(gpuStatus);
        setModelInfo(modelInfo);
      } catch (error) {
        console.error("Failed to load system info:", error);
      }
    };

    loadSystemInfo();
  }, [setGpuStatus, setModelInfo]);

  const handleVoiceUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setVoiceFile(file);
    try {
      const { reference_id } = await api.uploadVoiceReference(file);
      updateSettings({ voiceReferenceId: reference_id });
    } catch (error) {
      console.error("Failed to upload voice reference:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-700">
        <Settings className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Video Settings</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Resolution</label>
          <select
            value={settings.generation.resolution}
            onChange={(e) =>
              updateSettings({
                resolution: e.target.value as "256px" | "768px",
              })
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="256px">256px (Fast)</option>
            <option value="768px">768px (High Quality)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Frames: {settings.generation.numFrames}
          </label>
          <input
            type="range"
            min="17"
            max="129"
            step="16"
            value={settings.generation.numFrames}
            onChange={(e) =>
              updateSettings({ numFrames: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Guidance Scale: {settings.generation.guidanceScale}
          </label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={settings.generation.guidanceScale}
            onChange={(e) =>
              updateSettings({ guidanceScale: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Steps: {settings.generation.numSteps}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.generation.numSteps}
            onChange={(e) =>
              updateSettings({ numSteps: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Voice Settings</h3>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.generation.generateVoiceover}
            onChange={(e) =>
              updateSettings({ generateVoiceover: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Generate Voiceover</span>
        </label>

        {settings.generation.generateVoiceover && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Voice Reference (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleVoiceUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {voiceFile ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  {voiceFile.name.slice(0, 20)}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Voice Sample
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              5+ seconds of clear speech recommended
            </p>
          </div>
        )}
      </div>

      {settings.gpuStatus && (
        <div className="space-y-2 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">System</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>GPU: {settings.gpuStatus.gpu_name || "N/A"}</p>
            <p>
              VRAM:{" "}
              {settings.gpuStatus.total_memory_gb?.toFixed(1) || "N/A"} GB
            </p>
            <p
              className={
                settings.gpuStatus.available
                  ? "text-green-400"
                  : "text-yellow-400"
              }
            >
              {settings.gpuStatus.available
                ? "Ready for generation"
                : settings.gpuStatus.reason || "GPU requirements not met"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPanel;
