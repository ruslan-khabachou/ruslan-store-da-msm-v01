#!/usr/bin/env bash

# Backward-compatible entry point. New automation should use rollout-msm-org.sh.
set -Eeo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/rollout-msm-org.sh" "$@"
