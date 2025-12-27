from pathlib import Path
import torch
from backend.core import settings

DEMO_MODE = False


class ChatterboxService:
    _instance: "ChatterboxService | None" = None
    _model = None

    def __new__(cls) -> "ChatterboxService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        pass

    def _load_model(self) -> None:
        if DEMO_MODE:
            return

        if settings.chatterbox_model == "turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            self._model = ChatterboxTurboTTS.from_pretrained(
                device=settings.chatterbox_device
            )
        elif settings.chatterbox_model == "multilingual":
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            self._model = ChatterboxMultilingualTTS.from_pretrained(
                device=settings.chatterbox_device
            )
        else:
            from chatterbox.tts import ChatterboxTTS
            self._model = ChatterboxTTS.from_pretrained(
                device=settings.chatterbox_device
            )

    @property
    def model(self):
        if self._model is None and not DEMO_MODE:
            self._load_model()
        return self._model

    @property
    def sample_rate(self) -> int:
        if DEMO_MODE:
            return 24000
        return self.model.sr

    def synthesize(
        self,
        text: str,
        output_path: str | Path,
        voice_reference: str | Path | None = None,
        exaggeration: float = 0.5,
        language_id: str | None = None,
    ) -> Path:
        output_path = Path(output_path)

        if DEMO_MODE:
            import wave
            import struct

            sample_rate = 24000
            duration = len(text) * 0.05
            num_samples = int(sample_rate * duration)

            with wave.open(str(output_path), 'w') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                for i in range(num_samples):
                    value = int(32767 * 0.1 * (i % 100) / 100)
                    wav_file.writeframes(struct.pack('<h', value))

            return output_path

        import torchaudio

        kwargs = {}
        if voice_reference:
            kwargs["audio_prompt_path"] = str(voice_reference)

        if hasattr(self.model, "exaggeration"):
            kwargs["exaggeration"] = exaggeration

        if language_id and hasattr(self.model, "language_id"):
            kwargs["language_id"] = language_id

        wav = self.model.generate(text, **kwargs)

        torchaudio.save(str(output_path), wav, self.sample_rate)
        return output_path

    def list_builtin_voices(self) -> list[str]:
        if DEMO_MODE:
            return ["default", "narrator", "assistant"]

        if hasattr(self.model, "conds") and self.model.conds is not None:
            return list(self.model.conds.keys())
        return []

    def unload(self) -> None:
        if self._model is not None:
            del self._model
            self._model = None
            torch.cuda.empty_cache()


chatterbox_service = ChatterboxService()
