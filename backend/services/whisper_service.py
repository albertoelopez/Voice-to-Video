from pathlib import Path
from typing import Any
import torch
from backend.core import settings

DEMO_MODE = True


class WhisperService:
    _instance: "WhisperService | None" = None
    _model = None

    def __new__(cls) -> "WhisperService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        pass

    def _load_model(self) -> None:
        if DEMO_MODE:
            return
        import whisper
        self._model = whisper.load_model(
            name=settings.whisper_model,
            device=settings.whisper_device,
            download_root=str(settings.model_cache_dir / "whisper"),
        )

    @property
    def model(self):
        if self._model is None and not DEMO_MODE:
            self._load_model()
        return self._model

    def transcribe(
        self,
        audio_path: str | Path,
        language: str | None = None,
        task: str = "transcribe",
        word_timestamps: bool = True,
    ) -> dict[str, Any]:
        if DEMO_MODE:
            return {
                "text": "This is a demo transcription. Install Whisper models for real transcription.",
                "language": "en",
                "segments": [
                    {"id": 0, "start": 0.0, "end": 2.0, "text": "This is a demo transcription."}
                ],
            }

        result = self.model.transcribe(
            str(audio_path),
            language=language,
            task=task,
            word_timestamps=word_timestamps,
            verbose=False,
        )
        return {
            "text": result["text"],
            "language": result.get("language"),
            "segments": [
                {
                    "id": seg["id"],
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"],
                }
                for seg in result.get("segments", [])
            ],
        }

    def detect_language(self, audio_path: str | Path) -> dict[str, float]:
        if DEMO_MODE:
            return {"en": 0.95, "es": 0.03, "fr": 0.02}

        import whisper
        audio = whisper.load_audio(str(audio_path))
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio, n_mels=self.model.dims.n_mels)
        mel = mel.to(self.model.device)
        _, probs = self.model.detect_language(mel)
        return dict(sorted(probs.items(), key=lambda x: x[1], reverse=True)[:5])

    def unload(self) -> None:
        if self._model is not None:
            del self._model
            self._model = None
            torch.cuda.empty_cache()


whisper_service = WhisperService()
