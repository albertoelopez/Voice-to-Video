from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from typing import Any
import uuid
import aiofiles
from backend.core import settings
from backend.services import whisper_service, chatterbox_service, opensora_service

router = APIRouter()


class TranscribeResponse(BaseModel):
    text: str
    language: str | None
    segments: list[dict[str, Any]]


class SynthesizeRequest(BaseModel):
    text: str
    voice_reference_id: str | None = None
    exaggeration: float = 0.5
    language_id: str | None = None


class GenerateVideoRequest(BaseModel):
    prompt: str
    resolution: str | None = None
    num_frames: int | None = None
    seed: int | None = None
    num_steps: int = 50
    guidance_scale: float = 7.5
    reference_image_id: str | None = None


class PipelineRequest(BaseModel):
    text: str | None = None
    audio_file_id: str | None = None
    generate_voiceover: bool = True
    voice_reference_id: str | None = None
    video_resolution: str = "256px"
    video_frames: int = 129


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    result: dict[str, Any] | None = None
    error: str | None = None


jobs: dict[str, JobStatus] = {}


async def save_upload_file(file: UploadFile) -> Path:
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix if file.filename else ".bin"
    file_path = settings.temp_dir / f"{file_id}{ext}"

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return file_path


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str | None = Form(None),
):
    file_path = await save_upload_file(file)
    try:
        result = whisper_service.transcribe(
            audio_path=file_path,
            language=language,
        )
        return TranscribeResponse(**result)
    finally:
        file_path.unlink(missing_ok=True)


@router.post("/detect-language")
async def detect_language(file: UploadFile = File(...)):
    file_path = await save_upload_file(file)
    try:
        probs = whisper_service.detect_language(file_path)
        return {"languages": probs}
    finally:
        file_path.unlink(missing_ok=True)


@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    output_id = str(uuid.uuid4())
    output_path = settings.temp_dir / f"{output_id}.wav"

    voice_ref = None
    if request.voice_reference_id:
        voice_ref = settings.temp_dir / request.voice_reference_id

    chatterbox_service.synthesize(
        text=request.text,
        output_path=output_path,
        voice_reference=voice_ref,
        exaggeration=request.exaggeration,
        language_id=request.language_id,
    )

    return {"audio_id": output_id, "path": str(output_path)}


@router.get("/audio/{audio_id}")
async def get_audio(audio_id: str):
    file_path = settings.temp_dir / f"{audio_id}.wav"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(file_path, media_type="audio/wav")


@router.post("/upload-voice-reference")
async def upload_voice_reference(file: UploadFile = File(...)):
    file_path = await save_upload_file(file)
    return {"reference_id": file_path.name}


@router.get("/voices")
async def list_voices():
    builtin = chatterbox_service.list_builtin_voices()
    return {"builtin_voices": builtin}


@router.post("/generate-video")
async def generate_video(
    request: GenerateVideoRequest,
    background_tasks: BackgroundTasks,
):
    job_id = str(uuid.uuid4())
    output_dir = settings.temp_dir / job_id

    jobs[job_id] = JobStatus(
        job_id=job_id,
        status="pending",
        progress=0.0,
    )

    async def run_generation():
        jobs[job_id].status = "running"
        jobs[job_id].progress = 0.1

        try:
            ref_image = None
            if request.reference_image_id:
                ref_image = settings.temp_dir / request.reference_image_id

            result = opensora_service.generate_video(
                prompt=request.prompt,
                output_dir=output_dir,
                resolution=request.resolution,
                num_frames=request.num_frames,
                seed=request.seed,
                num_steps=request.num_steps,
                guidance_scale=request.guidance_scale,
                reference_image=ref_image,
            )

            jobs[job_id].status = "completed"
            jobs[job_id].progress = 1.0
            jobs[job_id].result = result

        except Exception as e:
            jobs[job_id].status = "failed"
            jobs[job_id].error = str(e)

    background_tasks.add_task(run_generation)
    return {"job_id": job_id}


@router.get("/job/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@router.get("/video/{job_id}")
async def get_video(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job.status != "completed" or not job.result:
        raise HTTPException(status_code=400, detail="Video not ready")

    video_path = Path(job.result["video_path"])
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(video_path, media_type="video/mp4")


@router.post("/pipeline/voice-to-video")
async def voice_to_video_pipeline(
    request: PipelineRequest,
    background_tasks: BackgroundTasks,
):
    job_id = str(uuid.uuid4())
    output_dir = settings.temp_dir / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    jobs[job_id] = JobStatus(
        job_id=job_id,
        status="pending",
        progress=0.0,
    )

    async def run_pipeline():
        jobs[job_id].status = "running"

        try:
            prompt = request.text

            if request.audio_file_id and not prompt:
                jobs[job_id].progress = 0.1
                audio_path = settings.temp_dir / request.audio_file_id
                transcription = whisper_service.transcribe(audio_path)
                prompt = transcription["text"]
                jobs[job_id].progress = 0.3

            if not prompt:
                raise ValueError("No text or audio provided")

            jobs[job_id].progress = 0.4
            video_result = opensora_service.generate_video(
                prompt=prompt,
                output_dir=output_dir / "video",
                resolution=request.video_resolution,
                num_frames=request.video_frames,
            )
            jobs[job_id].progress = 0.8

            audio_path = None
            if request.generate_voiceover:
                voice_ref = None
                if request.voice_reference_id:
                    voice_ref = settings.temp_dir / request.voice_reference_id

                audio_path = output_dir / "voiceover.wav"
                chatterbox_service.synthesize(
                    text=prompt,
                    output_path=audio_path,
                    voice_reference=voice_ref,
                )
                jobs[job_id].progress = 0.95

            jobs[job_id].status = "completed"
            jobs[job_id].progress = 1.0
            jobs[job_id].result = {
                "video_path": video_result["video_path"],
                "audio_path": str(audio_path) if audio_path else None,
                "prompt": prompt,
            }

        except Exception as e:
            jobs[job_id].status = "failed"
            jobs[job_id].error = str(e)

    background_tasks.add_task(run_pipeline)
    return {"job_id": job_id}


@router.get("/system/gpu-status")
async def get_gpu_status():
    return opensora_service.check_gpu_requirements()


@router.get("/system/models")
async def get_model_info():
    return {
        "whisper": {
            "model": settings.whisper_model,
            "device": settings.whisper_device,
        },
        "chatterbox": {
            "model": settings.chatterbox_model,
            "device": settings.chatterbox_device,
        },
        "opensora": {
            "resolution": settings.opensora_resolution,
            "num_frames": settings.opensora_num_frames,
            "device": settings.opensora_device,
        },
    }
