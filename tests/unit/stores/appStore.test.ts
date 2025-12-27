import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";

describe("appStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      currentJob: null,
      transcribedText: "",
      isRecording: false,
      settings: {
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
      },
    });
  });

  it("sets current job", () => {
    const { setCurrentJob } = useAppStore.getState();

    setCurrentJob({
      job_id: "test-123",
      status: "running",
      progress: 0.5,
      result: null,
      error: null,
    });

    const { currentJob } = useAppStore.getState();
    expect(currentJob?.job_id).toBe("test-123");
    expect(currentJob?.status).toBe("running");
  });

  it("sets transcribed text", () => {
    const { setTranscribedText } = useAppStore.getState();

    setTranscribedText("Hello world");

    const { transcribedText } = useAppStore.getState();
    expect(transcribedText).toBe("Hello world");
  });

  it("sets recording state", () => {
    const { setIsRecording } = useAppStore.getState();

    setIsRecording(true);

    const { isRecording } = useAppStore.getState();
    expect(isRecording).toBe(true);
  });

  it("updates generation settings", () => {
    const { updateSettings } = useAppStore.getState();

    updateSettings({ resolution: "768px", numFrames: 65 });

    const { settings } = useAppStore.getState();
    expect(settings.generation.resolution).toBe("768px");
    expect(settings.generation.numFrames).toBe(65);
  });

  it("sets GPU status", () => {
    const { setGpuStatus } = useAppStore.getState();

    setGpuStatus({
      available: true,
      gpu_name: "RTX 4090",
      total_memory_gb: 24,
      min_required_gb: 24,
      resolution: "256px",
    });

    const { settings } = useAppStore.getState();
    expect(settings.gpuStatus?.available).toBe(true);
    expect(settings.gpuStatus?.gpu_name).toBe("RTX 4090");
  });

  it("preserves other settings when updating generation", () => {
    const { setGpuStatus, updateSettings } = useAppStore.getState();

    setGpuStatus({ available: true });
    updateSettings({ resolution: "768px" });

    const { settings } = useAppStore.getState();
    expect(settings.gpuStatus?.available).toBe(true);
    expect(settings.generation.resolution).toBe("768px");
  });
});
