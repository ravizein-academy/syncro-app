#!/bin/bash

# =======================================================
# Syncro - Auto Push to GitHub Script
# =======================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR" || exit 1

do_push() {
  # Check if there are changes (staged, unstaged, or untracked)
  if [[ -n $(git status -s) ]]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    MSG="${1:-update: auto-sync $TIMESTAMP}"
    
    echo "📦 Perubahan terdeteksi, melakukan auto commit & push..."
    git add .
    git commit -m "$MSG"
    
    if git push origin main; then
      echo "✅ Berhasil push ke GitHub pada $TIMESTAMP"
    else
      echo "⚠️ Gagal push ke GitHub. Periksa koneksi internet atau token."
    fi
  else
    echo "✨ Tidak ada perubahan baru. Repository sudah up-to-date."
  fi
}

# Mode 1: Watch mode (terus berjalan di background dan push setiap ada perubahan)
if [[ "$1" == "--watch" || "$1" == "-w" ]]; then
  echo "🚀 Auto-Push Watcher aktif! Memantau file setiap 20 detik..."
  echo "Tekan Ctrl + C untuk menghentikan."
  
  while true; do
    if [[ -n $(git status -s) ]]; then
      do_push "update: auto-sync $(date "+%Y-%m-%d %H:%M:%S")"
    fi
    sleep 20
  done
else
  # Mode 2: Sekali jalan (Instant Push)
  COMMIT_MSG="$1"
  do_push "$COMMIT_MSG"
fi
