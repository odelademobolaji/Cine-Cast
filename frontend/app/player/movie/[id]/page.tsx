import { notFound } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { getMovieDetail } from "@/lib/api";

interface PlayerPageProps {
  params: { id: string };
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function PlayerPage({ params }: PlayerPageProps) {
  const movieId = parseInt(params.id, 10);
  if (isNaN(movieId)) notFound();

  const movieData = await getMovieDetail(movieId);

  // Same-origin proxy so the browser never makes a cross-origin <video>
  // request (this is what fixes the CORS "format not supported" failure).
  const src = `${API_BASE}/api/video/${movieId}`;

  return (
    <div className="player-wrap">
      <a href={`/movie/${movieId}`} className="player-back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </a>

      <VideoPlayer
        src={src}
        poster={
          movieData.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`
            : undefined
        }
        title={movieData.title || movieData.name}
      />

      <div style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          {movieData.title || movieData.name}
        </h1>
        <p style={{ color: "#aaa", marginTop: 8, lineHeight: 1.6 }}>
          {movieData.overview}
        </p>
      </div>
    </div>
  );
}
