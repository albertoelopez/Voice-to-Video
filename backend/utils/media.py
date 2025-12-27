from pathlib import Path
import subprocess
import json


def get_video_duration(video_path: str | Path) -> float:
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")

    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def get_audio_duration(audio_path: str | Path) -> float:
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(audio_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")

    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def combine_audio_video(
    video_path: str | Path,
    audio_path: str | Path,
    output_path: str | Path,
    loop_video: bool = True,
) -> Path:
    video_path = Path(video_path)
    audio_path = Path(audio_path)
    output_path = Path(output_path)

    video_duration = get_video_duration(video_path)
    audio_duration = get_audio_duration(audio_path)

    if loop_video and audio_duration > video_duration:
        loops = int(audio_duration / video_duration) + 1
        cmd = [
            "ffmpeg",
            "-y",
            "-stream_loop", str(loops),
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]
    else:
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")

    return output_path
