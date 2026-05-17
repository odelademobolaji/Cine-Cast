import { notFound } from "next/navigation";
import { getMovieDetail } from "@/lib/api";

interface PlayerPageProps {
  params: { id: string };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const movieId = parseInt(params.id, 10);
  if (isNaN(movieId)) notFound();

  const movieData = await getMovieDetail(movieId);
  const embedUrl = `https://vidnest.fun/movie/${movieId}`;

  return (
    <div className="player-wrap">
      <a href={`/movie/${movieId}`} className="player-back">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Back
      </a>

      <iframe
        className="embed-player"
        src={embedUrl}
        title={movieData.title || movieData.name || "Embedded player"}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />

      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>{movieData.title || movieData.name}</h2>
        <p>{movieData.overview}</p>
        <div style={{ marginTop: 12, fontSize: 12, color: "#888", fontFamily: "monospace", wordBreak: "break-all" }}>
          Embed: {embedUrl}
        </div>
      </div>
    </div>
  );
}
