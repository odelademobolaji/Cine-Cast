"""
Config accessor.

Reads ``config.yaml`` from the project root (one level above this
``backend/`` package). PyYAML is required and listed in requirements.txt;
a minimal hand-rolled parser is kept only as a last-resort fallback for
environments where PyYAML somehow isn't installed.
"""
from __future__ import annotations

from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - PyYAML is a hard dependency
    yaml = None

# backend/config_loader.py  ->  project root is the parent of backend/
ROOT = Path(__file__).resolve().parent.parent
YAML_CONFIG = ROOT / "config.yaml"

_cfg: dict = {}


def _parse_scalar(value: str):
    value = value.split("  #", 1)[0].strip()
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    try:
        return int(value)
    except ValueError:
        return value


def _parse_basic_yaml(text: str) -> dict:
    """
    Minimal fallback parser for the specific shape of config.yaml.

    Only used if PyYAML is unavailable. Handles indent levels 0/2/4,
    scalars, and the two known list keys (fallback_pool, cors_origins).
    """
    data: dict = {}
    current: dict | None = None
    nested: dict | list | None = None

    for raw_line in text.splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue

        indent = len(raw_line) - len(raw_line.lstrip(" "))
        line = raw_line.strip()

        if indent == 0 and line.endswith(":"):
            current = data[line[:-1]] = {}
            nested = None
            continue

        if current is None:
            continue

        if indent == 2 and ":" in line:
            key, _, value = line.partition(":")
            key, value = key.strip(), value.strip()
            if value:
                current[key] = _parse_scalar(value)
                nested = None
            else:
                nested = [] if key in ("fallback_pool", "cors_origins") else {}
                current[key] = nested
            continue

        if indent == 4 and nested is not None:
            if isinstance(nested, list) and line.startswith("- "):
                nested.append(_parse_scalar(line[2:]))
            elif isinstance(nested, dict) and ":" in line:
                k, _, v = line.partition(":")
                nested[_parse_scalar(k.strip())] = _parse_scalar(v.strip())

    return data


def _load_config() -> dict:
    if not YAML_CONFIG.exists():
        raise FileNotFoundError(
            f"config.yaml not found at {YAML_CONFIG}. "
            "Copy/edit the template at the project root."
        )
    text = YAML_CONFIG.read_text(encoding="utf-8")
    data = (yaml.safe_load(text) if yaml else _parse_basic_yaml(text)) or {}
    return {
        "tmdb": data["tmdb"],
        "streams": data["streams"],
        "signing": data["signing"],
        "server": data["server"],
    }


def reload_config() -> dict:
    """Re-read config.yaml from disk (used by /api/admin/reload-config)."""
    global _cfg
    _cfg = _load_config()
    return _cfg


def get_tmdb_key() -> str:
    return _cfg["tmdb"]["api_key"]


def get_tmdb_base() -> str:
    return _cfg["tmdb"]["base_url"]


def get_stream_url(movie_id: int) -> str:
    """
    Resolve a stream URL for a TMDB movie id.

    1. Explicit override in streams.overrides
    2. Deterministic pick from streams.fallback_pool (same id -> same video)
    3. streams.default
    """
    s = _cfg["streams"]

    overrides = s.get("overrides") or {}
    if movie_id in overrides:
        return overrides[movie_id]

    pool = s.get("fallback_pool") or []
    if pool:
        return pool[movie_id % len(pool)]

    return s["default"]


def get_signing_config() -> dict:
    return _cfg["signing"]


def get_cors_origins() -> list[str]:
    return _cfg["server"]["cors_origins"]


reload_config()
