import type {
  TranscriptionResult,
  JobStatus,
  GpuStatus,
  ModelInfo,
} from "../types";

const API_BASE = "http://localhost:8080/api/v1";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async transcribe(
    audioFile: Blob,
    language?: string
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append("file", audioFile, "recording.webm");
    if (language) {
      formData.append("language", language);
    }

    return this.request<TranscriptionResult>("/transcribe", {
      method: "POST",
      body: formData,
    });
  }

  async detectLanguage(
    audioFile: Blob
  ): Promise<{ languages: Record<string, number> }> {
    const formData = new FormData();
    formData.append("file", audioFile, "recording.webm");

    return this.request("/detect-language", {
      method: "POST",
      body: formData,
    });
  }

  async synthesize(
    text: string,
    voiceReferenceId?: string,
    exaggeration = 0.5
  ): Promise<{ audio_id: string; path: string }> {
    return this.request("/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice_reference_id: voiceReferenceId,
        exaggeration,
      }),
    });
  }

  async uploadVoiceReference(
    file: File
  ): Promise<{ reference_id: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request("/upload-voice-reference", {
      method: "POST",
      body: formData,
    });
  }

  async listVoices(): Promise<{ builtin_voices: string[] }> {
    return this.request("/voices");
  }

  async generateVideo(options: {
    prompt: string;
    resolution?: string;
    numFrames?: number;
    seed?: number;
    numSteps?: number;
    guidanceScale?: number;
  }): Promise<{ job_id: string }> {
    return this.request("/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        resolution: options.resolution,
        num_frames: options.numFrames,
        seed: options.seed,
        num_steps: options.numSteps,
        guidance_scale: options.guidanceScale,
      }),
    });
  }

  async startPipeline(options: {
    text?: string;
    audioFileId?: string;
    generateVoiceover?: boolean;
    voiceReferenceId?: string;
    videoResolution?: string;
    videoFrames?: number;
  }): Promise<{ job_id: string }> {
    return this.request("/pipeline/voice-to-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: options.text,
        audio_file_id: options.audioFileId,
        generate_voiceover: options.generateVoiceover,
        voice_reference_id: options.voiceReferenceId,
        video_resolution: options.videoResolution,
        video_frames: options.videoFrames,
      }),
    });
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.request(`/job/${jobId}`);
  }

  getVideoUrl(jobId: string): string {
    return `${API_BASE}/video/${jobId}`;
  }

  getAudioUrl(audioId: string): string {
    return `${API_BASE}/audio/${audioId}`;
  }

  async getGpuStatus(): Promise<GpuStatus> {
    return this.request("/system/gpu-status");
  }

  async getModelInfo(): Promise<ModelInfo> {
    return this.request("/system/models");
  }
}

export const api = new ApiClient();
