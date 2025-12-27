# VoxVideo Studio

An open-source desktop application for AI-powered video generation using voice or text input.

## Features

- **Voice-to-Video**: Speak your ideas, get videos generated automatically
- **Text-to-Video**: Type prompts to generate videos with Open-Sora
- **Voice Synthesis**: Add AI-generated voiceovers with Chatterbox
- **Voice Cloning**: Clone any voice from a short audio sample

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VoxVideo Studio Desktop                       │
│                         (Tauri + React)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                     Python Backend (FastAPI)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Whisper   │  │  Chatterbox │  │       Open-Sora         │  │
│  │    (STT)    │  │    (TTS)    │  │   (Video Generation)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Pipelines

### Pipeline 1: Voice → Video
```
Microphone → Whisper (STT) → Text Prompt → Open-Sora → Video
                                              ↓
                              Chatterbox (TTS) → Audio
                                              ↓
                                        Final Video + Audio
```

### Pipeline 2: Text → Video
```
Text Input → Open-Sora → Video
                ↓
    Chatterbox (TTS) → Audio
                ↓
          Final Video + Audio
```

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU VRAM | 8 GB | 24+ GB (RTX 4090) |
| System RAM | 16 GB | 32+ GB |
| Storage | 50 GB | 100+ GB |
| GPU | RTX 3060 | RTX 4090 / A100 |

**Note**: Open-Sora requires significant GPU resources. For optimal performance:
- 256px videos: 24GB VRAM minimum
- 768px videos: 48GB+ VRAM or multi-GPU setup

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Rust (for Tauri)
- CUDA 12.1+ with cuDNN
- FFmpeg

### Installation

```bash
git clone https://github.com/yourusername/voxvideo-studio.git
cd voxvideo-studio

chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Project Structure

```
voxvideo-studio/
├── frontend/              # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API clients
│   │   ├── stores/        # State management
│   │   └── types/         # TypeScript types
├── backend/               # Python FastAPI backend
│   ├── api/               # API routes
│   ├── services/          # AI service wrappers
│   ├── core/              # Configuration & utilities
│   └── tests/             # Backend tests
├── src-tauri/             # Tauri Rust backend
├── tests/
│   ├── unit/              # Jest unit tests
│   └── e2e/               # Playwright E2E tests
└── scripts/               # Setup & utility scripts
```

## AI Models Used

| Model | Purpose | License | Size |
|-------|---------|---------|------|
| [Open-Sora](https://github.com/hpcaitech/Open-Sora) | Video Generation | Apache 2.0 | ~30-40 GB |
| [Chatterbox](https://github.com/resemble-ai/chatterbox) | Text-to-Speech | MIT | ~4 GB |
| [Whisper](https://github.com/openai/whisper) | Speech-to-Text | MIT | 39M - 1.5B |

## Configuration

Create a `.env` file:

```env
VOXVIDEO_MODEL_CACHE=/path/to/models
VOXVIDEO_GPU_DEVICE=cuda:0
VOXVIDEO_WHISPER_MODEL=base
VOXVIDEO_OPENSORA_RESOLUTION=256px
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) first.

## Acknowledgments

- [Open-Sora](https://github.com/hpcaitech/Open-Sora) by HPC-AI Tech
- [Chatterbox](https://github.com/resemble-ai/chatterbox) by Resemble AI
- [Whisper](https://github.com/openai/whisper) by OpenAI
