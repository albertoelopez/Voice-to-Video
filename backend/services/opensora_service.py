from pathlib import Path
from typing import Any
import subprocess
import torch
from backend.core import settings

DEMO_MODE = True


class OpenSoraService:
    _instance: "OpenSoraService | None" = None
    _initialized: bool = False

    def __new__(cls) -> "OpenSoraService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not self._initialized:
            self._initialized = True

    def _check_installation(self) -> bool:
        if DEMO_MODE:
            return True
        try:
            result = subprocess.run(
                ["python", "-c", "import opensora"],
                capture_output=True,
                text=True,
            )
            return result.returncode == 0
        except Exception:
            return False

    def _get_config_path(self) -> str:
        resolution = settings.opensora_resolution
        return f"configs/diffusion/inference/t2i2v_{resolution}.py"

    def generate_video(
        self,
        prompt: str,
        output_dir: str | Path,
        resolution: str | None = None,
        num_frames: int | None = None,
        seed: int | None = None,
        num_steps: int = 50,
        guidance_scale: float = 7.5,
        reference_image: str | Path | None = None,
    ) -> dict[str, Any]:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        resolution = resolution or settings.opensora_resolution
        num_frames = num_frames or settings.opensora_num_frames

        if DEMO_MODE:
            import time
            time.sleep(2)

            demo_video = output_dir / "demo_video.mp4"
            self._create_demo_video(demo_video, prompt)

            return {
                "video_path": str(demo_video),
                "prompt": prompt,
                "resolution": resolution,
                "num_frames": num_frames,
            }

        config_path = self._get_config_path()
        if resolution != settings.opensora_resolution:
            config_path = f"configs/diffusion/inference/t2i2v_{resolution}.py"

        cmd = [
            "torchrun",
            "--nproc_per_node", "1",
            "--standalone",
            "scripts/diffusion/inference.py",
            config_path,
            "--save-dir", str(output_dir),
            "--prompt", prompt,
            "--num-frames", str(num_frames),
            "--num-steps", str(num_steps),
            "--guidance-scale", str(guidance_scale),
        ]

        if seed is not None:
            cmd.extend(["--seed", str(seed)])

        if reference_image:
            cmd.extend([
                "--cond_type", "i2v_head",
                "--ref", str(reference_image),
            ])

        env = {
            "CUDA_VISIBLE_DEVICES": "0",
        }

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=self._get_opensora_path(),
            env={**subprocess.os.environ, **env},
        )

        if result.returncode != 0:
            raise RuntimeError(f"Open-Sora generation failed: {result.stderr}")

        video_files = list(output_dir.glob("*.mp4"))
        if not video_files:
            raise RuntimeError("No video file generated")

        return {
            "video_path": str(video_files[0]),
            "prompt": prompt,
            "resolution": resolution,
            "num_frames": num_frames,
        }

    def _create_demo_video(self, output_path: Path, prompt: str) -> None:
        import subprocess

        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=blue:s=256x256:d=3",
            "-vf", f"drawtext=text='{prompt[:30]}...':fontsize=20:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
            "-c:v", "libx264",
            "-t", "3",
            str(output_path),
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True)
        except Exception:
            cmd_simple = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", "color=c=blue:s=256x256:d=3",
                "-c:v", "libx264",
                "-t", "3",
                str(output_path),
            ]
            subprocess.run(cmd_simple, capture_output=True)

    def _get_opensora_path(self) -> Path:
        if settings.opensora_model_path:
            return settings.opensora_model_path
        return settings.model_cache_dir / "Open-Sora"

    def check_gpu_requirements(self) -> dict[str, Any]:
        if DEMO_MODE:
            return {
                "available": True,
                "gpu_name": "Demo Mode (No GPU Required)",
                "total_memory_gb": 0,
                "min_required_gb": 0,
                "resolution": settings.opensora_resolution,
                "demo_mode": True,
            }

        if not torch.cuda.is_available():
            return {
                "available": False,
                "reason": "CUDA not available",
            }

        device = torch.cuda.current_device()
        total_memory = torch.cuda.get_device_properties(device).total_memory
        total_memory_gb = total_memory / (1024**3)

        min_required = 24 if settings.opensora_resolution == "256px" else 48

        return {
            "available": total_memory_gb >= min_required,
            "gpu_name": torch.cuda.get_device_name(device),
            "total_memory_gb": round(total_memory_gb, 2),
            "min_required_gb": min_required,
            "resolution": settings.opensora_resolution,
        }

    def unload(self) -> None:
        torch.cuda.empty_cache()


opensora_service = OpenSoraService()
