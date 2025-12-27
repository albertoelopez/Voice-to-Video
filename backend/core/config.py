from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Literal
import torch


class Settings(BaseSettings):
    app_name: str = "VoxVideo Studio"
    version: str = "0.1.0"
    debug: bool = False

    model_cache_dir: Path = Path.home() / ".cache" / "voxvideo"
    temp_dir: Path = Path("/tmp/voxvideo")

    whisper_model: Literal["tiny", "base", "small", "medium", "large", "turbo"] = "base"
    whisper_device: str = "cuda" if torch.cuda.is_available() else "cpu"

    chatterbox_model: Literal["turbo", "standard", "multilingual"] = "turbo"
    chatterbox_device: str = "cuda" if torch.cuda.is_available() else "cpu"

    opensora_resolution: Literal["256px", "768px"] = "256px"
    opensora_num_frames: int = 129
    opensora_device: str = "cuda" if torch.cuda.is_available() else "cpu"
    opensora_model_path: Path | None = None

    max_audio_duration_seconds: int = 300
    max_video_duration_seconds: int = 10

    cors_origins: list[str] = ["http://localhost:1420", "http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_prefix = "VOXVIDEO_"
        env_file = ".env"


settings = Settings()
settings.model_cache_dir.mkdir(parents=True, exist_ok=True)
settings.temp_dir.mkdir(parents=True, exist_ok=True)
