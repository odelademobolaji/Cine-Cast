const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export function backdropUrl(path: string | null, size: string = "original"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function posterUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function getTrending() {
  return fetchJson("/api/tmdb/trending");
}

export async function getTopRated() {
  return fetchJson("/api/tmdb/movie/top-rated");
}

export async function getPopularMovies() {
  return fetchJson("/api/tmdb/movie/popular");
}

export async function getPopularTv() {
  return fetchJson("/api/tmdb/tv/popular");
}

export async function getMovieDetail(movieId: number) {
  return fetchJson(`/api/tmdb/movie/${movieId}`);
}

export interface StreamResponse {
  stream_url: string;
  expires_at: number;
  movie_id: number;
}

export async function getStreamUrl(movieId: number): Promise<any> {
  return fetchJson(`/api/stream/${movieId}`);
}

export const api = {
  trending: getTrending,
  popularMovies: getPopularMovies,
  popularTV: getPopularTv,
  topRated: getTopRated,
  movieDetail: getMovieDetail,
  movie: getMovieDetail,
  streamUrl: getStreamUrl,
  backdropUrl,
  posterUrl,
};

export default api;
