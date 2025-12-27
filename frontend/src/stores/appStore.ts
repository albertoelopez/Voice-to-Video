import { create } from "zustand";
import type { JobStatus, AppSettings, GenerationSettings } from "../types";

interface AppState {
  currentJob: JobStatus | null;
  transcribedText: string;
  isRecording: boolean;
  settings: AppSettings;

  setCurrentJob: (job: JobStatus | null) => void;
  setTranscribedText: (text: string) => void;
  setIsRecording: (recording: boolean) => void;
  updateSettings: (settings: Partial<GenerationSettings>) => void;
  setGpuStatus: (status: AppSettings["gpuStatus"]) => void;
  setModelInfo: (info: AppSettings["modelInfo"]) => void;
}

const defaultSettings: AppSettings = {
  gpuStatus: null,
  modelInfo: null,
  generation: {
    resolution: "256px",
    numFrames: 129,
    numSteps: 50,
    guidanceScale: 7.5,
    generateVoiceover: true,
    voiceReferenceId: null,
    whisperModel: "base",
    seed: null,
  },
};

export const useAppStore = create<AppState>((set) => ({
  currentJob: null,
  transcribedText: "",
  isRecording: false,
  settings: defaultSettings,

  setCurrentJob: (job) => set({ currentJob: job }),
  setTranscribedText: (text) => set({ transcribedText: text }),
  setIsRecording: (recording) => set({ isRecording: recording }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        generation: { ...state.settings.generation, ...newSettings },
      },
    })),

  setGpuStatus: (gpuStatus) =>
    set((state) => ({
      settings: { ...state.settings, gpuStatus },
    })),

  setModelInfo: (modelInfo) =>
    set((state) => ({
      settings: { ...state.settings, modelInfo },
    })),
}));
