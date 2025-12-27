import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path


class TestWhisperService:
    @patch("whisper.load_model")
    def test_whisper_service_initialization(self, mock_load_model):
        mock_model = MagicMock()
        mock_load_model.return_value = mock_model

        from backend.services.whisper_service import WhisperService

        service = WhisperService()
        assert service._model is not None

    @patch("whisper.load_model")
    def test_whisper_transcribe_returns_expected_format(self, mock_load_model):
        mock_model = MagicMock()
        mock_model.transcribe.return_value = {
            "text": "Test transcription",
            "language": "en",
            "segments": [
                {
                    "id": 0,
                    "start": 0.0,
                    "end": 2.0,
                    "text": "Test transcription",
                }
            ],
        }
        mock_load_model.return_value = mock_model

        from backend.services.whisper_service import WhisperService

        service = WhisperService()
        result = service.transcribe("/path/to/audio.wav")

        assert "text" in result
        assert "language" in result
        assert "segments" in result
        assert result["text"] == "Test transcription"


class TestChatterboxService:
    @patch("chatterbox.tts_turbo.ChatterboxTurboTTS.from_pretrained")
    def test_chatterbox_service_initialization(self, mock_from_pretrained):
        mock_model = MagicMock()
        mock_model.sr = 24000
        mock_from_pretrained.return_value = mock_model

        from backend.services.chatterbox_service import ChatterboxService

        service = ChatterboxService()
        assert service._model is not None

    @patch("chatterbox.tts_turbo.ChatterboxTurboTTS.from_pretrained")
    @patch("torchaudio.save")
    def test_chatterbox_synthesize_saves_file(
        self, mock_save, mock_from_pretrained
    ):
        mock_model = MagicMock()
        mock_model.sr = 24000
        mock_model.generate.return_value = MagicMock()
        mock_from_pretrained.return_value = mock_model

        from backend.services.chatterbox_service import ChatterboxService

        service = ChatterboxService()
        output_path = Path("/tmp/test_output.wav")
        result = service.synthesize("Hello world", output_path)

        assert result == output_path
        mock_save.assert_called_once()


class TestOpenSoraService:
    @patch("subprocess.run")
    def test_opensora_check_installation(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0)

        from backend.services.opensora_service import OpenSoraService

        service = OpenSoraService()
        assert service._initialized is True

    @patch("torch.cuda.is_available")
    @patch("torch.cuda.get_device_properties")
    @patch("torch.cuda.get_device_name")
    @patch("torch.cuda.current_device")
    def test_opensora_check_gpu_requirements(
        self,
        mock_current_device,
        mock_get_name,
        mock_get_props,
        mock_is_available,
    ):
        mock_is_available.return_value = True
        mock_current_device.return_value = 0
        mock_get_name.return_value = "NVIDIA GeForce RTX 4090"
        mock_props = MagicMock()
        mock_props.total_memory = 24 * (1024**3)
        mock_get_props.return_value = mock_props

        from backend.services.opensora_service import OpenSoraService

        service = OpenSoraService()
        result = service.check_gpu_requirements()

        assert result["available"] is True
        assert result["gpu_name"] == "NVIDIA GeForce RTX 4090"
        assert result["total_memory_gb"] == 24.0
