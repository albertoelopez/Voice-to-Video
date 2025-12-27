#!/bin/bash
set -e

echo "=========================================="
echo "Downloading AI Models"
echo "=========================================="

CACHE_DIR="${VOXVIDEO_MODEL_CACHE:-$HOME/.cache/voxvideo}"
mkdir -p "$CACHE_DIR"

echo ""
echo "Models will be downloaded to: $CACHE_DIR"
echo "Total download size: ~40GB"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "[1/3] Downloading Whisper model..."
python3 -c "
import whisper
print('Downloading Whisper base model...')
whisper.load_model('base')
print('Done!')
"

echo ""
echo "[2/3] Downloading Chatterbox model..."
python3 -c "
from chatterbox.tts_turbo import ChatterboxTurboTTS
print('Downloading Chatterbox Turbo model...')
ChatterboxTurboTTS.from_pretrained(device='cpu')
print('Done!')
"

echo ""
echo "[3/3] Downloading Open-Sora model..."
echo "Installing huggingface-cli..."
pip install "huggingface_hub[cli]"
huggingface-cli download hpcai-tech/Open-Sora-v2 --local-dir "$CACHE_DIR/Open-Sora"

echo ""
echo "=========================================="
echo "All models downloaded successfully!"
echo "=========================================="
