export interface TranscriptionResult {
  text: string;
  language: string | null;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result: JobResult | null;
  error: string | null;
}

export interface JobResult {
  video_path: string;
  audio_path: string | null;
  prompt: string;
}

export interface GpuStatus {
  available: boolean;
  gpu_name?: string;
  total_memory_gb?: number;
  min_required_gb?: number;
  resolution?: string;
  reason?: string;
}

export interface ModelInfo {
  whisper: {
    model: string;
    device: string;
  };
  chatterbox: {
    model: string;
    device: string;
  };
  opensora: {
    resolution: string;
    num_frames: number;
    device: string;
  };
}

export interface GenerationSettings {
  resolution: "256px" | "768px";
  numFrames: number;
  numSteps: number;
  guidanceScale: number;
  generateVoiceover: boolean;
  voiceReferenceId: string | null;
  whisperModel: string;
  seed: number | null;
}

export interface AppSettings {
  gpuStatus: GpuStatus | null;
  modelInfo: ModelInfo | null;
  generation: GenerationSettings;
}
