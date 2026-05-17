# CineCast — Running in PyCharm

Two-tier app: **Python FastAPI backend** + **Next.js frontend**, with a single `config.yaml` driving everything.

## Prerequisites

Install these on your machine first (one-time setup):

1. **Python 3.10+** — likely already installed if you're using PyCharm
2. **Node.js 18+ LTS** — download from https://nodejs.org/. The Next.js frontend needs this. PyCharm uses whatever Node is on your PATH.

Verify both are available:
```bash
python --version    # should print 3.10+
node --version      # should print v18+
```

If `node --version` errors out, install Node and **restart PyCharm** so it picks up the new PATH.

---

## Setup (one-time)

### 1. Open the project in PyCharm
File → Open → select the `cinecast/` folder.

### 2. Configure the Python interpreter
PyCharm will prompt to create a virtual environment. Accept it. If it doesn't:
- File → Settings → Project: cinecast → Python Interpreter
- Add Interpreter → Add Local Interpreter → Virtualenv → New

### 3. Install Python dependencies
Open PyCharm's terminal (`Alt+F12` or View → Tool Windows → Terminal):
```bash
pip install -r backend/requirements.txt
```

That's it for the Python side. Node dependencies install automatically the first time you run.

---

## Running it

The project ships with three pre-configured run configurations. Pick the one that matches your setup:

### Easiest: "▶ Run All" — works in any PyCharm edition
The dropdown in the top-right of PyCharm will show **▶ Run All**. Click the green play button. This launches `run.py`, which starts both the backend and the frontend as subprocesses and shows both logs in one window. Ctrl+C stops everything cleanly.

This is the recommended option, especially for **PyCharm Community Edition** which doesn't natively support npm.

### PyCharm Professional only: "Run All (Backend + Frontend)"
A compound configuration that launches the two halves in separate run windows. Cleaner output, but only works on Pro.

### Manual: two separate run configs
**"Backend (FastAPI)"** and **"Frontend (Next.js)"** — pick each from the dropdown and run separately. Useful when you want to restart just one half.

---

## Once it's running

- **Frontend**: http://localhost:3000 — open this in your browser
- **Backend**: http://localhost:8000 — FastAPI auto-docs at http://localhost:8000/docs

Click a movie → "Watch now" to hit the player route. The backend signs the stream URL, the frontend loads it.

---

## Changing video sources (no other code changes needed)

Open `config.py` in PyCharm and edit the `STREAMS` dict:

```python
STREAMS = {
    "default": "https://your-cdn.example.com/default.mp4",
    "overrides": {
        1439930: "https://your-cdn.example.com/movies/123.m3u8",
        550: "https://your-cdn.example.com/movies/fight-club.mp4",
    },
    ...
}
```

`uvicorn --reload` watches the file — save it and the backend reloads. Refresh the player page in your browser to pick up the new URL.

Supported formats: MP4, WebM, HLS (`.m3u8`), DASH (`.mpd`). HLS automatically uses hls.js on non-Safari browsers.

---

## Project layout

```
cinecast/
├── config.py                  ← Edit this to change URLs and TMDB key
├── run.py                     ← One-click launcher for both halves
├── .idea/                     ← PyCharm run configs (committed so they survive)
├── backend/
│   ├── main.py                ← FastAPI app
│   ├── config_loader.py       ← Reads ../config.py
│   └── requirements.txt
└── frontend/
    ├── app/                   ← Next.js App Router pages
    │   ├── layout.tsx         ← Server-rendered shell
    │   ├── page.tsx           ← Home (Server Component + Suspense)
    │   ├── movie/[id]/        ← Detail page
    │   └── player/movie/[id]/ ← Player (server shell + 'use client' player)
    ├── components/
    │   ├── VideoPlayer.tsx    ← 'use client' — the client boundary
    │   ├── HeroSection.tsx
    │   ├── MovieRow.tsx
    │   └── MovieRowSkeleton.tsx
    ├── lib/api.ts             ← Backend API client
    └── package.json
```

---

## How this maps to the PDF guide

| PDF concept | Where it lives |
|---|---|
| Streaming SSR + Suspense (§1.2) | `frontend/app/page.tsx` |
| Server Component, async fetch (§1.3) | `app/page.tsx`, `app/movie/[id]/page.tsx`, `components/MovieRow.tsx` |
| Client Component, `'use client'` (§1.4) | `components/VideoPlayer.tsx` |
| Client boundary (§2.3) | Where `<VideoPlayer />` is imported into the player page |
| Native `<video>` (§3.1) | `VideoPlayer.tsx` |
| HLS playback | `VideoPlayer.tsx` via hls.js |
| Custom controls + keyboard (§3.3) | `VideoPlayer.tsx` |
| Shell pattern (§4.1) | `app/layout.tsx` + the routes inside |
| Signed URL API (§4.2) | `backend/main.py` → `generate_signed_url()` |

---

## Troubleshooting

**"Module not found: 'fastapi'"** — `pip install -r backend/requirements.txt` in PyCharm's terminal.

**"node: command not found"** — Install Node.js and restart PyCharm.

**Frontend hangs on "compiling..."** — Wait. The first compile takes 20-40 seconds. Subsequent reloads are instant.

**"npm install failed"** — Network issue. Run `cd frontend && npm install` manually in PyCharm's terminal to see the real error.

**Video shows "Playback failed"** — Open `config.py` and swap to a different URL. The error message tells you what went wrong (network, decode, source not supported, etc.).

**TMDB returns 401** — Your TMDB key is invalid. Get a free one at https://www.themoviedb.org/settings/api and paste it into `config.py` under `TMDB["api_key"]`.

**Backend reloads but frontend still shows old data** — Hard refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`). Next.js caches server-component output.
