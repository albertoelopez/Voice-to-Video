import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from pathlib import Path
import io

from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthEndpoints:
    def test_root_returns_app_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "VoxVideo Studio"
        assert "version" in data
        assert data["status"] == "running"

    def test_health_returns_healthy(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestTranscriptionEndpoints:
    @patch("backend.services.whisper_service.transcribe")
    def test_transcribe_audio_success(self, mock_transcribe, client):
        mock_transcribe.return_value = {
            "text": "Hello world",
            "language": "en",
            "segments": [{"id": 0, "start": 0.0, "end": 1.0, "text": "Hello world"}],
        }

        audio_content = b"fake audio content"
        files = {"file": ("test.wav", io.BytesIO(audio_content), "audio/wav")}

        response = client.post("/api/v1/transcribe", files=files)

        assert response.status_code == 200
        data = response.json()
        assert data["text"] == "Hello world"
        assert data["language"] == "en"

    @patch("backend.services.whisper_service.detect_language")
    def test_detect_language_success(self, mock_detect, client):
        mock_detect.return_value = {"en": 0.95, "es": 0.03, "fr": 0.02}

        audio_content = b"fake audio content"
        files = {"file": ("test.wav", io.BytesIO(audio_content), "audio/wav")}

        response = client.post("/api/v1/detect-language", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "languages" in data


class TestSynthesisEndpoints:
    @patch("backend.services.chatterbox_service.synthesize")
    def test_synthesize_speech_success(self, mock_synthesize, client):
        mock_synthesize.return_value = Path("/tmp/output.wav")

        response = client.post(
            "/api/v1/synthesize",
            json={"text": "Hello world", "exaggeration": 0.5},
        )

        assert response.status_code == 200
        data = response.json()
        assert "audio_id" in data

    @patch("backend.services.chatterbox_service.list_builtin_voices")
    def test_list_voices(self, mock_list_voices, client):
        mock_list_voices.return_value = ["default", "narrator"]

        response = client.get("/api/v1/voices")

        assert response.status_code == 200
        data = response.json()
        assert "builtin_voices" in data


class TestVideoGenerationEndpoints:
    @patch("backend.services.opensora_service.generate_video")
    def test_generate_video_returns_job_id(self, mock_generate, client):
        response = client.post(
            "/api/v1/generate-video",
            json={
                "prompt": "A beautiful sunset",
                "resolution": "256px",
                "num_steps": 50,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data

    def test_get_nonexistent_job_returns_404(self, client):
        response = client.get("/api/v1/job/nonexistent-id")
        assert response.status_code == 404


class TestSystemEndpoints:
    @patch("backend.services.opensora_service.check_gpu_requirements")
    def test_gpu_status(self, mock_check_gpu, client):
        mock_check_gpu.return_value = {
            "available": True,
            "gpu_name": "NVIDIA GeForce RTX 4090",
            "total_memory_gb": 24.0,
            "min_required_gb": 24,
            "resolution": "256px",
        }

        response = client.get("/api/v1/system/gpu-status")

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is True

    def test_model_info(self, client):
        response = client.get("/api/v1/system/models")

        assert response.status_code == 200
        data = response.json()
        assert "whisper" in data
        assert "chatterbox" in data
        assert "opensora" in data
