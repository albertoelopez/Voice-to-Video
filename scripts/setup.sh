#!/bin/bash
set -e

echo "=========================================="
echo "VoxVideo Studio Setup"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} $1 found"
        return 0
    else
        echo -e "${RED}[MISSING]${NC} $1 not found"
        return 1
    fi
}

echo ""
echo "Checking prerequisites..."
echo ""

MISSING=0

check_command python3 || MISSING=1
check_command pip3 || MISSING=1
check_command node || MISSING=1
check_command npm || MISSING=1
check_command cargo || MISSING=1
check_command ffmpeg || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Some prerequisites are missing. Please install them first.${NC}"
    echo ""
    echo "Install missing tools:"
    echo "  - Python 3.10+: https://python.org"
    echo "  - Node.js 18+: https://nodejs.org"
    echo "  - Rust: https://rustup.rs"
    echo "  - FFmpeg: sudo apt install ffmpeg"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
if [[ $(echo "$PYTHON_VERSION < 3.10" | bc -l) -eq 1 ]]; then
    echo -e "${RED}Python 3.10+ required, found $PYTHON_VERSION${NC}"
    exit 1
fi

echo ""
echo "Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo ""
echo "Installing Node.js dependencies..."
npm install

echo ""
echo "Installing Tauri CLI..."
cargo install tauri-cli

echo ""
echo "Checking GPU availability..."
python3 -c "
import torch
if torch.cuda.is_available():
    print(f'GPU: {torch.cuda.get_device_name(0)}')
    print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
else:
    print('No CUDA GPU detected. CPU mode will be used (slower).')
"

echo ""
echo "=========================================="
echo -e "${GREEN}Setup complete!${NC}"
echo "=========================================="
echo ""
echo "To start development:"
echo "  1. Activate the virtual environment: source .venv/bin/activate"
echo "  2. Start the backend: python -m uvicorn backend.main:app --reload"
echo "  3. In another terminal: npm run tauri:dev"
echo ""
echo "Note: First run will download AI models (~40GB total)"
echo ""
