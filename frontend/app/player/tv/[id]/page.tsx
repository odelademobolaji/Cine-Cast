import { notFound } from "next/navigation";
import { getTvDetail } from "@/lib/api";

interface TvPlayerPageProps {
  params: { id: string };
  searchParams: { season?: string; episode?: string };
}

export default async function TvPlayerPage({ params, searchParams }: TvPlayerPageProps) {
  const tvId = parseInt(params.id, 10);
  const season = parseInt(searchParams.season || "1", 10);
  const episode = parseInt(searchParams.episode || "1", 10);
  if (isNaN(tvId)) notFound();

  const tvData = await getTvDetail(tvId);
  const embedUrl = `https://vidnest.fun/tv/${tvId}/${season}/${episode}`;

  return (
    <div className="player-wrap">
      <a href={`/tv/${tvId}`} className="player-back">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Back
      </a>

      <iframe
        className="embed-player"
        src={embedUrl}
        title={`${tvData.name || tvData.title || "Embedded player"} - S${season}E${episode}`}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />

      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>{tvData.name || tvData.title}</h2>
        <p>Season {season}, Episode {episode}</p>
        <p>{tvData.overview}</p>
        <div style={{ marginTop: 12, fontSize: 12, color: "#888", fontFamily: "monospace", wordBreak: "break-all" }}>
          Embed: {embedUrl}
        </div>
      </div>
    </div>
  );
}
