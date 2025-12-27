import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { api } from "../services/api";

function VoiceInput() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const {
    isRecording,
    setIsRecording,
    transcribedText,
    setTranscribedText,
    setCurrentJob,
    settings,
  } = useAppStore();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        setIsTranscribing(true);
        try {
          const result = await api.transcribe(audioBlob);
          setTranscribedText(result.text);
        } catch (error) {
          console.error("Transcription failed:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [setIsRecording, setTranscribedText]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording, setIsRecording]);

  const handleGenerateVideo = async () => {
    if (!transcribedText.trim()) return;

    try {
      const { job_id } = await api.startPipeline({
        text: transcribedText,
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
        }
      };

      pollJob();
    } catch (error) {
      console.error("Failed to start pipeline:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Voice Input</h2>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 recording-pulse"
              : "bg-primary-600 hover:bg-primary-700"
          } ${isTranscribing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isTranscribing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isRecording ? (
            <Square className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>

        <p className="text-gray-400 text-sm">
          {isTranscribing
            ? "Transcribing..."
            : isRecording
              ? "Recording... Click to stop"
              : "Click to start recording"}
        </p>
      </div>

      {transcribedText && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Transcribed Text
          </label>
          <textarea
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Your transcribed text will appear here..."
          />
          <button
            onClick={handleGenerateVideo}
            className="mt-4 w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
          >
            Generate Video
          </button>
        </div>
      )}
    </div>
  );
}

export default VoiceInput;
