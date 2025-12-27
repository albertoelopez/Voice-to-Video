import { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import TextInput from "./components/TextInput";
import VideoPreview from "./components/VideoPreview";
import SettingsPanel from "./components/SettingsPanel";
import StatusBar from "./components/StatusBar";
import { useAppStore } from "./stores/appStore";

function App() {
  const [activeTab, setActiveTab] = useState<"voice" | "text">("voice");
  const { currentJob, settings } = useAppStore();

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">VoxVideo Studio</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              GPU: {settings.gpuStatus?.available ? "Ready" : "Not Available"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("voice")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "voice"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Voice Input
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "text"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Text Input
            </button>
          </div>

          <div className="flex-1 flex gap-6">
            <div className="w-1/2">
              {activeTab === "voice" ? <VoiceInput /> : <TextInput />}
            </div>
            <div className="w-1/2">
              <VideoPreview />
            </div>
          </div>
        </div>

        <aside className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <SettingsPanel />
        </aside>
      </main>

      <StatusBar job={currentJob} />
    </div>
  );
}

export default App;
