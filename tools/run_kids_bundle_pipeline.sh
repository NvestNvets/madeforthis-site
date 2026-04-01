#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-digiapp-clients}"
SECRET_NAME="${SECRET_NAME:-open_api_key}"

export OPENAI_API_KEY="$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID")"

python3 "$ROOT_DIR/tools/generate_kids_bundle.py" "$@"
