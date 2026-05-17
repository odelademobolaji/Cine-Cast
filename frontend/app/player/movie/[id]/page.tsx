import { notFound } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { getMovieDetail, getMovieSources, pickBestSource, getProxiedVideoUrl } from "@/lib/api";

interface PlayerPageProps {
  params: { id: string };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const movieId = parseInt(params.id, 10);
  if (isNaN(movieId)) notFound();

  const movieData = await getMovieDetail(movieId);
  let videoUrl: string | null = null;
  let fallbackVideoUrls: string[] = [];
  let videoTitle = movieData.title || movieData.name || "Unknown";
  let sourceInfo: { provider: string; quality?: string; type?: string; count: number } | null = null;

  try {
    const sourceResponse = await getMovieSources(movieId);
    const bestSource = pickBestSource(sourceResponse.sources);

    if (bestSource) {
      const orderedSources = [
        bestSource,
        ...sourceResponse.sources.filter((source) => source.url !== bestSource.url),
      ];
      const playableUrls = orderedSources.map((source) => getProxiedVideoUrl(source.url));
      videoUrl = playableUrls[0] || null;
      fallbackVideoUrls = playableUrls.slice(1);
      videoTitle = sourceResponse.title || videoTitle;
      sourceInfo = {
        provider: bestSource.provider,
        quality: bestSource.quality,
        type: bestSource.type,
        count: sourceResponse.sources.length,
      };
    }
  } catch (error) {
    console.error("Failed to fetch Cineby sources:", error);
  }

  return (
    <div className="player-wrap">
      <a href={`/movie/${movieId}`} className="player-back">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Back
      </a>

      {videoUrl ? (
        <VideoPlayer
          src={videoUrl}
          fallbackSources={fallbackVideoUrls}
          poster={movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : undefined}
          title={videoTitle}
        />
      ) : (
        <div className="vp-container">
          <div className="vp-video" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", padding: 24, textAlign: "center" }}>
            No playable API source was returned for this title.
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>{movieData.title || movieData.name}</h2>
        <p>{movieData.overview}</p>
        {sourceInfo ? (
          <div style={{ marginTop: 12, fontSize: 12, color: "#888", fontFamily: "monospace" }}>
            <div>Provider: {sourceInfo.provider}</div>
            {sourceInfo.quality && <div>Quality: {sourceInfo.quality}</div>}
            {sourceInfo.type && <div>Format: {sourceInfo.type.toUpperCase()}</div>}
            <div>Sources found: {sourceInfo.count}</div>
            <div style={{ marginTop: 4, wordBreak: "break-all" }}>
              URL: {videoUrl ? `${videoUrl.substring(0, 80)}...` : "none"}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 12, color: "#888", fontFamily: "monospace" }}>
            Sources found: 0
          </div>
        )}
      </div>
    </div>
  );
}
