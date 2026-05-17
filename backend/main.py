"""
CineCast backend.

Responsibilities:
1. Proxy TMDB so the API key never reaches the browser.
2. Issue signed, time-limited stream URLs (PDF section 4.2).
3. Proxy video bytes through our own origin so the browser never makes a
   cross-origin <video> request (this is what avoids the CORS failure that
   showed up as "Video format not supported" in the player).

Run:
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import hashlib
import hmac
import time
from typing import Annotated

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config_loader import (
    get_cors_origins,
    get_signing_config,
    get_stream_url,
    get_tmdb_base,
    get_tmdb_key,
    reload_config,
)

app = FastAPI(title="CineCast Backend", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# A single shared async client is reused for the lifetime of the process
# instead of creating/destroying one per request.
_http = httpx.AsyncClient(timeout=15.0, follow_redirects=True)


@app.on_event("shutdown")
async def _close_http_client() -> None:
    await _http.aclose()


# ---------------------------------------------------------------------------
# Auth stub
# ---------------------------------------------------------------------------
def verify_auth(authorization: str | None) -> str:
    """Demo auth. Anonymous allowed; any Bearer token IS the user id."""
    if not authorization:
        return "anonymous"
    if authorization.startswith("Bearer "):
        return authorization[7:]
    raise HTTPException(status_code=401, detail="Invalid auth header")


# ---------------------------------------------------------------------------
# TMDB proxy
# ---------------------------------------------------------------------------
async def tmdb_get(path: str, params: dict | None = None) -> dict:
    """Forward a GET request to TMDB with the API key attached server-side."""
    params = dict(params or {})
    params["api_key"] = get_tmdb_key()
    url = f"{get_tmdb_base()}{path}"
    r = await _http.get(url, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"TMDB: {r.text}")
    return r.json()


@app.get("/api/tmdb/trending")
async def trending(window: str = "week"):
    return await tmdb_get(f"/trending/movie/{window}")


@app.get("/api/tmdb/movie/top-rated")
async def top_rated(page: int = 1):
    return await tmdb_get("/movie/top_rated", {"page": page})


@app.get("/api/tmdb/movie/popular")
async def popular_movies(page: int = 1):
    return await tmdb_get("/movie/popular", {"page": page})


@app.get("/api/tmdb/tv/popular")
async def popular_tv(page: int = 1):
    return await tmdb_get("/tv/popular", {"page": page})


@app.get("/api/tmdb/movie/{movie_id}")
async def movie_detail(movie_id: int):
    return await tmdb_get(f"/movie/{movie_id}")


@app.get("/api/tmdb/tv/{tv_id}")
async def tv_detail(tv_id: int):
    return await tmdb_get(f"/tv/{tv_id}")


@app.get("/api/tmdb/search")
async def search(query: str):
    return await tmdb_get("/search/multi", {"query": query})


# ---------------------------------------------------------------------------
# Stream URL signing (PDF section 4.2)
# ---------------------------------------------------------------------------
class StreamResponse(BaseModel):
    stream_url: str
    expires_at: int
    movie_id: int


def generate_signed_url(
    movie_id: int, user_id: str, client_ip: str | None
) -> StreamResponse:
    """
    Issue a time-limited, HMAC-signed reference for a movie.

    The URL handed to the browser points at THIS backend's /api/video route,
    not the third-party source. That keeps playback same-origin (no CORS) and
    means signature params never get appended to the real media URL.
    """
    cfg = get_signing_config()
    expiry = int(time.time()) + cfg["expiry_seconds"]

    parts = [str(movie_id), user_id, str(expiry)]
    if cfg.get("bind_to_ip") and client_ip:
        parts.append(client_ip)
    payload = "|".join(parts).encode()

    signature = hmac.new(
        cfg["secret"].encode(), payload, hashlib.sha256
    ).hexdigest()

    stream_url = f"/api/video/{movie_id}?exp={expiry}&sig={signature}"
    return StreamResponse(
        stream_url=stream_url, expires_at=expiry, movie_id=movie_id
    )


@app.get("/api/stream/{movie_id}", response_model=StreamResponse)
async def get_stream(
    movie_id: int,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
):
    user_id = verify_auth(authorization)
    # In production, check the user's subscription / rights here.
    client_ip = request.client.host if request.client else None
    return generate_signed_url(movie_id, user_id, client_ip)


# ---------------------------------------------------------------------------
# Video proxy  — the actual fix for the black screen
# ---------------------------------------------------------------------------
# The browser only ever talks to http://localhost:8000 for media, so the
# third-party host's missing CORS headers can no longer block the <video>
# element. Range headers are forwarded so seeking still works.
@app.get("/api/video/{movie_id}")
async def proxy_video(movie_id: int, request: Request):
    source_url = get_stream_url(movie_id)

    fwd_headers: dict[str, str] = {}
    range_header = request.headers.get("range")
    if range_header:
        fwd_headers["Range"] = range_header

    upstream_req = _http.build_request("GET", source_url, headers=fwd_headers)
    upstream = await _http.send(upstream_req, stream=True)

    passthrough = ("content-type", "content-length", "content-range")
    resp_headers = {
        h: upstream.headers[h] for h in passthrough if h in upstream.headers
    }
    resp_headers["accept-ranges"] = upstream.headers.get(
        "accept-ranges", "bytes"
    )

    async def body():
        try:
            async for chunk in upstream.aiter_bytes():
                yield chunk
        finally:
            await upstream.aclose()

    return StreamingResponse(
        body(), status_code=upstream.status_code, headers=resp_headers
    )


# ---------------------------------------------------------------------------
# Admin / health
# ---------------------------------------------------------------------------
@app.post("/api/admin/reload-config")
async def reload():
    reload_config()
    return {"status": "reloaded"}


@app.get("/health")
async def health():
    return {"status": "ok"}
