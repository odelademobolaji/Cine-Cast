"""
Launcher for the full CineCast stack.

Starts the FastAPI backend and the Next.js frontend as subprocesses and
pipes their output to this terminal. Ctrl+C stops both cleanly.

    python run.py
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def check_prereqs() -> None:
    try:
        import fastapi  # noqa: F401
        import uvicorn  # noqa: F401
        import httpx  # noqa: F401
        import yaml  # noqa: F401
    except ImportError as e:
        print(f"Missing Python dependency: {e.name}")
        print(f"   Run: pip install -r {ROOT / 'requirements.txt'}")
        sys.exit(1)

    try:
        subprocess.run(
            ["node", "--version"], check=True, capture_output=True, text=True
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("Node.js not found on PATH. Install LTS from https://nodejs.org/")
        sys.exit(1)

    if not (FRONTEND / "node_modules").exists():
        print("Installing frontend dependencies (one-time)...")
        npm = "npm.cmd" if os.name == "nt" else "npm"
        if subprocess.run([npm, "install"], cwd=FRONTEND).returncode != 0:
            print("npm install failed.")
            sys.exit(1)


def main() -> None:
    check_prereqs()

    print("Starting CineCast...")
    print("   Backend:  http://localhost:8000")
    print("   Frontend: http://localhost:3000")
    print(f"   Config:   {ROOT / 'config.yaml'}")
    print("   Press Ctrl+C to stop both\n")

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=BACKEND,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
    )
    time.sleep(1.5)

    npm = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm, "run", "dev"],
        cwd=FRONTEND,
        env={**os.environ, "BACKEND_URL": "http://localhost:8000"},
    )

    def shutdown(*_):
        print("\nShutting down...")
        for p in (frontend_proc, backend_proc):
            try:
                p.terminate()
            except Exception:
                pass
        for p in (frontend_proc, backend_proc):
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    while True:
        if backend_proc.poll() is not None:
            print("Backend exited unexpectedly")
            shutdown()
        if frontend_proc.poll() is not None:
            print("Frontend exited unexpectedly")
            shutdown()
        time.sleep(0.5)


if __name__ == "__main__":
    main()
